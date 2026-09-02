'use client';

import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import type { Square as SquareName } from 'chess.js';
import type { GameState, GameActions } from '@/hooks/useChessGame';
import { isLightSquare, orientedSquares } from '@/lib/chess/squares';
import { squareLabel } from '@/lib/chess/labels';
import { isGameOver } from '@/lib/chess/snapshot';
import { useBoardPointer } from '@/hooks/useBoardPointer';
import { useBoardKeyboard } from '@/hooks/useBoardKeyboard';
import { PieceLayer } from './PieceLayer';
import { DragGhost } from './DragGhost';
import { Square } from './Square';
import styles from './Board.module.css';

export type BoardProps = {
  state: GameState;
  actions: GameActions;
  /** True while the engine is thinking, so the human cannot move for it. */
  locked: boolean;
};

export const Board = memo(function Board({ state, actions, locked }: BoardProps) {
  const { snapshot, orientation, interaction, legalTargets, focusSquare, showCoordinates } = state;
  const gameOver = isGameOver(snapshot.status);
  const inert = locked || gameOver;

  const rows = useMemo(() => orientedSquares(orientation), [orientation]);

  const isDraggable = useCallback(
    (square: SquareName) =>
      !inert && snapshot.occupancy[square]?.color === snapshot.turn,
    [inert, snapshot],
  );

  const dragging = interaction.kind === 'dragging';
  const { boardRef, ghostRef, onPointerDown, squareSize } = useBoardPointer(
    actions,
    isDraggable,
    dragging,
  );
  const onKeyDown = useBoardKeyboard(focusSquare, orientation, actions);

  const draggedPiece = dragging ? snapshot.occupancy[interaction.from] : undefined;

  // Keep DOM focus on the roving cell so keyboard navigation is visible.
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !grid.contains(document.activeElement)) return;
    grid
      .querySelector<HTMLButtonElement>(`[data-square="${focusSquare}"]`)
      ?.focus({ preventScroll: true });
  }, [focusSquare]);

  const handleActivate = useCallback(
    (square: SquareName) => {
      if (inert) return;
      actions.activateSquare(square);
    },
    [inert, actions],
  );

  const selected = interaction.kind === 'idle' ? null : interaction.from;
  const lastMove = snapshot.lastMove;
  const showTargets = state.showLegalMoves;

  return (
    <div className={styles.frame} ref={boardRef}>
      <div
        ref={gridRef}
        role="grid"
        aria-label="Chess board"
        aria-rowcount={8}
        aria-colcount={8}
        aria-disabled={inert || undefined}
        className={styles.grid}
        onKeyDown={onKeyDown}
      >
        {rows.map((row, rowIndex) => (
          <div className={styles.row} role="row" aria-rowindex={rowIndex + 1} key={row[0]}>
            {row.map((square, colIndex) => {
              const isLastRow = rowIndex === 7;
              const isFirstCol = colIndex === 0;
              return (
                <Square
                  key={square}
                  square={square}
                  colIndex={colIndex + 1}
                  shade={isLightSquare(square) ? 'light' : 'dark'}
                  label={squareLabel(square, snapshot, legalTargets)}
                  target={showTargets ? (legalTargets[square] ?? 'none') : 'none'}
                  selected={selected === square}
                  lastMove={lastMove?.from === square || lastMove?.to === square}
                  check={snapshot.checkSquare === square}
                  locked={inert}
                  tabIndex={focusSquare === square ? 0 : -1}
                  fileLabel={showCoordinates && isLastRow ? square[0] : null}
                  rankLabel={showCoordinates && isFirstCol ? square[1] : null}
                  onActivate={handleActivate}
                  onPointerDown={onPointerDown}
                  onFocusSquare={actions.moveFocus}
                />
              );
            })}
          </div>
        ))}
      </div>

      <PieceLayer
        pieces={snapshot.pieces}
        orientation={orientation}
        draggingId={dragging ? (draggedPiece?.id ?? null) : null}
      />

      {draggedPiece && (
        <DragGhost
          ref={ghostRef}
          color={draggedPiece.color}
          type={draggedPiece.type}
          size={squareSize}
        />
      )}
    </div>
  );
});
