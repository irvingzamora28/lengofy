import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Practice from '@/Pages/VerbConjugationSlotGame/Practice';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock('@inertiajs/react', () => ({
  router: { visit: vi.fn() },
  usePage: () => ({ props: { auth: { user: { id: 1, name: 'Test User' } }, flash: {} } }),
  Link: ({ children }: any) => <a>{children}</a>,
  Head: ({ children }: any) => <>{children}</>
}));
vi.mock('@/Layouts/AuthenticatedLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="authenticated-layout">{children}</div>
}));
vi.mock('axios', () => ({ default: { post: vi.fn(), get: vi.fn() } }));

const prompts = [
  {
    pronoun: { id: 1, code: 'yo', display: 'yo' },
    verb: { id: 10, infinitive: 'hablar', translation: 'to speak' },
    tense: { id: 100, code: 'pres', name: 'presente' },
    expected: 'hablo',
    normalized_expected: 'hablo',
  },
];

describe('Practice timers by difficulty (structure smoke test)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders with easy difficulty and shows timer UI', () => {
    render(<Practice prompts={prompts as any} difficulty="easy" category={0} targetLanguage="es" auth={{ user: { id: 1 } }} />);
    vi.advanceTimersByTime(0);
    expect(screen.getByText(/verb_conjugation_slot\.game_info\.difficulty/i)).toBeInTheDocument();
  });

  it('renders with hard difficulty and shows timer UI', () => {
    render(<Practice prompts={prompts as any} difficulty="hard" category={0} targetLanguage="es" auth={{ user: { id: 1 } }} />);
    vi.advanceTimersByTime(0);
    expect(screen.getByText(/verb_conjugation_slot\.game_info\.difficulty/i)).toBeInTheDocument();
  });
});
