import { MemoryTranslationGamePlayer, Noun } from '../../../resources/js/types';
import { BaseGameState, BaseGameMessage } from '../../core/types';

export interface MemoryTranslationGameState extends BaseGameState {
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

export interface MemoryTranslationGameMessage extends BaseGameMessage {
    type: string;
    gameId: string;
    memoryTranslationGameId?: string;
    gameType?: string;
    userId: number;
    data?: {
        player_id?: number;
        user_id?: string;
        players?: MemoryTranslationGamePlayer[];
        words?: any[];
        language_name?: string;
        total_rounds?: number;
        category?: string;
        hostId?: number;
        max_players?: number;
        answer?: string;
        score?: number;
        moves?: number;
        time?: number;
    };
    game?: any;
}
