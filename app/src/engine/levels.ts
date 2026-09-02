import type { Difficulty } from '@/engine/protocol';

export type SearchParams = {
  /** Ceiling for iterative deepening; the time budget is the real governor. */
  maxDepth: number;
  timeBudgetMs: number;
  quiescence: boolean;
  /** Chance of ignoring the search entirely and playing a random legal move. */
  blunderRate: number;
  /** Pick uniformly among the best N root moves — variety without much loss. */
  topN: number;
};

/**
 * Budgets, not depths, decide strength here. chess.js tops out near 10k
 * nodes/s (moves() at 17k ops/s and move+undo at 19k ops/s are the ceiling), and
 * a browser worker runs slower still, so `maxDepth` is only a cap that a fast
 * position may reach early.
 */
export const LEVELS: Record<Difficulty, SearchParams> = {
  easy: { maxDepth: 1, timeBudgetMs: 150, quiescence: false, blunderRate: 0.25, topN: 3 },
  medium: { maxDepth: 4, timeBudgetMs: 600, quiescence: true, blunderRate: 0, topN: 2 },
  hard: { maxDepth: 6, timeBudgetMs: 1400, quiescence: true, blunderRate: 0, topN: 1 },
};

/** An instant reply reads as a bug, not as strength. Enforced in the hook. */
export const MIN_THINK_MS = 350;
