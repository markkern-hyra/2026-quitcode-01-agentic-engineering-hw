import type { Chess, Color, PieceSymbol, Square } from 'chess.js';
import type { GameSnapshot, GameStatus, HistoryEntry, MovePair, PieceOnBoard } from '@/lib/types';
import type { IdentityMap } from '@/lib/chess/identity';
import { materialDelta } from '@/lib/chess/material';

function readStatus(chess: Chess): GameStatus {
  if (chess.isCheckmate()) {
    // The side to move is mated, so the other side won.
    return { kind: 'checkmate', winner: chess.turn() === 'w' ? 'b' : 'w' };
  }
  if (chess.isStalemate()) return { kind: 'stalemate' };
  if (chess.isInsufficientMaterial()) return { kind: 'draw', reason: 'insufficient-material' };
  if (chess.isThreefoldRepetition()) return { kind: 'draw', reason: 'threefold' };
  if (chess.isDrawByFiftyMoves()) return { kind: 'draw', reason: 'fifty-move' };
  return { kind: 'playing', check: chess.isCheck() };
}

function findCheckedKing(chess: Chess): Square | null {
  if (!chess.isCheck()) return null;
  return chess.findPiece({ type: 'k', color: chess.turn() })[0] ?? null;
}

function readHistory(chess: Chess): HistoryEntry[] {
  return chess.history().map((san, index) => ({
    ply: index + 1,
    moveNumber: Math.floor(index / 2) + 1,
    color: index % 2 === 0 ? 'w' : 'b',
    san,
  }));
}

export function buildSnapshot(
  chess: Chess,
  identity: IdentityMap,
  lastMove: { from: Square; to: Square } | null,
  captured: { w: readonly PieceSymbol[]; b: readonly PieceSymbol[] },
): GameSnapshot {
  const pieces: PieceOnBoard[] = [];
  const occupancy: Partial<Record<Square, PieceOnBoard>> = {};

  for (const row of chess.board()) {
    for (const cell of row) {
      if (!cell) continue;
      const piece: PieceOnBoard = {
        id: identity.get(cell.square) ?? `${cell.color}-${cell.type}-${cell.square}`,
        color: cell.color,
        type: cell.type,
        square: cell.square,
      };
      pieces.push(piece);
      occupancy[cell.square] = piece;
    }
  }

  const history = readHistory(chess);

  return {
    fen: chess.fen(),
    turn: chess.turn(),
    pieces,
    occupancy,
    lastMove,
    checkSquare: findCheckedKing(chess),
    status: readStatus(chess),
    history,
    captured: { w: captured.w.slice(), b: captured.b.slice() },
    materialDelta: materialDelta(captured),
    ply: history.length,
  };
}

/** Group the flat ply list into numbered rows for the history table. */
export function toMovePairs(history: readonly HistoryEntry[]): MovePair[] {
  const pairs: MovePair[] = [];
  for (const entry of history) {
    const last = pairs.at(-1);
    if (entry.color === 'w' || !last || last.black !== null) {
      pairs.push({
        moveNumber: entry.moveNumber,
        white: entry.color === 'w' ? entry : null,
        black: entry.color === 'b' ? entry : null,
      });
    } else {
      last.black = entry;
    }
  }
  return pairs;
}

export function isGameOver(status: GameStatus): boolean {
  return status.kind !== 'playing';
}

export function turnLabel(color: Color): string {
  return color === 'w' ? 'White' : 'Black';
}
