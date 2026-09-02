import type { Color } from 'chess.js';
import { PSpinner, PTag, PText } from '@porsche-design-system/components-react/ssr';
import type { GameStatus } from '@/lib/types';
import { statusText } from '@/lib/chess/labels';
import styles from '@/styles/panels.module.css';

export type StatusBarProps = {
  status: GameStatus;
  turn: Color;
  thinking: boolean;
};

function tagVariant(status: GameStatus): 'primary' | 'success' | 'warning' | 'info' {
  if (status.kind === 'checkmate') return 'success';
  if (status.kind === 'stalemate' || status.kind === 'draw') return 'info';
  return status.check ? 'warning' : 'primary';
}

export function StatusBar({ status, turn, thinking }: StatusBarProps) {
  return (
    <div className={styles.statusBar}>
      {/* Text, never colour alone, carries whose turn it is and whether the
          side to move is in check. */}
      <PTag variant={tagVariant(status)}>{statusText(status, turn)}</PTag>
      {thinking && (
        <span className={styles.thinking}>
          <PSpinner size="small" aria={{ 'aria-label': 'Computer is thinking' }} />
          <PText size="x-small" color="contrast-medium">
            Thinking
          </PText>
        </span>
      )}
    </div>
  );
}
