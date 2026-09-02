import { memo } from 'react';
import type { Color, PieceSymbol } from 'chess.js';
import { PieceGlyph } from './pieces';
import styles from './Board.module.css';

export type PieceSpriteProps = {
  color: Color;
  type: PieceSymbol;
  x: number;
  y: number;
  dragging: boolean;
  fading: boolean;
};

/**
 * Position is carried entirely by two CSS custom properties, so a move is a
 * transform transition rather than a re-mount. React never ticks per frame.
 */
export const PieceSprite = memo(function PieceSprite({
  color,
  type,
  x,
  y,
  dragging,
  fading,
}: PieceSpriteProps) {
  return (
    <span
      className={styles.sprite}
      data-color={color}
      data-dragging={dragging || undefined}
      data-fading={fading || undefined}
      style={{ ['--sq-x' as string]: x, ['--sq-y' as string]: y }}
    >
      <PieceGlyph type={type} />
    </span>
  );
});
