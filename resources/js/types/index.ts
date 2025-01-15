import { Language } from './language';

export * from './language';

export interface PageProps {
    [key: string]: any; // Add index signature to satisfy @inertiajs/core
}

export interface Translations {
    [key: string]: {
        [subKey: string]: string;
    };
}
export interface User {
    id: number;
    name: string;
    email: string | null;
    is_guest: boolean;
    guest_token?: string;
    last_active_at?: string;
    language_pair_id: string;
    gender_duel_difficulty?: 'easy' | 'medium' | 'hard';
    memory_translation_difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Category {
    id: number;
    key: string;
}

export interface Noun {
    id: number;
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

export interface GenderDuelGamePlayer {
    id: number;
    gender_duel_game_id: number;
    user_id?: number;
    guest_id?: string;
    player_name: string;
    score: number;
    is_ready: boolean;
    is_host: boolean;
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
    current_turn: number;
    language_name: string;
    source_language: Language;
    target_language: Language;
    language_pair_id: number;
    words: Noun[];
    players: MemoryTranslationGamePlayer[];
    category: Category;
}

export interface MemoryTranslationGamePlayer {
    id: number;
    memory_translation_game_id: number;
    user_id?: number;
    guest_id?: string;
    player_name: string;
    score: number;
    moves: number;
    time: number;
    is_ready: boolean;
    is_host: boolean;
}
