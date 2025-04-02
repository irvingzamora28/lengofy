import { Language, LanguagePair } from './language';

export * from './language';

export interface PageProps {
    [key: string]: any; // Add index signature to satisfy @inertiajs/core
}

export interface Translations {
    [key: string]: {
        [subKey: string]: string;
    };
}

export interface Lesson {
    filename: string;
    path: string;
    title: string;
    lesson_number: number;
    level: string;
    topics: string[];
    completed: boolean;
}

export interface User {
    id: number;
    name: string;
    email: string | null;
    is_guest: boolean;
    guest_token?: string;
    last_active_at?: string;
    language_pair_id: string;
    language_pair?: LanguagePair;
    gender_duel_difficulty?: 'easy' | 'medium' | 'hard';
    memory_translation_difficulty?: 'easy' | 'medium' | 'hard';
    word_search_puzzle_difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Category {
    id: number;
    key: string;
}

export interface Noun {
    id: number | string;
    word: string;
    gender: 'der' | 'die' | 'das' | 'el' | 'la';
    translation?: string;
    emoji?: string;
}

export interface GenderDuelGame {
    hostId: any;
    id: number;
    status: 'waiting' | 'in_progress' | 'completed';
    max_players: number;
    current_round: number;
    total_rounds: number;
    language_name: string;
    source_language: Language;
    target_language: Language;
    language_pair_id: number;
    words: Noun[];
    current_word?: Noun;
    players: GenderDuelGamePlayer[];
    category: Category;
}

export interface GenderDuelAnswer {
    word: string;
    translation: string | undefined;
    userAnswer: any;
    correctAnswer: 'der' | 'die' | 'das' | 'el' | 'la';
}

interface BaseGamePlayer {
    id: number;
    user_id?: number;
    guest_id?: string;
    player_name: string;
    score: number;
    is_ready: boolean;
    is_host: boolean;
}

export interface GenderDuelGamePlayer extends BaseGamePlayer {
    gender_duel_game_id: number;
}

export interface GenderDuelGameState {
    status: string;
    players: GenderDuelGamePlayer[];
    current_round: number;
    words: Noun[];
    hostId?: string;
    winner: GenderDuelGamePlayer | null;
    max_players?: number;
}

export interface Game {
    id: number;
    name: string;
    slug: string;
    description: string;
    supported_language_pairs: string[] | null;
}

export interface Score {
    id: number;
    user_id: number;
    game_id: number;
    highest_score: number;
    total_points: number;
    winning_streak: number;
    user: User;
    game: {
        id: number;
        name: string; // Include any other relevant game fields
    };
}

export interface MemoryTranslationGame {
    hostId: any;
    id: number;
    status: 'waiting' | 'in_progress' | 'completed';
    max_players: number;
    difficulty: 'easy' | 'medium' | 'hard';
    current_turn: number;
    language_name: string;
    source_language: Language;
    target_language: Language;
    language_pair_id: number;
    words: Noun[];
    players: MemoryTranslationGamePlayer[];
    winner: MemoryTranslationGamePlayer | null;
    category: Category;
}

export interface MemoryTranslationGamePlayer extends BaseGamePlayer {
    memory_translation_game_id: number;
    moves: number;
    time: number;
}

export interface MemoryTranslationGameState {
    id: string;
    status: 'waiting' | 'in_progress' | 'completed';
    players: MemoryTranslationGamePlayer[];
    words: Noun[];
    language_name: string;
    hostId: number;
    max_players: number;
    current_turn: number;
    category: string;
    winner: MemoryTranslationGamePlayer | null;
}

export interface GridCell {
    letter: string;
    isSelected: boolean;
    isFound: boolean;
}

export interface WordSearchPuzzleWord {
    id: number;
    word: string;
    translation: string;
    found?: boolean; // Make found optional since it's a runtime property
}

export interface WordSearchPuzzleGame {
    hostId: number;
    id: number;
    status: 'waiting' | 'in_progress' | 'completed';
    max_players: number;
    difficulty: 'easy' | 'medium' | 'hard';
    language_name: string;
    source_language: Language;
    target_language: Language;
    language_pair_id: number;
    words: WordSearchPuzzleWord[];
    players: WordSearchPuzzlePlayer[];
    grid: GridCell[][];
    words_found: { [key: number]: Set<string> };
    round_time: number;
    round_start_time: number | null;
    category: Category;
}

export interface WordSearchPuzzlePlayer {
    id: number;
    user_id: number;
    player_name: string;
    score: number;
    is_ready: boolean;
    is_host: boolean;
}

export interface WordSearchPuzzleGameState extends WordSearchPuzzleGame {
    words_found: { [key: number]: Set<string> };
    winner?: WordSearchPuzzlePlayer | null;
}

export interface CellCoordinate {
    x: number;
    y: number;
}
