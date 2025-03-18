import { ServerWebSocket } from "bun";
import { GameType, GameManager, BaseGameState } from './types';
import { GenderDuelManager } from '../games/gender-duel/GenderDuelManager';
import { MemoryTranslationManager } from '../games/memory-translation/MemoryTranslationManager';
import { WordSearchPuzzleManager } from '../games/word-search-puzzle/WordSearchPuzzleManager';

export class WebSocketServer {
    private gameManagers: Map<GameType, GameManager<BaseGameState>>;
    private lobbyConnections: Map<GameType, Set<ServerWebSocket>>;

    constructor() {
        this.gameManagers = new Map();
        this.lobbyConnections = new Map();

        // Initialize lobby connections for each game type
        this.lobbyConnections.set('gender_duel', new Set());
        this.lobbyConnections.set('memory_translation', new Set());
        this.lobbyConnections.set('word_search_puzzle', new Set());

        // Initialize game managers with their respective lobby connections
        this.gameManagers.set('gender_duel', new GenderDuelManager(this.lobbyConnections.get('gender_duel')!));
        this.gameManagers.set('memory_translation', new MemoryTranslationManager(this.lobbyConnections.get('memory_translation')!));
        this.gameManagers.set('word_search_puzzle', new WordSearchPuzzleManager(this.lobbyConnections.get('word_search_puzzle')!));
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
        // Connection will be added to specific game lobby when join_lobby message is received
    }

    private handleDisconnection(ws: ServerWebSocket) {
        console.log('Client disconnected');
        // Remove from all lobby connections
        for (const [gameType, connections] of this.lobbyConnections) {
            connections.delete(ws);
        }
        this.cleanupPlayer(ws);
    }

    private handleMessage(ws: ServerWebSocket, message: string) {
        try {
            const data = JSON.parse(message);
            console.log('Received message:', data.type);

            if (data.type === 'join_lobby') {
                const gameType = data.gameType as GameType;
                if (this.lobbyConnections.has(gameType)) {
                    // Remove from other lobbies first
                    for (const [type, connections] of this.lobbyConnections) {
                        if (type !== gameType) {
                            connections.delete(ws);
                        }
                    }
                    // Add to specific game lobby
                    this.lobbyConnections.get(gameType)!.add(ws);
                    console.log(`Client joined ${gameType} lobby`);
                }
                return;
            }

            // Handle game-specific messages
            if (data.type.includes('gender_duel') || data.gameType === 'gender_duel') {
                const gameManager = this.gameManagers.get('gender_duel');
                if (gameManager) {
                    gameManager.handleMessage(ws, data);
                }
            } else if (data.type.includes('memory_translation') || data.gameType === 'memory_translation') {
                console.log("It's a memory translation message");
                const gameManager = this.gameManagers.get('memory_translation');
                if (gameManager) {
                    gameManager.handleMessage(ws, data);
                }
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
        // Remove from all lobby connections
        for (const [gameType, connections] of this.lobbyConnections) {
            connections.delete(ws);
        }

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
