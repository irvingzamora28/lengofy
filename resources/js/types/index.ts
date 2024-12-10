import { Language } from './language';

export * from './language';

export interface User {
    id: number;
    name: string;
    email: string | null;
    is_guest: boolean;
    guest_token?: string;
    last_active_at?: string;
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
    current_word?: {
        id: number;
        word: string;
        gender: string;
    };
    players: GenderDuelGamePlayer[];
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
