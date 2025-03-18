import { BaseGameState, BaseGameMessage } from '../../core/types';

export interface WordPuzzleGameState extends BaseGameState {
    id: string;
    status: 'waiting' | 'in_progress' | 'completed';
    players: WordPuzzlePlayer[];
    words_found: Map<number, Set<string>>;
    round_time: number;
    round_start_time: number | null;
    hostId: number;
    max_players: number;
    category: string;
    winner?: WordPuzzlePlayer | null;
}

export interface WordPuzzlePlayer {
    id: number;
    user_id: number;
    player_name: string;
    score: number;
    is_ready: boolean;
    is_host: boolean;
}

export interface WordPuzzleGameMessage extends BaseGameMessage {
    type: string;
    gameId: string;
    wordPuzzleGameId?: string;
    gameType?: string;
    userId: number;
    data?: {
        player_id?: number;
        word?: string;
        players?: WordPuzzlePlayer[];
        language_name?: string;
        max_players?: number;
    };
    game?: any;
}
