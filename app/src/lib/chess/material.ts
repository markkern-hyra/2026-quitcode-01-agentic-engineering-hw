import type { PieceSymbol } from 'chess.js';

export const PIECE_VALUE: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

/** Positive means white is ahead, in pawns. */
export function materialDelta(captured: {
  w: readonly PieceSymbol[];
  b: readonly PieceSymbol[];
}): number {
  const sum = (list: readonly PieceSymbol[]) =>
    list.reduce((total, piece) => total + PIECE_VALUE[piece], 0);
  // captured.w is what White captured, i.e. Black's losses.
  return sum(captured.w) - sum(captured.b);
}

/** Heaviest first, so a tray reads like a scoreboard. */
export function sortCaptured(list: readonly PieceSymbol[]): PieceSymbol[] {
  return list.slice().sort((a, b) => PIECE_VALUE[b] - PIECE_VALUE[a]);
}
