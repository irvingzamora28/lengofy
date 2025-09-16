import { ServerWebSocket } from "bun";
import { BaseGameState, BaseGameMessage } from './types';

export abstract class BaseGameManager<T extends BaseGameState> {
    protected rooms: Map<string, Set<ServerWebSocket>> = new Map();
    protected states: Map<string, T> = new Map();
    protected timeoutFlags: Map<string, Set<number>> = new Map();
    protected gameType: string;
    private lobbyConnections: Set<ServerWebSocket>;

    constructor(gameType: string, lobbyConnections: Set<ServerWebSocket>) {
        this.gameType = gameType;
        this.lobbyConnections = lobbyConnections;
    }

    initialize(): void {
        // Initialize maps if needed
    }

    abstract handleMessage(ws: ServerWebSocket, message: BaseGameMessage): void;

    cleanup(gameId: string): void {
        console.log(`Cleaning up ${this.gameType} game resources for`, gameId);
        const timeoutFlags = this.timeoutFlags.get(gameId);
        if (timeoutFlags) {
            timeoutFlags.clear();
        }
    }

    cleanupCompletely(gameId: string): void {
        console.log(`Completely cleaning up ${this.gameType} game`, gameId);
        this.rooms.delete(gameId);
        this.states.delete(gameId);
        this.timeoutFlags.delete(gameId);
        this.broadcastToLobby({
            type: `${this.gameType}_game_ended`,
            gameId: gameId
        });
    }

    protected broadcastToLobby(message: any): void {
        console.log('Broadcasting to lobby:', message);
        for (const client of this.lobbyConnections) {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(JSON.stringify(message));
            }
        }
    }

    protected broadcastState(gameId: string): void {
        const room = this.getRoom(gameId);
        const state = this.getState(gameId);
        if (room && state) {
            const message = {
                type: `${this.gameType}_game_state_updated`,
                data: state,
            };
            this.broadcast(room, message);
        }
    }

    getRoom(gameId: string): Set<ServerWebSocket> | undefined {
        return this.rooms.get(gameId);
    }

    getState(gameId: string): T | undefined {
        return this.states.get(gameId);
    }

    setState(gameId: string, state: T): void {
        this.states.set(gameId, state);
    }

    protected broadcast(room: Set<ServerWebSocket>, message: any): void {
        const messageStr = JSON.stringify(message);
        for (const client of room) {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(messageStr);
            }
        }
    }
}
