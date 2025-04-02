/**
 * Test file for the DifficultyModal component
 */

import { describe, it, beforeEach, afterEach, expect, vi, Mocked } from "vitest";
import { render, screen, fireEvent } from '@testing-library/react';
import DifficultyModal from '../../Components/Games/DifficultyModal';

// Import the modules we need to mock
import axios from 'axios';
import { useTranslation } from 'react-i18next';

// Set up mocks before tests
vi.mock('axios');
const mockedAxios = axios as Mocked<typeof axios>;
vi.mock('react-i18next');

// Setup mock implementations
beforeEach(() => {
  // Mock axios.get
  vi.mocked(axios.get).mockResolvedValue({
    data: [
      { id: 1, key: 'food' },
      { id: 2, key: 'animals' }
    ]
  });

  // Mock useTranslation
  vi.mocked(useTranslation).mockReturnValue({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'gender_duel.modal_difficulty.title': 'Select Difficulty',
        'gender_duel.modal_difficulty.select_word_category': 'Select Word Category',
        'gender_duel.modal_difficulty.choose': 'Choose',
        'categories.all': 'All',
        'gender_duel.modal_difficulty.for_words_from_every_category': 'for words from every category',
        'gender_duel.modal_difficulty.easy': 'Easy',
        'gender_duel.modal_difficulty.medium': 'Medium',
        'gender_duel.modal_difficulty.hard': 'Hard',
        'gender_duel.modal_difficulty.start_practice': 'Start Practice',
        'gender_duel.modal_difficulty.create_room': 'Create Room',
        'gender_duel.modal_difficulty.start': 'Start',
        'categories.food': 'Food',
        'categories.animals': 'Animals',
      };
      return translations[key] || key;
    },
    i18n: { changeLanguage: vi.fn() }
  } as any);
});

// Route is already mocked in vitest.setup.ts

describe('DifficultyModal Component', () => {
  const defaultProps = {
    showDifficultyModal: true,
    setShowDifficultyModal: vi.fn(),
    selectedDifficulty: 'medium' as 'easy' | 'medium' | 'hard',
    setSelectedDifficulty: vi.fn(),
    selectedCategory: 1,
    setSelectedCategory: vi.fn(),
    startGame: vi.fn(),
    easyText: 'Fewer words, longer time',
    mediumText: 'Balanced difficulty',
    hardText: 'More words, less time',
    gameType: 'multiPlayer' as 'singlePlayer' | 'multiPlayer',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('displays the correct button text for multiPlayer mode', () => {
    render(<DifficultyModal {...defaultProps} />);

    const startButton = screen.getByText('Create Room');
    expect(startButton).toBeDefined();
  });

  test('displays the correct button text for singlePlayer mode', () => {
    render(<DifficultyModal {...defaultProps} gameType="singlePlayer" />);

    const startButton = screen.getByText('Start Practice');
    expect(startButton).toBeDefined();
  });

  test('displays the correct button text for restart mode', () => {
    render(<DifficultyModal {...defaultProps} isRestart={true} />);

    const startButton = screen.getByText('Start');
    expect(startButton).toBeDefined();
  });

  test('calls startGame when the start button is clicked', () => {
    render(<DifficultyModal {...defaultProps} />);

    const startButton = screen.getByText('Create Room');
    fireEvent.click(startButton);

    expect(defaultProps.startGame).toHaveBeenCalled();
    expect(defaultProps.setShowDifficultyModal).toHaveBeenCalledWith(false);
  });
});
