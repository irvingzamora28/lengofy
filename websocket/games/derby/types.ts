import { BaseGameState, BaseGameMessage } from '../../core/types';

export interface DerbyGameState extends BaseGameState {
    id: string;
    status: 'waiting' | 'in_progress' | 'completed';
    players: DerbyPlayer[];
    difficulty: 'easy' | 'medium' | 'hard';
    max_players: number;
    race_mode: 'time' | 'distance';
    race_duration_s: number;
    total_segments: number;
    language_name: string;
    filters: {
        noun_list_ids?: number[];
        verb_list_ids?: number[];
        lesson_ids?: number[];
        language_pair_id: number;
    };
    current_prompt: DerbyPrompt | null;
    last_answer: DerbyAnswer | null;
    hostId: string;
    prompts: DerbyPrompt[];
    race_start_time?: number;
}

export interface DerbyPlayer {
    id: number;
    user_id: number;
    player_name: string;
    score: number;
    progress: number; // 0.0 to 1.0
    is_ready: boolean;
    streak: number;
    powerups: string[];
}

export interface DerbyPrompt {
    id: number;
    mode: 'article_gender' | 'translation' | 'verb_conjugation';
    word: string;
    options: string[];
    correct_answer: string;
    answer_window_ms: number;
}

export interface DerbyAnswer {
    player_id: number;
    user_id: number;
    player_name: string;
    answer: string;
    correct: boolean;
    elapsed_ms: number;
    prompt_id?: number;
    reason?: 'already_answered' | 'timeout' | 'normal';
}

export interface DerbyGameMessage extends BaseGameMessage {
    type: string;
    gameId: string;
    derbyGameId?: string;
    gameType?: string;
    userId: string;
    data?: {
        player_id?: number;
        user_id?: number;
        players?: DerbyPlayer[];
        prompts?: DerbyPrompt[];
        language_name?: string;
        difficulty?: 'easy' | 'medium' | 'hard';
        race_mode?: 'time' | 'distance';
        race_duration_s?: number;
        total_segments?: number;
        hostId?: string;
        max_players?: number;
        answer?: string;
        prompt_id?: number;
        elapsed_ms?: number;
        filters?: {
            noun_list_ids?: number[];
            verb_list_ids?: number[];
            lesson_ids?: number[];
            language_pair_id?: number;
        };
    };
    game?: any;
}
