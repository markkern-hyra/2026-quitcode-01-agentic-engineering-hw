import { PInlineNotification } from '@porsche-design-system/components-react/ssr';
import type { GameStatus } from '@/lib/types';
import { turnLabel } from '@/lib/chess/snapshot';

function describe(status: GameStatus): { heading: string; description: string; state: 'success' | 'info' } {
  switch (status.kind) {
    case 'checkmate':
      return {
        heading: 'Checkmate',
        description: `${turnLabel(status.winner)} wins.`,
        state: 'success',
      };
    case 'stalemate':
      return {
        heading: 'Stalemate',
        description: 'The side to move has no legal move and is not in check.',
        state: 'info',
      };
    case 'draw':
      return {
        heading: 'Draw',
        description:
          status.reason === 'fifty-move'
            ? 'Fifty moves have passed without a capture or a pawn move.'
            : status.reason === 'threefold'
              ? 'The same position has occurred three times.'
              : 'Neither side has enough material to deliver mate.',
        state: 'info',
      };
    case 'playing':
      return { heading: '', description: '', state: 'info' };
  }
}

/** Props only, no children at all — nothing for splitChildren to trip over. */
export function GameOverBanner({ status, onNewGame }: { status: GameStatus; onNewGame: () => void }) {
  const { heading, description, state } = describe(status);
  return (
    <PInlineNotification
      heading={heading}
      headingTag="h2"
      description={description}
      state={state}
      dismissButton={false}
      actionLabel="New game"
      actionIcon="reset"
      onAction={onNewGame}
    />
  );
}
