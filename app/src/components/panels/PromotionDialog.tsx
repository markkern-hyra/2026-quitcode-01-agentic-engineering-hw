'use client';

import type { Color } from 'chess.js';
import { PHeading, PModal, PText } from '@porsche-design-system/components-react/ssr';
import type { PromotionPiece } from '@/lib/types';
import { StandalonePiece } from '@/components/board/pieces';
import { PIECE_NAME } from '@/lib/chess/labels';
import styles from '@/styles/panels.module.css';

const CHOICES: PromotionPiece[] = ['q', 'r', 'b', 'n'];

export type PromotionDialogProps = {
  open: boolean;
  color: Color;
  onChoose: (piece: PromotionPiece) => void;
  onCancel: () => void;
};

/**
 * PModal is controlled: `open` never updates itself, so dismissal has to be
 * handled here. Dismissing promotes to a queen rather than leaving the move in
 * limbo — chess.js throws if a promotion move arrives without a piece, and a
 * half-applied move would soft-lock the board.
 */
export function PromotionDialog({ open, color, onChoose, onCancel }: PromotionDialogProps) {
  return (
    <PModal
      open={open}
      onDismiss={onCancel}
      aria={{ 'aria-label': 'Choose a promotion piece' }}
    >
      <PHeading slot="header" tag="h2" size="large">
        Promote your pawn
      </PHeading>
      <PText color="contrast-medium">Pick the piece your pawn becomes.</PText>
      <div className={styles.promotionChoices}>
        {CHOICES.map((piece) => (
          <button
            key={piece}
            type="button"
            className={styles.promotionChoice}
            onClick={() => onChoose(piece)}
          >
            <StandalonePiece type={piece} color={color} size={56} />
            <span className={styles.promotionLabel}>{PIECE_NAME[piece]}</span>
          </button>
        ))}
      </div>
    </PModal>
  );
}
