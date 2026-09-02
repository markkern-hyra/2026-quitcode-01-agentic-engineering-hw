'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';
import type {
  GameMode,
  GameSnapshot,
  Interaction,
  LegalTargets,
  PromotionPiece,
} from '@/lib/types';
import { initialIdentity, nextIdentity, type IdentityMap } from '@/lib/chess/identity';
import { buildSnapshot, isGameOver } from '@/lib/chess/snapshot';
import { describeMove } from '@/lib/chess/labels';
import type { Difficulty } from '@/engine/protocol';

export type GameState = {
  snapshot: GameSnapshot;
  orientation: Color;
  mode: GameMode;
  botColor: Color;
  difficulty: Difficulty;
  interaction: Interaction;
  legalTargets: LegalTargets;
  /** Anchor for the board's roving tabIndex. */
  focusSquare: Square;
  pendingPromotion: { from: Square; to: Square } | null;
  announcement: string;
  showCoordinates: boolean;
  showLegalMoves: boolean;
};

type GameAction =
  | { type: 'sync'; snapshot: GameSnapshot; announcement: string; focusSquare?: Square }
  | { type: 'select'; square: Square; targets: LegalTargets }
  | { type: 'deselect' }
  | { type: 'dragStart'; square: Square; pointerId: number }
  | { type: 'dragEnd' }
  | { type: 'promotionRequest'; from: Square; to: Square }
  | { type: 'promotionCancel' }
  | { type: 'setFocus'; square: Square }
  | { type: 'setOrientation'; color: Color }
  | { type: 'setMode'; mode: GameMode }
  | { type: 'setDifficulty'; difficulty: Difficulty }
  | { type: 'setBotColor'; color: Color }
  | { type: 'setOption'; key: 'showCoordinates' | 'showLegalMoves'; value: boolean };

const NO_TARGETS: LegalTargets = {};

/** Pure: it never touches the Chess instance. Snapshots arrive pre-computed. */
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'sync':
      return {
        ...state,
        snapshot: action.snapshot,
        announcement: action.announcement,
        interaction: { kind: 'idle' },
        legalTargets: NO_TARGETS,
        pendingPromotion: null,
        focusSquare: action.focusSquare ?? state.focusSquare,
      };
    case 'select':
      return {
        ...state,
        interaction: { kind: 'selected', from: action.square },
        legalTargets: action.targets,
        focusSquare: action.square,
      };
    case 'deselect':
      return { ...state, interaction: { kind: 'idle' }, legalTargets: NO_TARGETS };
    case 'dragStart':
      return {
        ...state,
        interaction: { kind: 'dragging', from: action.square, pointerId: action.pointerId },
      };
    case 'dragEnd':
      return state.interaction.kind === 'dragging'
        ? { ...state, interaction: { kind: 'selected', from: state.interaction.from } }
        : state;
    case 'promotionRequest':
      return { ...state, pendingPromotion: { from: action.from, to: action.to } };
    case 'promotionCancel':
      return {
        ...state,
        pendingPromotion: null,
        interaction: { kind: 'idle' },
        legalTargets: NO_TARGETS,
      };
    case 'setFocus':
      return { ...state, focusSquare: action.square };
    case 'setOrientation':
      return { ...state, orientation: action.color };
    case 'setMode':
      return { ...state, mode: action.mode };
    case 'setDifficulty':
      return { ...state, difficulty: action.difficulty };
    case 'setBotColor':
      return { ...state, botColor: action.color };
    case 'setOption':
      return { ...state, [action.key]: action.value };
  }
}

/**
 * The mutable, non-rendering half of the game: a `Chess` instance plus the
 * bookkeeping that lets undo be a pop rather than a replay. It lives in a ref
 * and is only ever touched from event handlers and effects — never during
 * render, which is the one rule refs actually have.
 */
type GameCore = {
  chess: Chess;
  /** One identity map per ply. */
  identityStack: IdentityMap[];
  captured: { w: PieceSymbol[]; b: PieceSymbol[] };
  /** What each ply captured, so undo can take it back out of the tray. */
  captureStack: Array<{ by: Color; piece: PieceSymbol } | null>;
};

function createCore(): GameCore {
  const chess = new Chess();
  return {
    chess,
    identityStack: [initialIdentity(chess)],
    captured: { w: [], b: [] },
    captureStack: [],
  };
}

function freshSnapshot(chess: Chess, identity: IdentityMap): GameSnapshot {
  return buildSnapshot(chess, identity, null, { w: [], b: [] });
}

/**
 * Built from its own throwaway board rather than from the core, so that no ref
 * is read during render. Piece ids are assigned deterministically, so this map
 * and the core's agree.
 */
function initialState(): GameState {
  const chess = new Chess();
  return {
    snapshot: freshSnapshot(chess, initialIdentity(chess)),
    orientation: 'w',
    mode: 'vs-bot',
    botColor: 'b',
    difficulty: 'medium',
    interaction: { kind: 'idle' },
    legalTargets: NO_TARGETS,
    focusSquare: 'e2',
    pendingPromotion: null,
    announcement: '',
    showCoordinates: true,
    showLegalMoves: true,
  };
}

function buildLegalTargets(chess: Chess, square: Square): LegalTargets {
  const targets: Record<string, 'move' | 'capture'> = {};
  // The one place `verbose` is affordable: once per selection, never in a loop.
  for (const move of chess.moves({ square, verbose: true })) {
    targets[move.to] = move.captured ? 'capture' : 'move';
  }
  return targets;
}

export type GameActions = {
  /** Single entry point for click, tap and Enter/Space. */
  activateSquare: (square: Square) => void;
  beginDrag: (square: Square, pointerId: number) => void;
  dropOn: (square: Square | null) => void;
  cancelDrag: () => void;
  choosePromotion: (piece: PromotionPiece) => void;
  cancelPromotion: () => void;
  applyEngineMove: (san: string) => void;
  undo: () => void;
  newGame: () => void;
  flip: () => void;
  moveFocus: (square: Square) => void;
  setMode: (mode: GameMode) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setBotColor: (color: Color) => void;
  setOption: (key: 'showCoordinates' | 'showLegalMoves', value: boolean) => void;
};

export function useChessGame(): { state: GameState; actions: GameActions } {
  const [state, dispatch] = useReducer(gameReducer, undefined, initialState);

  const coreRef = useRef<GameCore | null>(null);
  const getCore = useCallback((): GameCore => (coreRef.current ??= createCore()), []);

  // `actions` must never change identity — the board's React.memo story depends
  // on it — so callbacks read the latest state through this ref instead of
  // closing over `state`. Written in an effect, read only from handlers; both
  // run after the render that produced the value.
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);

  /** The mutable/immutable bridge, and the only place the board changes. */
  const commit = useCallback(
    (from: Square, to: Square, promotion?: PromotionPiece): boolean => {
      const core = getCore();
      let move: Move;
      try {
        // chess.js v1 throws on an illegal move; it no longer returns null.
        move = core.chess.move({ from, to, promotion });
      } catch {
        dispatch({ type: 'deselect' });
        return false;
      }

      if (move.captured) {
        core.captured[move.color].push(move.captured);
        core.captureStack.push({ by: move.color, piece: move.captured });
      } else {
        core.captureStack.push(null);
      }

      const identity = nextIdentity(core.identityStack[core.identityStack.length - 1], move);
      core.identityStack.push(identity);

      dispatch({
        type: 'sync',
        snapshot: buildSnapshot(
          core.chess,
          identity,
          { from: move.from, to: move.to },
          core.captured,
        ),
        announcement: describeMove(move, core.chess),
        focusSquare: move.to,
      });
      return true;
    },
    [getCore],
  );

  const needsPromotion = useCallback(
    (from: Square, to: Square): boolean =>
      getCore()
        .chess.moves({ square: from, verbose: true })
        .some((move) => move.to === to && Boolean(move.promotion)),
    [getCore],
  );

  const activateSquare = useCallback(
    (square: Square) => {
      const { interaction, snapshot, legalTargets } = latest.current;
      if (isGameOver(snapshot.status)) return;

      const chess = getCore().chess;
      const piece = snapshot.occupancy[square];
      const isOwnPiece = piece?.color === snapshot.turn;

      if (interaction.kind === 'idle') {
        if (isOwnPiece) {
          dispatch({ type: 'select', square, targets: buildLegalTargets(chess, square) });
        } else {
          dispatch({ type: 'setFocus', square });
        }
        return;
      }

      const from = interaction.from;
      if (from === square) {
        dispatch({ type: 'deselect' });
        return;
      }
      if (isOwnPiece) {
        // Re-target rather than deselecting first — one dispatch, not two.
        dispatch({ type: 'select', square, targets: buildLegalTargets(chess, square) });
        return;
      }
      if (legalTargets[square]) {
        if (needsPromotion(from, square)) {
          dispatch({ type: 'promotionRequest', from, to: square });
        } else {
          commit(from, square);
        }
        return;
      }
      dispatch({ type: 'deselect' });
    },
    [getCore, commit, needsPromotion],
  );

  const actions = useMemo<GameActions>(
    () => ({
      activateSquare,
      beginDrag: (square, pointerId) => dispatch({ type: 'dragStart', square, pointerId }),
      cancelDrag: () => dispatch({ type: 'dragEnd' }),
      dropOn: (square) => {
        const { interaction, legalTargets } = latest.current;
        if (interaction.kind !== 'dragging') return;
        const from = interaction.from;
        if (square === null || square === from || !legalTargets[square]) {
          dispatch({ type: 'dragEnd' });
          return;
        }
        if (needsPromotion(from, square)) {
          dispatch({ type: 'dragEnd' });
          dispatch({ type: 'promotionRequest', from, to: square });
        } else {
          commit(from, square);
        }
      },
      choosePromotion: (piece) => {
        const pending = latest.current.pendingPromotion;
        if (pending) commit(pending.from, pending.to, piece);
      },
      cancelPromotion: () => dispatch({ type: 'promotionCancel' }),
      applyEngineMove: (san) => {
        const { mode, botColor, snapshot } = latest.current;
        // Defensive: the engine must never be able to move out of turn.
        if (mode !== 'vs-bot' || snapshot.turn !== botColor || isGameOver(snapshot.status)) return;
        const legal = getCore()
          .chess.moves({ verbose: true })
          .find((move) => move.san === san);
        if (!legal) return;
        commit(legal.from, legal.to, legal.promotion as PromotionPiece | undefined);
      },
      undo: () => {
        const core = getCore();
        const { mode, botColor, snapshot } = latest.current;
        // Against the bot, take back the pair so it stays the human's turn.
        const plies = mode === 'vs-bot' && snapshot.turn !== botColor ? 2 : 1;

        let undone = 0;
        for (let i = 0; i < plies; i++) {
          if (core.chess.undo() === null) break;
          const capture = core.captureStack.pop();
          if (capture) {
            const list = core.captured[capture.by];
            const index = list.lastIndexOf(capture.piece);
            if (index !== -1) list.splice(index, 1);
          }
          if (core.identityStack.length > 1) core.identityStack.pop();
          undone++;
        }
        if (undone === 0) return;

        const previous = core.chess.history({ verbose: true }).at(-1);
        dispatch({
          type: 'sync',
          snapshot: buildSnapshot(
            core.chess,
            core.identityStack[core.identityStack.length - 1],
            previous ? { from: previous.from, to: previous.to } : null,
            core.captured,
          ),
          announcement: `Took back ${undone === 2 ? 'two moves' : 'one move'}.`,
        });
      },
      newGame: () => {
        const core = getCore();
        core.chess.reset();
        // Mutate in place: `core`'s fields are stable containers.
        core.captured.w.length = 0;
        core.captured.b.length = 0;
        core.captureStack.length = 0;
        core.identityStack.length = 0;
        core.identityStack.push(initialIdentity(core.chess));
        dispatch({
          type: 'sync',
          snapshot: freshSnapshot(core.chess, core.identityStack[0]),
          announcement: 'New game. White to move.',
          focusSquare: 'e2',
        });
      },
      flip: () =>
        dispatch({
          type: 'setOrientation',
          color: latest.current.orientation === 'w' ? 'b' : 'w',
        }),
      moveFocus: (square) => dispatch({ type: 'setFocus', square }),
      setMode: (mode) => dispatch({ type: 'setMode', mode }),
      setDifficulty: (difficulty) => dispatch({ type: 'setDifficulty', difficulty }),
      setBotColor: (color) => dispatch({ type: 'setBotColor', color }),
      setOption: (key, value) => dispatch({ type: 'setOption', key, value }),
    }),
    [getCore, activateSquare, commit, needsPromotion],
  );

  return { state, actions };
}
