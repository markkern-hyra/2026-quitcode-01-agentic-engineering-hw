import { Chess, type Square } from 'chess.js';
import { evaluate } from '@/engine/evaluate';
import { isCapture, isPromotion, orderMoves, sanTarget } from '@/engine/ordering';
import type { SearchParams } from '@/engine/levels';

const MATE = 30_000;
const TT_LIMIT = 200_000;
/** Captures alone can still explode; chess.js caps us near 10k nodes/s. */
const QUIESCENCE_MAX_PLY = 6;
/** Delta pruning slack, in centipawns. */
const DELTA_MARGIN = 200;

const CAPTURE_VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

class TimeUp extends Error {}

type TTEntry = { depth: number; score: number; flag: 'exact' | 'lower' | 'upper'; best?: string };

const tt = new Map<string, TTEntry>();

export function clearTranspositionTable(): void {
  tt.clear();
}

export type SearchResult = {
  san: string;
  score: number;
  depth: number;
  nodes: number;
  ms: number;
};

type Ctx = {
  params: SearchParams;
  deadline: number;
  nodes: number;
};

function checkTime(ctx: Ctx): void {
  // performance.now() costs nothing next to chess.js move generation, but the
  // sampling interval bounds how far a search can overrun its budget: at the
  // ~10k nodes/s chess.js allows, every 256 nodes is roughly 25ms of slack.
  if ((++ctx.nodes & 255) === 0 && performance.now() > ctx.deadline) throw new TimeUp();
}

/** Captures only, until the position is quiet — without this the bot hangs
 *  pieces just beyond the search horizon. */
function quiesce(chess: Chess, alpha: number, beta: number, ply: number, ctx: Ctx): number {
  checkTime(ctx);

  const stand = evaluate(chess);
  if (stand >= beta) return beta;
  if (ply >= QUIESCENCE_MAX_PLY) return stand;
  if (stand > alpha) alpha = stand;

  for (const san of orderMoves(chess.moves().filter(isCapture))) {
    // Delta pruning: if even winning the target piece outright cannot claw back
    // to alpha, searching the line is wasted budget. Promotions swing too much
    // in material to prune this way, so they always get searched.
    if (!isPromotion(san)) {
      const target = sanTarget(san);
      const victim = target ? chess.get(target as Square) : undefined;
      const gain = victim ? CAPTURE_VALUE[victim.type] : 0;
      if (stand + gain + DELTA_MARGIN < alpha) continue;
    }

    chess.move(san);
    const score = -quiesce(chess, -beta, -alpha, ply + 1, ctx);
    chess.undo();
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function negamax(chess: Chess, depth: number, alpha: number, beta: number, ply: number, ctx: Ctx): number {
  checkTime(ctx);

  const alphaOrig = alpha;
  const key = chess.hash();
  const hit = tt.get(key);
  if (hit && hit.depth >= depth) {
    if (hit.flag === 'exact') return hit.score;
    if (hit.flag === 'lower') alpha = Math.max(alpha, hit.score);
    else beta = Math.min(beta, hit.score);
    if (alpha >= beta) return hit.score;
  }

  if (depth === 0) {
    return ctx.params.quiescence ? quiesce(chess, alpha, beta, 0, ctx) : evaluate(chess);
  }

  const moves = orderMoves(chess.moves(), hit?.best);
  if (moves.length === 0) {
    // Mate distance matters: prefer mate in 2 over mate in 4.
    return chess.isCheck() ? -MATE + ply : 0;
  }

  let bestScore = -Infinity;
  let bestSan: string | undefined;

  for (const san of moves) {
    chess.move(san);
    const score = -negamax(chess, depth - 1, -beta, -alpha, ply + 1, ctx);
    chess.undo();

    if (score > bestScore) {
      bestScore = score;
      bestSan = san;
    }
    if (bestScore > alpha) alpha = bestScore;
    if (alpha >= beta) break; // fail-high
  }

  if (tt.size < TT_LIMIT) {
    const flag = bestScore <= alphaOrig ? 'upper' : bestScore >= beta ? 'lower' : 'exact';
    tt.set(key, { depth, score: bestScore, flag, best: bestSan });
  }
  return bestScore;
}

type RootMove = { san: string; score: number };

function searchRoot(chess: Chess, depth: number, ctx: Ctx): RootMove[] {
  const hit = tt.get(chess.hash());
  const scored: RootMove[] = [];
  let alpha = -Infinity;

  for (const san of orderMoves(chess.moves(), hit?.best)) {
    chess.move(san);
    const score = -negamax(chess, depth - 1, -Infinity, -alpha, 1, ctx);
    chess.undo();
    scored.push({ san, score });
    if (score > alpha) alpha = score;
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * Iterative deepening with a hard wall-clock deadline. Browser workers run
 * 2-3x slower than a Node benchmark, so the deadline — not `maxDepth` — is what
 * actually determines strength. Any depth that does not finish is discarded.
 */
export function findBestMove(position: Chess, params: SearchParams, random: () => number): SearchResult {
  const started = performance.now();
  const ctx: Ctx = { params, deadline: started + params.timeBudgetMs, nodes: 0 };

  // Search a private copy. The deadline throws from deep inside the recursion,
  // between a `move()` and its matching `undo()`, so an aborted search always
  // leaves its board part-way down an abandoned line. Never let that be the
  // caller's instance, and reload before each retry.
  const rootFen = position.fen();
  const chess = new Chess(rootFen);

  let best: RootMove[] = [];
  let completedDepth = 0;

  for (let depth = 1; depth <= params.maxDepth; depth++) {
    try {
      best = searchRoot(chess, depth, ctx);
      completedDepth = depth;
    } catch (error) {
      if (error instanceof TimeUp) {
        chess.load(rootFen);
        break;
      }
      throw error;
    }
  }

  if (best.length === 0) {
    // Ran out of time before finishing even depth 1 — fall back to move ordering.
    const fallback = orderMoves(chess.moves())[0];
    best = [{ san: fallback, score: 0 }];
    completedDepth = 0;
  }

  // Pick among the joint-best moves so repeat games are not identical.
  const pool = best.slice(0, Math.max(1, Math.min(params.topN, best.length)));
  const choice = pool[Math.floor(random() * pool.length)] ?? best[0];

  return {
    san: choice.san,
    score: choice.score,
    depth: completedDepth,
    nodes: ctx.nodes,
    ms: Math.round(performance.now() - started),
  };
}
