'use client';

import { memo, useEffect, useRef } from 'react';
import type { Color, PieceSymbol } from 'chess.js';
import { PieceGlyph } from './pieces';
import styles from './Board.module.css';

export type PieceSpriteProps = {
  color: Color;
  type: PieceSymbol;
  x: number;
  y: number;
  dragging: boolean;
  selected: boolean;
  fading: boolean;
  animate: boolean;
};

/**
 * Position is carried entirely by two CSS custom properties, so a move is a
 * transform transition rather than a re-mount and React never ticks per frame.
 *
 * The arc over the board is a Web Animations call rather than React state on
 * purpose: it is a one-shot visual effect on an element we already have a
 * handle to, so driving it imperatively costs zero renders — and `el.animate()`
 * is exactly the "update an external system" an effect is meant for, where a
 * setState would be a cascading render.
 */
export const PieceSprite = memo(function PieceSprite({
  color,
  type,
  x,
  y,
  dragging,
  selected,
  fading,
  animate,
}: PieceSpriteProps) {
  const lift = useRef<HTMLSpanElement>(null);
  const previous = useRef<{ x: number; y: number } | null>(null);
  const previousType = useRef(type);

  useEffect(() => {
    const element = lift.current;
    const from = previous.current;
    previous.current = { x, y };

    // First render places the piece; only a genuine change is a "move".
    if (!element || !from || (from.x === x && from.y === y)) return;
    if (!animate) return;

    const distance = Math.hypot(x - from.x, y - from.y);
    const peak = element.offsetHeight * Math.min(0.9, 0.28 + distance * 0.12);

    element.animate(
      [
        { transform: 'translateZ(0px)' },
        { transform: `translateZ(${peak}px)`, offset: 0.45 },
        { transform: 'translateZ(0px)' },
      ],
      { duration: 380, easing: 'cubic-bezier(0.33, 0, 0.2, 1)' },
    );
  }, [x, y, animate]);

  // A promoting pawn keeps its identity and swaps type mid-slide; a short pop
  // marks the change so it does not look like a rendering glitch.
  useEffect(() => {
    const element = lift.current;
    const changed = previousType.current !== type;
    previousType.current = type;
    if (!element || !changed || !animate) return;

    element.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.28)', offset: 0.4 },
        { transform: 'scale(1)' },
      ],
      { duration: 420, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    );
  }, [type, animate]);

  return (
    <span
      className={styles.sprite}
      data-color={color}
      data-dragging={dragging || undefined}
      data-selected={selected || undefined}
      data-fading={fading || undefined}
      style={{ ['--sq-x' as string]: x, ['--sq-y' as string]: y }}
    >
      {/* Sits in the board plane, so it reads as a shadow cast onto the square. */}
      <span className={styles.contact} />
      <span className={styles.lift} ref={lift}>
        <span className={styles.stand}>
          <PieceGlyph type={type} />
        </span>
      </span>
    </span>
  );
});
