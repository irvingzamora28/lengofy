import { ServerWebSocket } from "bun";
import { GameType, GameManager, BaseGameState } from './types';
import { GenderDuelManager } from '../games/gender-duel/GenderDuelManager';

export class WebSocketServer {
    private gameManagers: Map<GameType, GameManager<BaseGameState>>;
    private lobbyConnections: Set<ServerWebSocket>;

    constructor() {
        this.gameManagers = new Map();
        this.lobbyConnections = new Set();
        this.gameManagers.set('gender_duel', new GenderDuelManager(this.lobbyConnections));
    }

    getWebSocketConfig() {
        return {
            message: (ws: ServerWebSocket, message: string) => this.handleMessage(ws, message),
            open: (ws: ServerWebSocket) => this.handleConnection(ws),
            close: (ws: ServerWebSocket) => this.handleDisconnection(ws),
            drain: (ws: ServerWebSocket) => {
                // Handle backpressure
            },
        };
    }

    private handleConnection(ws: ServerWebSocket) {
        console.log('Client connected');
        this.lobbyConnections.add(ws);
    }

    private handleDisconnection(ws: ServerWebSocket) {
        console.log('Client disconnected');
        this.cleanupPlayer(ws);
    }

    private handleMessage(ws: ServerWebSocket, message: string) {
        try {
            const data = JSON.parse(message);
            console.log('Received message:', data.type);

            if (data.type === 'join_lobby') {
                this.lobbyConnections.add(ws);
                return;
            }

            // Handle game-specific messages
            if (data.type.includes('gender_duel') || data.gameType === 'gender_duel') {
                const gameManager = this.gameManagers.get('gender_duel');
                if (gameManager) {
                    gameManager.handleMessage(ws, data);
                }
                return;
            }

            // Handle player-related messages
            if (data.type.startsWith('player_') || data.type === 'submit_answer') {
                if (data.gameType === 'gender_duel') {
                    const gameManager = this.gameManagers.get('gender_duel');
                    if (gameManager) {
                        gameManager.handleMessage(ws, data);
                        return;
                    }
                }
            }

            console.log(`Unhandled message type: ${data.type}`);
        } catch (error) {
            console.error('Error processing message:', error);
        }
    }

    private cleanupPlayer(ws: ServerWebSocket): void {
        this.lobbyConnections.delete(ws);

        // Check all game managers for this player
        for (const [, manager] of this.gameManagers.entries()) {
            const rooms = (manager as any).rooms as Map<string, Set<ServerWebSocket>>;
            for (const [gameId, room] of rooms.entries()) {
                if (room.has(ws)) {
                    room.delete(ws);
                    if (room.size === 0) {
                        manager.cleanupCompletely(gameId);
                    } else {
                        manager.broadcastState(gameId);
                    }
                }
            }
        }
    }
}
