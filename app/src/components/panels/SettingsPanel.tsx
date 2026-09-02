'use client';

import type { Color } from 'chess.js';
import {
  PDivider,
  PHeading,
  PSegmentedControl,
  PSegmentedControlItem,
  PSwitch,
} from '@porsche-design-system/components-react/ssr';
import type { GameMode } from '@/lib/types';
import { DIFFICULTY_LABEL, type Difficulty } from '@/engine/protocol';
import styles from '@/styles/panels.module.css';

export type SettingsPanelProps = {
  mode: GameMode;
  difficulty: Difficulty;
  botColor: Color;
  showCoordinates: boolean;
  showLegalMoves: boolean;
  onMode: (mode: GameMode) => void;
  onDifficulty: (difficulty: Difficulty) => void;
  onBotColor: (color: Color) => void;
  onOption: (key: 'showCoordinates' | 'showLegalMoves', value: boolean) => void;
};

export function SettingsPanel({
  mode,
  difficulty,
  botColor,
  showCoordinates,
  showLegalMoves,
  onMode,
  onDifficulty,
  onBotColor,
  onOption,
}: SettingsPanelProps) {
  return (
    <div className={styles.settings}>
      <PHeading tag="h2" size="small">
        Game
      </PHeading>

      <PSegmentedControl
        value={mode}
        label="Opponent"
        onChange={(event) => onMode(event.detail.value as GameMode)}
      >
        <PSegmentedControlItem value="vs-bot">Computer</PSegmentedControlItem>
        <PSegmentedControlItem value="local">Two players</PSegmentedControlItem>
      </PSegmentedControl>

      {mode === 'vs-bot' && (
        <>
          <PSegmentedControl
            value={difficulty}
            label="Difficulty"
            onChange={(event) => onDifficulty(event.detail.value as Difficulty)}
          >
            <PSegmentedControlItem value="easy">{DIFFICULTY_LABEL.easy}</PSegmentedControlItem>
            <PSegmentedControlItem value="medium">{DIFFICULTY_LABEL.medium}</PSegmentedControlItem>
            <PSegmentedControlItem value="hard">{DIFFICULTY_LABEL.hard}</PSegmentedControlItem>
          </PSegmentedControl>

          <PSegmentedControl
            value={botColor === 'b' ? 'w' : 'b'}
            label="You play"
            onChange={(event) => onBotColor(event.detail.value === 'w' ? 'b' : 'w')}
          >
            <PSegmentedControlItem value="w">White</PSegmentedControlItem>
            <PSegmentedControlItem value="b">Black</PSegmentedControlItem>
          </PSegmentedControl>
        </>
      )}

      <PDivider color="contrast-low" />

      <PHeading tag="h2" size="small">
        Board
      </PHeading>
      <PSwitch
        checked={showLegalMoves}
        onUpdate={(event) => onOption('showLegalMoves', event.detail.checked)}
      >
        Show legal moves
      </PSwitch>
      <PSwitch
        checked={showCoordinates}
        onUpdate={(event) => onOption('showCoordinates', event.detail.checked)}
      >
        Show coordinates
      </PSwitch>
    </div>
  );
}
