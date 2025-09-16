import { ServerWebSocket } from "bun";

export type GameType = 'gender_duel' | 'memory_translation' | 'word_search_puzzle' | 'verb_conjugation_slot';

export interface BaseGameState {
    id: string;
    status: 'waiting' | 'in_progress' | 'completed';
    players: any[];
    hostId: string;
}

export interface BaseGameMessage {
    type: string;
    gameId: string;
    userId: string;
    data?: any;
}

export interface GameManager<T extends BaseGameState> {
    initialize(): void;
    handleMessage(ws: ServerWebSocket, message: BaseGameMessage): void;
    cleanup(gameId: string): void;
    cleanupCompletely(gameId: string): void;
    broadcastState(gameId: string): void;
    getRoom(gameId: string): Set<ServerWebSocket> | undefined;
    getState(gameId: string): T | undefined;
    setState(gameId: string, state: T): void;
}
