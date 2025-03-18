import { BaseGameState, BaseGameMessage } from '../../core/types';

export interface WordSearchPuzzleGameState extends BaseGameState {
    id: string;
    status: 'waiting' | 'in_progress' | 'completed';
    players: WordSearchPuzzlePlayer[];
    words_found: Map<number, Set<string>>;
    round_time: number;
    round_start_time: number | null;
    hostId: number;
    max_players: number;
    category: string;
    winner?: WordSearchPuzzlePlayer | null;
}

export interface WordSearchPuzzlePlayer {
    id: number;
    user_id: number;
    player_name: string;
    score: number;
    is_ready: boolean;
    is_host: boolean;
}

export interface WordSearchPuzzleGameMessage extends BaseGameMessage {
    type: string;
    gameId: string;
    WordSearchPuzzleGameId?: string;
    gameType?: string;
    userId: number;
    data?: {
        player_id?: number;
        word?: string;
        players?: WordSearchPuzzlePlayer[];
        language_name?: string;
        max_players?: number;
    };
    game?: any;
}
