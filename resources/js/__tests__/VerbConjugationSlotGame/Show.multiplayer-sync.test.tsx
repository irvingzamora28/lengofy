import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import Show from '@/Pages/VerbConjugationSlotGame/Show';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock('axios', () => ({ default: { post: vi.fn() } }));
vi.mock('@inertiajs/react', () => ({
  router: { visit: vi.fn(), delete: vi.fn() },
  usePage: () => ({ props: { auth: { user: { id: 1, name: 'Test User' } }, flash: {} } }),
  Link: ({ children }: any) => <a>{children}</a>,
  Head: ({ children }: any) => <>{children}</>
}));
vi.mock('@/Layouts/AuthenticatedLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="authenticated-layout">{children}</div>
}));

// Fake WebSocket implementation
class FakeWebSocket {
  static OPEN = 1;
  readyState = 1;
  onopen: (() => void) | null = null;
  onmessage: ((ev: any) => void) | null = null;
  sent: any[] = [];
  constructor(public url: string) { (global as any).__lastWS = this; setTimeout(() => this.onopen && this.onopen(), 0); }
  send(payload: string) { this.sent.push(JSON.parse(payload)); }
  close() {}
}

// @ts-ignore
global.WebSocket = FakeWebSocket;

const baseGame = {
  id: 99,
  status: 'in_progress' as const,
  players: [{ id: 1, user_id: 1, player_name: 'Me', score: 2 }],
  max_players: 2,
  total_rounds: 3,
  difficulty: 'easy' as const,
  language_name: 'Spanish',
  source_language: { id: 1, code: 'en', name: 'English', flag: '🇺🇸' },
  target_language: { id: 2, code: 'es', name: 'Español', flag: '🇪🇸' },
  prompts: [
    { pronoun: { id: 1, code: 'yo', display: 'yo' }, verb: { id: 10, infinitive: 'hablar' }, tense: { id: 100, code: 'pres', name: 'pres' }, expected: 'hablo', normalized_expected: 'hablo' }
  ],
  hostId: 1,
  category: null,
};

// Simulate Ziggy auth user to map to player
// @ts-ignore
(global as any).ziggy = { props: { auth: { user: { id: 1 } } } };

describe('Show multiplayer sync + scoring', () => {
  it('joins WS, handles prompt update, and posts score on completed', async () => {
    const { default: axios } = await import('axios');
    // Show.tsx reads auth from window.ziggy
    // @ts-ignore
    (global as any).ziggy = { props: { auth: { user: { id: 1 } } } };

    render(<Show auth={{ user: { id: 1, name: 'Test User' } }} justCreated={false} game={baseGame} wsEndpoint="ws://test" />);

    await act(async () => {
      // Send a game state update
      (global as any).__lastWS.onmessage?.({ data: JSON.stringify({
        type: 'verb_conjugation_slot_game_state_updated',
        data: { current_round: 1 }
      })});
    });

    // Complete the game
    await act(async () => {
      (global as any).__lastWS.onmessage?.({ data: JSON.stringify({
        type: 'verb_conjugation_slot_game_state_updated',
        data: { status: 'completed' }
      })});
    });

    expect(axios.post).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        user_id: 1,
        game_id: 4,
        highest_score: expect.any(Number),
        total_points: expect.any(Number),
        winning_streak: expect.any(Number),
      })
    );
  });
});
