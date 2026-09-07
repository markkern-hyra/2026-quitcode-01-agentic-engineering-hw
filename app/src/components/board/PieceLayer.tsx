'use client';

import { useEffect, useRef, useState } from 'react';
import type { Color } from 'chess.js';
import type { PieceOnBoard } from '@/lib/types';
import { toXY } from '@/lib/chess/squares';
import { PieceSprite } from './PieceSprite';
import styles from './Board.module.css';

export type PieceLayerProps = {
  pieces: readonly PieceOnBoard[];
  orientation: Color;
  draggingId: string | null;
  selectedId: string | null;
  /** False under prefers-reduced-motion: pieces still move, they just cut. */
  animate: boolean;
};

const FADE_MS = 400; // matches --p-duration-md

/**
 * Captured pieces would otherwise vanish the instant the capturer arrives. This
 * layer keeps a piece for one fade after its id leaves the snapshot, so en
 * passant fades the pawn beside the destination and an ordinary capture fades
 * underneath the arriving piece. Local state — it never touches the 64 squares.
 */
function Sprites({ pieces, orientation, draggingId, selectedId, animate }: PieceLayerProps) {
  const [fading, setFading] = useState<PieceOnBoard[]>([]);
  const previous = useRef<readonly PieceOnBoard[]>(pieces);
  /**
   * One timer per captured piece, keyed by id.
   *
   * A single shared timer cancelled by the effect's cleanup does not work here:
   * the effect re-runs on every move, so a capture followed by another move
   * inside FADE_MS cancelled the first piece's expiry and the replacement timer
   * only knew about the second piece — leaving the first stuck in `fading` for
   * the rest of the game.
   */
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const live = new Set(pieces.map((piece) => piece.id));
    const gone = previous.current.filter((piece) => !live.has(piece.id));
    previous.current = pieces;
    if (gone.length === 0) return;

    setFading((current) => [...current, ...gone]);
    for (const piece of gone) {
      clearTimeout(timers.current.get(piece.id));
      timers.current.set(
        piece.id,
        setTimeout(() => {
          timers.current.delete(piece.id);
          setFading((current) => current.filter((item) => item.id !== piece.id));
        }, FADE_MS),
      );
    }
  }, [pieces]);

  // Only on unmount: every fade must be allowed to finish on its own.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) clearTimeout(timer);
      pending.clear();
    };
  }, []);

  const liveIds = new Set(pieces.map((piece) => piece.id));

  return (
    <>
      {pieces.map((piece) => {
        const { x, y } = toXY(piece.square, orientation);
        return (
          <PieceSprite
            key={piece.id}
            color={piece.color}
            type={piece.type}
            x={x}
            y={y}
            dragging={piece.id === draggingId}
            selected={piece.id === selectedId}
            fading={false}
            animate={animate}
          />
        );
      })}
      {fading
        .filter((piece) => !liveIds.has(piece.id))
        .map((piece) => {
          const { x, y } = toXY(piece.square, orientation);
          return (
            <PieceSprite
              key={`fading-${piece.id}`}
              color={piece.color}
              type={piece.type}
              x={x}
              y={y}
              dragging={false}
              selected={false}
              fading={true}
              animate={animate}
            />
          );
        })}
    </>
  );
}

export function PieceLayer(props: PieceLayerProps) {
  return (
    <div className={styles.pieceLayer} aria-hidden="true">
      {/* Keyed on orientation: flipping the board changes all 32 coordinates at
          once, and remounting is what stops every piece flying across the
          screen. Cheaper and more reliable than suppressing the transition. */}
      <Sprites key={props.orientation} {...props} />
    </div>
  );
}
