import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import GameArea from '../../../Components/MemoryTranslationGame/GameArea';
import { MemoryTranslationGame } from '@/types';

// Mock the useTranslation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'memory_translation.restart_game': 'Restart Game',
        'memory_translation.change_category': 'Change Category',
        'memory_translation.waiting_for_players': 'Waiting for players',
        'memory_translation.i_am_ready': 'I am ready',
        'generals.games.game_completed': 'Game Completed',
        'generals.games.winner_announcement': 'Winner: {{name}}',
        'generals.games.tie': 'It\'s a tie!',
        'generals.games.final_score': 'Final Score',
        'memory_translation.your_turn': 'Your Turn',
        'memory_translation.players_turn': '{{name}}\'s Turn',
      };
      return translations[key] || key;
    }
  })
}));

describe('GameArea Component', () => {
  // Mock props
  const mockGame: MemoryTranslationGame = {
    id: 1,
    status: 'completed',
    words: [
      { id: '1-word', word: 'apple', translation: 'manzana', gender: 'la', emoji: '🍎' },
      { id: '1-translation', word: 'manzana', translation: 'apple', gender: 'la', emoji: '🍎' },
    ],
    players: [
      { id: 1, user_id: 1, player_name: 'Player 1', score: 10, is_ready: true, moves: 5, time: 60, memory_translation_game_id: 1, is_host: true },
      { id: 2, user_id: 2, player_name: 'Player 2', score: 5, is_ready: true, moves: 7, time: 90, memory_translation_game_id: 1, is_host: false },
    ],
    hostId: 1,
    current_turn: 1,
    max_players: 2,
    difficulty: 'medium',
    language_name: 'Spanish',
    source_language: { id: 1, name: 'English', code: 'en', flag: 'us' },
    target_language: { id: 2, name: 'Spanish', code: 'es', flag: 'es' },
    category: { id: 1, key: 'food' },
    language_pair_id: 1,
  };

  const defaultProps = {
    game: mockGame,
    selectedCards: [],
    matchedPairs: [],
    isCurrentPlayerReady: true,
    onCardClick: vi.fn(),
    onReady: vi.fn(),
    currentUserId: 1,
    onRestart: vi.fn(),
    onChangeCategory: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders restart and change category buttons when game is completed and user is host', () => {
    render(<GameArea {...defaultProps} />);

    // Check if both buttons are rendered
    const restartButton = screen.getByText(/Restart Game/i); // Use regex for case-insensitive matching
    const changeCategoryButton = screen.getByText(/generals\.games\.change_category/i); // Match the translation key

    expect(restartButton).toBeDefined();
    expect(changeCategoryButton).toBeDefined();
  });

  test('does not render buttons when user is not host', () => {
    const props = {
      ...defaultProps,
      currentUserId: 2, // Not the host
    };

    render(<GameArea {...props} />);

    // Check that buttons are not rendered
    expect(screen.queryByText(/Restart Game/i)).toBeNull();
    expect(screen.queryByText(/generals\.games\.change_category/i)).toBeNull();
  });

  test('calls onRestart when restart button is clicked', () => {
    render(<GameArea {...defaultProps} />);

    const restartButton = screen.getByText(/Restart Game/i);
    fireEvent.click(restartButton);

    expect(defaultProps.onRestart).toHaveBeenCalledOnce();
  });

  test('calls onChangeCategory when change category button is clicked', () => {
    render(<GameArea {...defaultProps} />);

    const changeCategoryButton = screen.getByText(/generals\.games\.change_category/i);
    fireEvent.click(changeCategoryButton);

    expect(defaultProps.onChangeCategory).toHaveBeenCalledOnce();
  });

  test('does not render buttons when game is not completed', () => {
    const props = {
      ...defaultProps,
      game: {
        ...mockGame,
        status: 'in_progress' as 'waiting' | 'in_progress' | 'completed',
      },
    };

    render(<GameArea {...props} />);

    // Check that buttons are not rendered
    expect(screen.queryByText(/Restart Game/i)).toBeNull();
    expect(screen.queryByText(/generals\.games\.change_category/i)).toBeNull();
  });

  test('renders buttons in a column on mobile and row on desktop', () => {
    render(<GameArea {...defaultProps} />);

    const buttonContainer = screen.getByText(/Restart Game/i).closest('div');

    // Check if the container has the correct flex classes
    expect(buttonContainer?.className).toContain('flex');
    expect(buttonContainer?.className).toContain('flex-col');
    expect(buttonContainer?.className).toContain('sm:flex-row');
  });
});
