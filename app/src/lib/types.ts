import type { Color, PieceSymbol, Square } from 'chess.js';

export type PieceOnBoard = {
  /** Stable for the lifetime of the piece — this is what makes CSS slides work. */
  id: string;
  color: Color;
  type: PieceSymbol;
  square: Square;
};

export type GameStatus =
  | { kind: 'playing'; check: boolean }
  | { kind: 'checkmate'; winner: Color }
  | { kind: 'stalemate' }
  | { kind: 'draw'; reason: 'fifty-move' | 'threefold' | 'insufficient-material' };

export type HistoryEntry = {
  ply: number;
  moveNumber: number;
  color: Color;
  san: string;
};

export type MovePair = {
  moveNumber: number;
  white: HistoryEntry | null;
  black: HistoryEntry | null;
};

/** Everything the UI renders. Rebuilt once per applied move; never mutated. */
export type GameSnapshot = {
  fen: string;
  turn: Color;
  pieces: readonly PieceOnBoard[];
  occupancy: Readonly<Partial<Record<Square, PieceOnBoard>>>;
  lastMove: Readonly<{ from: Square; to: Square }> | null;
  checkSquare: Square | null;
  status: GameStatus;
  history: readonly HistoryEntry[];
  captured: Readonly<{ w: readonly PieceSymbol[]; b: readonly PieceSymbol[] }>;
  /** Positive = white ahead, measured in pawns. */
  materialDelta: number;
  ply: number;
};

export type LegalTargets = Readonly<Partial<Record<Square, 'move' | 'capture'>>>;

export type Interaction =
  | { kind: 'idle' }
  | { kind: 'selected'; from: Square }
  /** Deliberately carries no x/y: drag coordinates never enter React state. */
  | { kind: 'dragging'; from: Square; pointerId: number };

export type GameMode = 'local' | 'vs-bot';
/** How the board is drawn. '3d' tilts it in CSS 3D; 'flat' is the same DOM at tilt 0. */
export type BoardView = '3d' | 'flat';
export type PromotionPiece = 'q' | 'r' | 'b' | 'n';
