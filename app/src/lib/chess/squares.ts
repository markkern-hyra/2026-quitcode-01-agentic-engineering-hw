import type { Color, Square } from 'chess.js';

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export const ALL_SQUARES: readonly Square[] = RANKS.slice()
  .reverse()
  .flatMap((rank) => FILES.map((file) => `${file}${rank}` as Square));

export function fileIndex(square: Square): number {
  return square.charCodeAt(0) - 97; // 'a'
}

export function rankIndex(square: Square): number {
  return square.charCodeAt(1) - 49; // '1'
}

/** a1 is dark: file 0 + rank 0 is even, so even sums are the dark squares. */
export function isLightSquare(square: Square): boolean {
  return (fileIndex(square) + rankIndex(square)) % 2 === 1;
}

/**
 * Board coordinates in grid units, origin top-left.
 *
 * Orientation is applied here rather than by rotating the board 180deg: a CSS
 * rotation would need every glyph and coordinate label counter-rotated, and it
 * would break pointer hit-testing.
 */
export function toXY(square: Square, orientation: Color): { x: number; y: number } {
  const file = fileIndex(square);
  const rank = rankIndex(square);
  return orientation === 'w'
    ? { x: file, y: 7 - rank }
    : { x: 7 - file, y: rank };
}

/** The squares in render order (row-major, top-left first) for an orientation. */
export function orientedSquares(orientation: Color): Square[][] {
  const ranks = orientation === 'w' ? RANKS.slice().reverse() : RANKS.slice();
  const files = orientation === 'w' ? FILES.slice() : FILES.slice().reverse();
  return ranks.map((rank) => files.map((file) => `${file}${rank}` as Square));
}
