import { Language } from '@/types/language';

export interface Player {
    id: number;
    user_id: number;
    game_id: number;
    player_name: string;
    score: number;
    is_ready: boolean;
    is_host: boolean;
}

export interface Game {
    id: number;
    players: Player[];
    max_players: number;
    language_name: string;
    source_language: Language;
    target_language: Language;
    language_pair_id: number;
    status: string;
    current_word?: {
        id: number;
        word: string;
        gender: string;
    };
    current_round: number;
    total_rounds: number;
}
