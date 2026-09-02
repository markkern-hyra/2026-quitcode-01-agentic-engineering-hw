import type { Color, PieceSymbol } from 'chess.js';
import { PText } from '@porsche-design-system/components-react/ssr';
import { sortCaptured } from '@/lib/chess/material';
import { StandalonePiece } from '@/components/board/pieces';
import { pdsText } from '@/lib/pds';
import styles from '@/styles/panels.module.css';

export type CapturedTrayProps = {
  /** The side that did the capturing. */
  side: Color;
  captured: readonly PieceSymbol[];
  /** Positive = white ahead, in pawns. */
  materialDelta: number;
};

export function CapturedTray({ side, captured, materialDelta }: CapturedTrayProps) {
  const advantage = side === 'w' ? materialDelta : -materialDelta;
  // The captured pieces belong to the other army, so they render in its colour.
  const pieceColor: Color = side === 'w' ? 'b' : 'w';

  return (
    <div className={styles.tray}>
      <span className={styles.trayPieces}>
        {sortCaptured(captured).map((type, index) => (
          <StandalonePiece key={`${type}-${index}`} type={type} color={pieceColor} size={22} />
        ))}
      </span>
      {advantage > 0 && (
        <PText size="x-small" color="contrast-high" weight="semibold">
          {pdsText(`+${advantage}`)}
        </PText>
      )}
    </div>
  );
}
