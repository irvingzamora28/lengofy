import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Show from '../../../Pages/MemoryTranslationGame/Show';
import { MemoryTranslationGame } from '@/types';
import axios, { AxiosStatic } from 'axios';

// Mock dependencies
vi.mock('@inertiajs/react', () => ({
  Head: vi.fn(({ title }) => <title>{title}</title>),
  router: {
    visit: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    get: vi.fn()
  }
}));

import type { Mock } from 'vitest';

vi.mock('axios');
const mockedAxios = axios as unknown as { get: Mock<typeof axios.get> };

vi.mock('@/Layouts/AuthenticatedLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="authenticated-layout">{children}</div>
}));

vi.mock('@/Components/MemoryTranslationGame/GameArea', () => ({
  __esModule: true,
  default: vi.fn(props => (
    <div data-testid="game-area">
      <button onClick={props.onChangeCategory} data-testid="change-category-btn">
        Change Category
      </button>
    </div>
  ))
}));

vi.mock('@/Components/MemoryTranslationGame/GameInfo', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="game-info" />)
}));

vi.mock('@/Components/MemoryTranslationGame/PlayersInfo', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="players-info" />)
}));

vi.mock('@/Components/Games/DifficultyModal', () => ({
  __esModule: true,
  default: vi.fn(props => (
    <div data-testid="difficulty-modal" data-show={props.showDifficultyModal}>
      <button onClick={() => props.setShowDifficultyModal(false)} data-testid="close-modal-btn">
        Close
      </button>
      <button onClick={props.startGame} data-testid="start-game-btn">
        Start Game
      </button>
      <select
        data-testid="difficulty-select"
        value={props.selectedDifficulty}
        onChange={(e) => props.setSelectedDifficulty(e.target.value)}
      >
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
      <select
        data-testid="category-select"
        value={props.selectedCategory}
        onChange={(e) => props.setSelectedCategory(parseInt(e.target.value))}
      >
        <option value="0">All</option>
        <option value="1">Food</option>
      </select>
    </div>
  ))
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  readyState: 1,
  OPEN: 1,
  CLOSED: 3,
  onopen: vi.fn(),
  onmessage: vi.fn(),
  onclose: vi.fn(),
  onerror: vi.fn()
})) as any;

describe('Show Component', () => {
  const mockGame: MemoryTranslationGame = {
    id: 1,
    status: 'completed',
    words: [
      { id: '1-word', word: 'apple', translation: 'manzana', gender: 'la', emoji: '🍎' },
      { id: '1-translation', word: 'manzana', translation: 'apple', gender: 'la', emoji: '🍎' },
    ],
    players: [
      {
        id: 1,
        user_id: 1,
        player_name: 'Player 1',
        score: 10,
        is_ready: true,
        moves: 5,
        time: 60,
        memory_translation_game_id: 1,
        is_host: true
      },
      {
        id: 2,
        user_id: 2,
        player_name: 'Player 2',
        score: 5,
        is_ready: true,
        moves: 7,
        time: 90,
        memory_translation_game_id: 1,
        is_host: false
      }
    ],
    hostId: 1,
    current_turn: 1,
    max_players: 2,
    difficulty: 'medium',
    language_name: 'Spanish',
    source_language: { id: 1, name: 'English', code: 'en', flag: '🇺🇸' },
    target_language: { id: 2, name: 'Spanish', code: 'es', flag: '🇪🇸' },
    category: { id: 1, key: 'food' },
    language_pair_id: 1,
    winner: { user_id: 1, player_name: 'Player 1', memory_translation_game_id: 1, moves: 5, time: 60, is_ready: true, is_host: true, id: 1, score: 10 },
  };

  const defaultProps = {
    auth: {
      user: {
        id: 1,
        name: 'Test User',
      }
    },
    memory_translation_game: mockGame,
    wsEndpoint: 'ws://localhost:3000',
    justCreated: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock axios response for fetchWords
    mockedAxios.get.mockResolvedValue({
      data: [
        { id: 1, word: 'apple', translation: 'manzana', gender: 'la', emoji: '🍎' },
        { id: 2, word: 'banana', translation: 'plátano', gender: 'el', emoji: '🍌' },
      ]
    });
  });

  test('renders the game area component', () => {
    render(<Show {...defaultProps} />);

    expect(screen.getByTestId('game-area')).toBeInTheDocument();
    expect(screen.getByTestId('game-info')).toBeInTheDocument();
    expect(screen.getByTestId('players-info')).toBeInTheDocument();
  });

  test('opens difficulty modal when change category button is clicked', async () => {
    render(<Show {...defaultProps} />);

    // Initially the modal should be hidden
    expect(screen.getByTestId('difficulty-modal').getAttribute('data-show')).toBe('false');

    // Click the change category button
    fireEvent.click(screen.getByTestId('change-category-btn'));

    // Modal should now be visible
    expect(screen.getByTestId('difficulty-modal').getAttribute('data-show')).toBe('true');
  });

  test('closes difficulty modal when close button is clicked', async () => {
    render(<Show {...defaultProps} />);

    // Open the modal
    fireEvent.click(screen.getByTestId('change-category-btn'));
    expect(screen.getByTestId('difficulty-modal').getAttribute('data-show')).toBe('true');

    // Close the modal
    fireEvent.click(screen.getByTestId('close-modal-btn'));

    // Modal should be hidden again
    expect(screen.getByTestId('difficulty-modal').getAttribute('data-show')).toBe('false');
  });

  test('fetches new words and restarts game when start game button is clicked', async () => {
    // Setup axios mock response
    const mockResponse = {
      data: [
        { id: 1, word: 'apple', translation: 'manzana', gender: 'la', emoji: '🍎' },
        { id: 2, word: 'banana', translation: 'plátano', gender: 'el', emoji: '🍌' },
      ]
    };

    mockedAxios.get.mockResolvedValue(mockResponse);

    render(<Show {...defaultProps} />);

    // Open the modal
    fireEvent.click(screen.getByTestId('change-category-btn'));

    // Change difficulty and category
    fireEvent.change(screen.getByTestId('difficulty-select'), { target: { value: 'hard' } });
    fireEvent.change(screen.getByTestId('category-select'), { target: { value: '1' } });

    // Click start game and wait for async operations
    await act(async () => {
      fireEvent.click(screen.getByTestId('start-game-btn'));
      // Wait for all promises to resolve
      await Promise.resolve();
    });

    // Wait for axios call to complete
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: {
            difficulty: 'hard',
            category: 1,
          },
        })
      );
    });
  });

  test('passes the correct props to the DifficultyModal', () => {
    render(<Show {...defaultProps} />);

    // Open the modal
    fireEvent.click(screen.getByTestId('change-category-btn'));

    const difficultyModal = screen.getByTestId('difficulty-modal');

    // Verify initial values match the game's current settings
    expect((screen.getByTestId('difficulty-select') as HTMLSelectElement).value).toBe('medium');
    expect((screen.getByTestId('category-select') as HTMLSelectElement).value).toBe('1');
  });
});
