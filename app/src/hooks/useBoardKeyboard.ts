'use client';

import { useCallback } from 'react';
import type { Color, Square } from 'chess.js';
import { FILES, RANKS, fileIndex, rankIndex } from '@/lib/chess/squares';
import type { GameActions } from '@/hooks/useChessGame';

function squareAt(file: number, rank: number): Square {
  return `${FILES[file]}${RANKS[rank]}` as Square;
}

const clamp = (value: number) => Math.max(0, Math.min(7, value));

/**
 * Arrow keys move by what the player sees, not by what the board stores, so the
 * step inverts when Black is at the bottom. Enter/Space run the same
 * `activateSquare` machine as click and tap.
 */
export function useBoardKeyboard(
  focusSquare: Square,
  orientation: Color,
  actions: GameActions,
) {
  return useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const file = fileIndex(focusSquare);
      const rank = rankIndex(focusSquare);
      const forward = orientation === 'w' ? 1 : -1;

      let next: Square | null = null;

      switch (event.key) {
        case 'ArrowUp':
          next = squareAt(file, clamp(rank + forward));
          break;
        case 'ArrowDown':
          next = squareAt(file, clamp(rank - forward));
          break;
        case 'ArrowLeft':
          next = squareAt(clamp(file - forward), rank);
          break;
        case 'ArrowRight':
          next = squareAt(clamp(file + forward), rank);
          break;
        case 'Home':
          next = event.ctrlKey || event.metaKey ? 'a8' : squareAt(orientation === 'w' ? 0 : 7, rank);
          break;
        case 'End':
          next = event.ctrlKey || event.metaKey ? 'h1' : squareAt(orientation === 'w' ? 7 : 0, rank);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          actions.activateSquare(focusSquare);
          return;
        case 'Escape':
          event.preventDefault();
          actions.cancelPromotion();
          return;
        default:
          return;
      }

      if (next && next !== focusSquare) {
        event.preventDefault();
        actions.moveFocus(next);
      } else if (next) {
        event.preventDefault();
      }
    },
    [focusSquare, orientation, actions],
  );
}
