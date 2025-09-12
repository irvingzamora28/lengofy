import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import GameArea, { VCSPrompt, Player } from '@/Components/VerbConjugationSlotGame/GameArea';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k })
}));

const samplePrompts: VCSPrompt[] = [
  {
    pronoun: { id: 1, code: 'yo', display: 'yo' },
    verb: { id: 10, infinitive: 'hablar', translation: 'to speak' },
    tense: { id: 100, code: 'pres', name: 'presente' },
    expected: 'hablo',
    normalized_expected: 'hablo'
  }
];

const me: Player = { id: 1, user_id: 1, player_name: 'Me', score: 0, is_ready: false };

describe('GameArea interactions', () => {
  it('renders round and reels, submits answer and emits callbacks', () => {
    const onSubmitAnswer = vi.fn();
    const onReady = vi.fn();
    const onStartSpin = vi.fn();

    render(
      <GameArea
        status="in_progress"
        currentRound={0}
        totalRounds={3}
        prompt={samplePrompts[0]}
        promptsForReels={samplePrompts}
        me={me}
        isHost={true}
        timerSeconds={15}
        onTimerEnd={() => {}}
        onReady={onReady}
        onStartSpin={onStartSpin}
        onSubmitAnswer={onSubmitAnswer}
        lastAnswer={null}
      />
    );

    // Submit a user answer
    const input = screen.getByPlaceholderText('verb_conjugation_slot.input_placeholder');
    fireEvent.change(input, { target: { value: 'hablo' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmitAnswer).toHaveBeenCalledWith('hablo');

    // Ready button
    fireEvent.click(screen.getByText('verb_conjugation_slot.i_am_ready'));
    expect(onReady).toHaveBeenCalled();

    // Host can trigger spin
    fireEvent.click(screen.getByText('verb_conjugation_slot.start_spin'));
    expect(onStartSpin).toHaveBeenCalled();
  });
});
