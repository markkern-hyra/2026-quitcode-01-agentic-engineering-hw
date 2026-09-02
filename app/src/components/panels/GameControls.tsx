import { PButton } from '@porsche-design-system/components-react/ssr';
import styles from '@/styles/panels.module.css';

export type GameControlsProps = {
  canUndo: boolean;
  onNewGame: () => void;
  onUndo: () => void;
  onFlip: () => void;
};

/**
 * `type="button"` on every one of these: PButton defaults to `type="submit"`,
 * which would submit an enclosing form. There is no `undo` or `settings` icon
 * in PDS v4, so `return` and `switch` stand in.
 */
export function GameControls({ canUndo, onNewGame, onUndo, onFlip }: GameControlsProps) {
  return (
    <div className={styles.controls}>
      <PButton type="button" icon="reset" onClick={onNewGame}>
        New game
      </PButton>
      <PButton type="button" variant="secondary" icon="return" disabled={!canUndo} onClick={onUndo}>
        Take back
      </PButton>
      <PButton type="button" variant="secondary" icon="switch" onClick={onFlip}>
        Flip board
      </PButton>
    </div>
  );
}
