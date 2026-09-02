'use client';

import { useCallback, useState } from 'react';
import { PCanvas, PDivider, PHeading } from '@porsche-design-system/components-react/ssr';
import { breakpointM } from '@porsche-design-system/components-react/styles';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useChessGame } from '@/hooks/useChessGame';
import { useEngine } from '@/hooks/useEngine';
import { useBotDriver } from '@/hooks/useBotDriver';
import { Board } from '@/components/board/Board';
import { ThemeToggle } from '@/components/ThemeToggle';
import { StatusBar } from '@/components/panels/StatusBar';
import { GameControls } from '@/components/panels/GameControls';
import { SettingsPanel } from '@/components/panels/SettingsPanel';
import { MoveHistory } from '@/components/panels/MoveHistory';
import { CapturedTray } from '@/components/panels/CapturedTray';
import { PromotionDialog } from '@/components/panels/PromotionDialog';
import { GameOverBanner } from '@/components/panels/GameOverBanner';
import { LiveRegion } from '@/components/panels/LiveRegion';
import { isGameOver } from '@/lib/chess/snapshot';
import type { BestMove } from '@/engine/protocol';
import styles from '@/styles/shell.module.css';

export function GameShell() {
  const { state, actions } = useChessGame();
  const { snapshot } = state;

  const onBestMove = useCallback(
    (move: BestMove) => {
      actions.applyEngineMove(move.san);
    },
    [actions],
  );

  const { thinking, requestMove, abort, reset } = useEngine(onBestMove);

  useBotDriver({
    fen: snapshot.fen,
    turn: snapshot.turn,
    status: snapshot.status,
    mode: state.mode,
    botColor: state.botColor,
    difficulty: state.difficulty,
    pendingPromotion: state.pendingPromotion !== null,
    requestMove,
  });

  // Sidebars follow the viewport until the player says otherwise: `null` means
  // "track the media query", a boolean means they have chosen. On small screens
  // PCanvas turns them into flyouts over the board.
  const isDesktop = useMediaQuery(`(min-width: ${breakpointM}px)`);
  const [startOverride, setStartOverride] = useState<boolean | null>(null);
  const [endOverride, setEndOverride] = useState<boolean | null>(null);
  const sidebarStartOpen = startOverride ?? isDesktop;
  const sidebarEndOpen = endOverride ?? isDesktop;

  const handleNewGame = useCallback(() => {
    reset();
    actions.newGame();
  }, [reset, actions]);

  const handleUndo = useCallback(() => {
    // Drop whatever the engine is currently thinking about, or its answer would
    // land on a position the player has already taken back.
    abort();
    actions.undo();
  }, [abort, actions]);

  const gameOver = isGameOver(snapshot.status);
  const humanToMove = state.mode === 'local' || snapshot.turn !== state.botColor;

  return (
    <PCanvas
      sidebarStartOpen={sidebarStartOpen}
      sidebarEndOpen={sidebarEndOpen}
      onSidebarStartUpdate={(event) => setStartOverride(event.detail.open)}
      onSidebarEndDismiss={() => setEndOverride(false)}
    >
      <span slot="title">Porsche Chess</span>

      <div slot="header-start">
        <StatusBar status={snapshot.status} turn={snapshot.turn} thinking={thinking} />
      </div>

      <div slot="header-end" className={styles.headerEnd}>
        <ThemeToggle />
      </div>

      <div slot="sidebar-start" className={styles.sidebarSection}>
        <SettingsPanel
          mode={state.mode}
          difficulty={state.difficulty}
          botColor={state.botColor}
          showCoordinates={state.showCoordinates}
          showLegalMoves={state.showLegalMoves}
          onMode={actions.setMode}
          onDifficulty={actions.setDifficulty}
          onBotColor={actions.setBotColor}
          onOption={actions.setOption}
        />
        <PDivider color="contrast-low" />
        <GameControls
          canUndo={snapshot.ply > 0}
          onNewGame={handleNewGame}
          onUndo={handleUndo}
          onFlip={actions.flip}
        />
      </div>

      <PHeading slot="sidebar-end-header" tag="h2" size="small">
        Moves
      </PHeading>
      <div slot="sidebar-end">
        <MoveHistory history={snapshot.history} />
      </div>

      <div className={styles.main}>
        <div className={styles.boardColumn}>
          <CapturedTray
            side={state.orientation === 'w' ? 'b' : 'w'}
            captured={state.orientation === 'w' ? snapshot.captured.b : snapshot.captured.w}
            materialDelta={snapshot.materialDelta}
          />
          <Board state={state} actions={actions} locked={!humanToMove || thinking} />
          <CapturedTray
            side={state.orientation}
            captured={state.orientation === 'w' ? snapshot.captured.w : snapshot.captured.b}
            materialDelta={snapshot.materialDelta}
          />
          {/* Below the board rather than in PCanvas's `footer` slot: that slot
              lays its content out at zero height, and the result belongs next
              to the board the player is already looking at. */}
          {gameOver && <GameOverBanner status={snapshot.status} onNewGame={handleNewGame} />}
        </div>
      </div>

      <PromotionDialog
        open={state.pendingPromotion !== null}
        color={snapshot.turn}
        onChoose={actions.choosePromotion}
        onCancel={actions.cancelPromotion}
      />

      <LiveRegion message={state.announcement} />
    </PCanvas>
  );
}
