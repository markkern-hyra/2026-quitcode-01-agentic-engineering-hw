'use client';

import { useEffect } from 'react';
import type { Color } from 'chess.js';
import type { GameMode, GameStatus } from '@/lib/types';
import type { Difficulty } from '@/engine/protocol';

/**
 * Asks the engine for a move whenever the position belongs to the bot. Keyed on
 * the FEN, so it fires exactly once per position — including after a take-back,
 * where the FEN returning to an earlier value is precisely the signal to think
 * again.
 */
export function useBotDriver(options: {
  fen: string;
  turn: Color;
  status: GameStatus;
  mode: GameMode;
  botColor: Color;
  difficulty: Difficulty;
  pendingPromotion: boolean;
  requestMove: (fen: string, difficulty: Difficulty) => void;
}) {
  const { fen, turn, status, mode, botColor, difficulty, pendingPromotion, requestMove } = options;
  const botToMove =
    mode === 'vs-bot' && turn === botColor && status.kind === 'playing' && !pendingPromotion;

  useEffect(() => {
    if (!botToMove) return;
    requestMove(fen, difficulty);
  }, [botToMove, fen, difficulty, requestMove]);
}
