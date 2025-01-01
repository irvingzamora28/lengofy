import { Language } from './language';

export * from './language';

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
    current_word?: Noun;
    players: GenderDuelGamePlayer[];
    category: Category;
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
