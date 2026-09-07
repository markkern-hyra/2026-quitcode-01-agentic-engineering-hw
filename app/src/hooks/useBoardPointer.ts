'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Square } from 'chess.js';
import type { GameActions } from '@/hooks/useChessGame';

/** Movement past this many pixels turns a press into a drag rather than a tap. */
const DRAG_THRESHOLD_PX = 5;

type Origin = { x: number; y: number; square: Square; dragging: boolean };

function squareAtPoint(x: number, y: number): Square | null {
  const element = document.elementFromPoint(x, y);
  const cell = element?.closest<HTMLElement>('[data-square]');
  return (cell?.dataset.square as Square | undefined) ?? null;
}

/**
 * Drag layered on top of click-to-move, sharing one state machine: a press
 * selects immediately, so releasing without moving simply leaves the piece
 * selected and the click path takes over.
 *
 * Pointer Events rather than HTML5 drag-and-drop, which does not fire on touch
 * at all and whose drag image cannot be styled.
 */
export function useBoardPointer(
  actions: GameActions,
  isDraggable: (square: Square) => boolean,
  isDragging: boolean,
) {
  const boardRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const origin = useRef<Origin | null>(null);
  const hovered = useRef<Square | null>(null);
  const [squareSize, setSquareSize] = useState(64);

  const positionGhost = useCallback((x: number, y: number) => {
    const ghost = ghostRef.current;
    if (!ghost) return;
    const half = ghost.offsetWidth / 2;
    ghost.style.transform = `translate3d(${x - half}px, ${y - half}px, 0)`;
  }, []);

  const setHover = useCallback((square: Square | null) => {
    if (hovered.current === square) return;
    const board = boardRef.current;
    if (board) {
      if (hovered.current) {
        board.querySelector(`[data-square="${hovered.current}"]`)?.removeAttribute('data-hover');
      }
      if (square) {
        board.querySelector(`[data-square="${square}"]`)?.setAttribute('data-hover', '');
      }
    }
    hovered.current = square;
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, square: Square) => {
      if (event.button !== 0) return;
      if (!isDraggable(square)) return;
      origin.current = { x: event.clientX, y: event.clientY, square, dragging: false };
      // The ghost is position: fixed, so it needs a pixel size; one square of
      // the board as currently laid out.
      const width = boardRef.current?.getBoundingClientRect().width;
      if (width) setSquareSize(width / 8);
      // Deliberately no setPointerCapture here. Capturing on pointerdown
      // retargets the subsequent `click` to the capturing element, so the
      // square's own onClick never fires and click-to-move dies. Capture is
      // taken in handleMove, once the gesture is actually a drag.
    },
    [isDraggable],
  );

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const handleMove = (event: PointerEvent) => {
      const start = origin.current;
      if (!start) return;

      if (!start.dragging) {
        const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
        if (distance < DRAG_THRESHOLD_PX) return;
        start.dragging = true;
        // Capture on the board, not the square, so the pointer keeps reporting
        // once it leaves the origin cell. Safe now: this gesture is a drag, so
        // there is no click left to lose.
        board.setPointerCapture(event.pointerId);
        // The only React render in the whole gesture.
        actions.beginDrag(start.square, event.pointerId);
      }
      positionGhost(event.clientX, event.clientY);
      setHover(squareAtPoint(event.clientX, event.clientY));
    };

    const handleUp = (event: PointerEvent) => {
      const start = origin.current;
      origin.current = null;
      setHover(null);
      if (board.hasPointerCapture(event.pointerId)) board.releasePointerCapture(event.pointerId);
      // Released without ever crossing the threshold: it was a click, and the
      // button's own onClick has already selected the square.
      if (!start?.dragging) return;
      actions.dropOn(start.square, squareAtPoint(event.clientX, event.clientY));
    };

    const handleCancel = () => {
      const start = origin.current;
      origin.current = null;
      setHover(null);
      if (start?.dragging) actions.cancelDrag();
    };

    board.addEventListener('pointermove', handleMove);
    board.addEventListener('pointerup', handleUp);
    board.addEventListener('pointercancel', handleCancel);
    return () => {
      board.removeEventListener('pointermove', handleMove);
      board.removeEventListener('pointerup', handleUp);
      board.removeEventListener('pointercancel', handleCancel);
    };
  }, [actions, positionGhost, setHover]);

  // A drag that ends for any other reason must not leave a stale ghost anywhere.
  useEffect(() => {
    if (!isDragging) setHover(null);
  }, [isDragging, setHover]);

  return { boardRef, ghostRef, onPointerDown, squareSize };
}
