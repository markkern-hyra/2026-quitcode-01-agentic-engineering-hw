'use client';

import { forwardRef } from 'react';
import type { Color, PieceSymbol } from 'chess.js';
import { PieceGlyph } from './pieces';
import styles from './Board.module.css';

export type DragGhostProps = {
  color: Color;
  type: PieceSymbol;
  size: number;
};

/**
 * The piece that follows the pointer. Positioned imperatively by the drag hook
 * writing to `style.transform`, so a drag costs zero React renders.
 */
export const DragGhost = forwardRef<HTMLDivElement, DragGhostProps>(function DragGhost(
  { color, type, size },
  ref,
) {
  return (
    <div
      ref={ref}
      className={styles.ghost}
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        color: color === 'w' ? 'var(--chess-piece-white)' : 'var(--chess-piece-black)',
        ['--chess-stroke' as string]: 'var(--chess-piece-outline)',
        ['--chess-detail' as string]:
          color === 'w' ? 'var(--chess-piece-outline)' : 'var(--chess-piece-white)',
      }}
    >
      <PieceGlyph type={type} />
    </div>
  );
});
