import type { Chess, Move, Square } from 'chess.js';

/**
 * chess.js reports squares and piece types, but not identity. Without stable
 * ids React re-keys the piece list on every move and pieces teleport instead of
 * sliding. This map is maintained incrementally alongside the game.
 */
export type IdentityMap = ReadonlyMap<Square, string>;

export function initialIdentity(chess: Chess): IdentityMap {
  const map = new Map<Square, string>();
  let n = 0;
  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell) map.set(cell.square, `${cell.color}-${cell.type}-${n++}`);
    }
  }
  return map;
}

const CASTLE_ROOKS = {
  k: { w: ['h1', 'f1'], b: ['h8', 'f8'] },
  q: { w: ['a1', 'd1'], b: ['a8', 'd8'] },
} as const;

export function nextIdentity(prev: IdentityMap, move: Move): IdentityMap {
  const next = new Map(prev);
  const id = next.get(move.from);
  next.delete(move.from);

  if (move.isEnPassant()) {
    // The captured pawn sits beside the destination, not on it.
    next.delete((move.to[0] + move.from[1]) as Square);
  } else {
    next.delete(move.to); // no-op when the destination was empty
  }
  if (id) next.set(move.to, id);

  // Castling moves a second piece. Both get new coordinates in the same
  // snapshot, so both slide simultaneously with no extra work downstream.
  const side = move.isKingsideCastle() ? 'k' : move.isQueensideCastle() ? 'q' : null;
  if (side) {
    const [rookFrom, rookTo] = CASTLE_ROOKS[side][move.color];
    const rookId = next.get(rookFrom);
    next.delete(rookFrom);
    if (rookId) next.set(rookTo, rookId);
  }

  // Promotion keeps the same id: the snapshot's `type` flips from 'p', so the
  // pawn morphs in place at the end of its slide.
  return next;
}
