/**
 * Move ordering read straight off the SAN string.
 *
 * This is the single biggest win in the whole engine and it costs nothing:
 * `chess.moves()` already produced these strings, whereas
 * `moves({verbose:true})` is ~13x slower because it materialises a `before` and
 * an `after` FEN for every move. Measured on a midgame position at depth 4:
 * 37,625 nodes / 1,885 ms unordered vs 5,514 nodes / 396 ms ordered.
 */
export function sanRank(san: string): number {
  if (san.includes('=')) return 0; // promotion
  if (san.includes('x')) return 1; // capture
  const last = san.charCodeAt(san.length - 1);
  if (last === 43 /* + */ || last === 35 /* # */) return 2; // check
  return 3; // quiet
}

export function orderMoves(moves: string[], ttBest?: string): string[] {
  const sorted = moves.slice().sort((a, b) => sanRank(a) - sanRank(b));
  if (ttBest) {
    const index = sorted.indexOf(ttBest);
    if (index > 0) {
      sorted.splice(index, 1);
      sorted.unshift(ttBest);
    }
  }
  return sorted;
}

export function isCapture(san: string): boolean {
  return san.includes('x');
}

/**
 * Destination square of a SAN move, e.g. "Nxe5" -> "e5", "bxa8=Q+" -> "a8".
 * Cheap string work; used for delta pruning, where `chess.get()` is effectively
 * free (~150M ops/s) but `moves({verbose:true})` is not.
 */
export function sanTarget(san: string): string | null {
  let s = san;
  const last = s.charCodeAt(s.length - 1);
  if (last === 43 /* + */ || last === 35 /* # */) s = s.slice(0, -1);
  const eq = s.indexOf('=');
  if (eq !== -1) s = s.slice(0, eq);
  if (s.startsWith('O-O')) return null; // castling captures nothing
  const target = s.slice(-2);
  return /^[a-h][1-8]$/.test(target) ? target : null;
}

export function isPromotion(san: string): boolean {
  return san.includes('=');
}
