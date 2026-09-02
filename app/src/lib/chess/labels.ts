import type { Chess, Color, Move, PieceSymbol, Square } from 'chess.js';
import type { GameSnapshot, GameStatus, LegalTargets } from '@/lib/types';
import { turnLabel } from '@/lib/chess/snapshot';

export const PIECE_NAME: Record<PieceSymbol, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

/**
 * Spoken name for one square: coordinate first, because that is what a player
 * navigating by keyboard is tracking, then contents, then state.
 */
export function squareLabel(
  square: Square,
  snapshot: GameSnapshot,
  targets: LegalTargets,
): string {
  const piece = snapshot.occupancy[square];
  const parts: string[] = [square];

  if (piece) {
    parts.push(`${turnLabel(piece.color).toLowerCase()} ${PIECE_NAME[piece.type]}`);
  } else {
    parts.push('empty');
  }

  if (snapshot.checkSquare === square) parts.push('in check');

  const target = targets[square];
  if (target === 'capture') parts.push('legal capture');
  else if (target === 'move') parts.push('legal move');

  return parts.join(', ');
}

function statusSentence(status: GameStatus): string | null {
  switch (status.kind) {
    case 'checkmate':
      return `Checkmate. ${turnLabel(status.winner)} wins.`;
    case 'stalemate':
      return 'Stalemate. The game is a draw.';
    case 'draw':
      return status.reason === 'fifty-move'
        ? 'Draw by the fifty-move rule.'
        : status.reason === 'threefold'
          ? 'Draw by threefold repetition.'
          : 'Draw by insufficient material.';
    case 'playing':
      return status.check ? 'Check.' : null;
  }
}

/** A full sentence for the live region, e.g. "White plays knight f3. Check." */
export function describeMove(move: Move, chess: Chess): string {
  const mover = turnLabel(move.color);
  let action: string;

  if (move.isKingsideCastle()) {
    action = 'castles kingside';
  } else if (move.isQueensideCastle()) {
    action = 'castles queenside';
  } else {
    const piece = PIECE_NAME[move.piece];
    const verb = move.captured ? `takes ${PIECE_NAME[move.captured]} on` : 'to';
    action = `plays ${piece} ${verb} ${move.to}`;
    if (move.isEnPassant()) action += ' en passant';
    if (move.promotion) action += `, promoting to ${PIECE_NAME[move.promotion]}`;
  }

  const sentences = [`${mover} ${action}.`];
  const status = statusSentence(readStatusForAnnounce(chess));
  if (status) sentences.push(status);
  return sentences.join(' ');
}

function readStatusForAnnounce(chess: Chess): GameStatus {
  if (chess.isCheckmate()) return { kind: 'checkmate', winner: chess.turn() === 'w' ? 'b' : 'w' };
  if (chess.isStalemate()) return { kind: 'stalemate' };
  if (chess.isInsufficientMaterial()) return { kind: 'draw', reason: 'insufficient-material' };
  if (chess.isThreefoldRepetition()) return { kind: 'draw', reason: 'threefold' };
  if (chess.isDrawByFiftyMoves()) return { kind: 'draw', reason: 'fifty-move' };
  return { kind: 'playing', check: chess.isCheck() };
}

/** Short, human status text for the header tag. Never colour-only. */
export function statusText(status: GameStatus, turn: Color): string {
  switch (status.kind) {
    case 'checkmate':
      return `Checkmate — ${turnLabel(status.winner)} wins`;
    case 'stalemate':
      return 'Stalemate — draw';
    case 'draw':
      return status.reason === 'fifty-move'
        ? 'Draw — fifty-move rule'
        : status.reason === 'threefold'
          ? 'Draw — threefold repetition'
          : 'Draw — insufficient material';
    case 'playing':
      return status.check ? `${turnLabel(turn)} to move — check` : `${turnLabel(turn)} to move`;
  }
}
