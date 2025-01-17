import { Noun } from '../../../resources/js/types';
import { BaseGameState, BaseGameMessage } from '../../core/types';

export interface MemoryTranslationGameState extends BaseGameState {
    id: string;
    status: 'waiting' | 'in_progress' | 'completed';
    players: {
        id: number;
        user_id?: number;
        guest_id?: string;
        player_name: string;
        score: number;
        moves: number;
        time: number;
        is_ready: boolean;
        is_host: boolean;
    }[];
    words: Noun[];
    language_name: string;
    hostId: string;
    max_players: number;
    current_turn: number;
    language_pair_id: number;
    category_id: number;
}

export interface MemoryTranslationGameMessage extends BaseGameMessage {
    type: string;
    gameId: string;
    memoryTranslationGameId?: string;
    gameType?: string;
    userId?: string;
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
