import { memo } from 'react';
import type { Square as SquareName } from 'chess.js';
import styles from './Board.module.css';

export type SquareProps = {
  square: SquareName;
  shade: 'light' | 'dark';
  label: string;
  target: 'none' | 'move' | 'capture';
  selected: boolean;
  lastMove: boolean;
  check: boolean;
  locked: boolean;
  tabIndex: 0 | -1;
  colIndex: number;
  fileLabel: string | null;
  rankLabel: string | null;
  onActivate: (square: SquareName) => void;
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>, square: SquareName) => void;
  onFocusSquare: (square: SquareName) => void;
};

/**
 * Every prop is a primitive, so a plain shallow `memo` is enough — no custom
 * comparator. Combined with the action callbacks being referentially stable,
 * this is what keeps a hover or a drag from re-rendering all 64 squares.
 *
 * State is expressed as present-or-absent data attributes rather than
 * `data-x="false"`, so the CSS can match on `[data-selected]` alone.
 */
export const Square = memo(function Square({
  square,
  shade,
  label,
  target,
  selected,
  lastMove,
  check,
  locked,
  tabIndex,
  colIndex,
  fileLabel,
  rankLabel,
  onActivate,
  onPointerDown,
  onFocusSquare,
}: SquareProps) {
  return (
    <button
      type="button"
      role="gridcell"
      aria-colindex={colIndex}
      aria-label={label}
      aria-selected={selected}
      data-square={square}
      data-shade={shade}
      data-target={target === 'none' ? undefined : target}
      data-selected={selected || undefined}
      data-last-move={lastMove || undefined}
      data-check={check || undefined}
      data-locked={locked || undefined}
      tabIndex={tabIndex}
      className={styles.square}
      onClick={() => onActivate(square)}
      onPointerDown={(event) => onPointerDown(event, square)}
      /* Focus can arrive without a click — Tab, a screen reader's own
         navigation, or scripted focus. The roving anchor has to follow it, or
         the next arrow key steps from a square the user has already left. */
      onFocus={() => onFocusSquare(square)}
    >
      {fileLabel !== null && (
        <span className={`${styles.coord} ${styles.coordFile}`} aria-hidden="true">
          {fileLabel}
        </span>
      )}
      {rankLabel !== null && (
        <span className={`${styles.coord} ${styles.coordRank}`} aria-hidden="true">
          {rankLabel}
        </span>
      )}
    </button>
  );
});
