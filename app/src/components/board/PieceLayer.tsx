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
};

const FADE_MS = 400; // matches --p-duration-md

/**
 * Captured pieces would otherwise vanish the instant the capturer arrives. This
 * layer keeps a piece for one fade after its id leaves the snapshot, so en
 * passant fades the pawn beside the destination and an ordinary capture fades
 * underneath the arriving piece. Local state — it never touches the 64 squares.
 */
function Sprites({ pieces, orientation, draggingId }: PieceLayerProps) {
  const [fading, setFading] = useState<PieceOnBoard[]>([]);
  const previous = useRef<readonly PieceOnBoard[]>(pieces);

  useEffect(() => {
    const live = new Set(pieces.map((piece) => piece.id));
    const gone = previous.current.filter((piece) => !live.has(piece.id));
    previous.current = pieces;
    if (gone.length === 0) return;

    setFading((current) => [...current, ...gone]);
    const timer = setTimeout(() => {
      const goneIds = new Set(gone.map((piece) => piece.id));
      setFading((current) => current.filter((piece) => !goneIds.has(piece.id)));
    }, FADE_MS);
    return () => clearTimeout(timer);
  }, [pieces]);

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
            fading={false}
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
              fading={true}
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
