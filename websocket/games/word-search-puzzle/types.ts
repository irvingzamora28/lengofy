import { BaseGameState, BaseGameMessage } from '../../core/types';

export interface GridCell {
    letter: string;
    isSelected: boolean;
    isFound: boolean;
}

export interface WordSearchPuzzleGameState extends BaseGameState {
    id: string;
    status: 'waiting' | 'in_progress' | 'completed';
    players: {
        id: string;
        user_id: string;
        player_name: string;
        score: number;
        is_ready?: boolean;
        is_host?: boolean;
        words_found: Set<string>;
    }[];
    words: {
        id: number;
        word: string;
        translation: string;
        found?: boolean;
    }[];
    words_found: { [key: number]: Set<string> };
    grid: GridCell[][]; // Add the grid property
    round_time: number;
    round_start_time: number | null;
    category?: {
        id: number;
        name: string;
    };
    max_players: number;
    hostId: string;
    winner: {
        id: string;
        player_name: string;
        score: number;
    } | null;
}

export interface WordSearchPuzzlePlayer {
    id: number;
    user_id: string;
    player_name: string;
    score: number;
    is_ready: boolean;
    is_host: boolean;
}

export interface WordSearchPuzzleGameMessage extends BaseGameMessage {
    type: string;
    gameId: string;
    userId: string;
    game?: WordSearchPuzzleGameState;
    data?: {
        player_id?: string;
        user_id?: string;
        player_name?: string;
        players?: any[];
        words?: any[];
        grid?: GridCell[][]; // Add grid to message data
        word?: string;
        cells?: { x: number; y: number }[];
        category?: any;
        max_players?: number;
        hostId?: string;
        source_language?: string;
        target_language?: string;
    };
}
