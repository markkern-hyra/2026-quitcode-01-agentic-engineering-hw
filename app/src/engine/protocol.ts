import type { PieceSymbol, Square } from 'chess.js';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type EngineRequest =
  | { type: 'search'; id: number; fen: string; difficulty: Difficulty }
  /** Clears the transposition table when a new game starts. */
  | { type: 'reset' };

export type BestMove = {
  type: 'bestmove';
  id: number;
  san: string;
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
  meta: { depth: number; nodes: number; ms: number; score: number };
};

export type EngineResponse =
  | { type: 'ready' }
  | BestMove
  | { type: 'error'; id: number; message: string };

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};
