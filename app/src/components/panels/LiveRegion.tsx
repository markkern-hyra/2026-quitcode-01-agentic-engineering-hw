import styles from '@/styles/a11y.module.css';

/**
 * One polite, atomic live region for the whole game. Polite rather than
 * assertive: a move announcement should never cut off whatever the player is
 * already having read to them.
 */
export function LiveRegion({ message }: { message: string }) {
  return (
    <div className={styles.visuallyHidden} role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
