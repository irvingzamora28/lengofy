import { BaseGameState, BaseGameMessage } from '../../core/types';

export interface GenderDuelGameState extends BaseGameState {
    id: string;
    status: 'waiting' | 'in_progress' | 'completed';
    current_round: number;
    current_word: any;
    words: any[];
    players: any[];
    language_name: string;
    total_rounds: number;
    category: string;
    hostId: string;
    last_answer: any;
    max_players: number;
    winner?: any;
}

export interface GenderDuelGameMessage extends BaseGameMessage {
    type: string;
    gameId: string;
    genderDuelGameId?: string; // For backward compatibility
    gameType?: string;
    userId: string;
    data?: {
        player_id?: string;
        user_id?: string;
        players?: any[];
        words?: any[];
        language_name?: string;
        total_rounds?: number;
        category?: string;
        hostId?: string;
        max_players?: number;
        answer?: string;
    };
    game?: any;
}

export interface MemoryTranslationGameMessage extends BaseGameMessage {
    type: string;
    gameId: string;
    memoryTranslationGameId?: string;
    gameType?: string;
    userId: string;
    data?: {
        player_id?: string;
        user_id?: string;
        players?: any[];
        words?: any[];
        language_name?: string;
        total_rounds?: number;
        category?: string;
        hostId?: string;
        max_players?: number;
        answer?: string;
    };
    game?: any;
}
