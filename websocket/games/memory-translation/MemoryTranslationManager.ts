import { ServerWebSocket } from "bun";
import { BaseGameManager } from "../../core/BaseGameManager";
import { BaseGameMessage } from "../../core/types";
import { MemoryTranslationGameMessage } from "./types";


export class MemoryTranslationManager extends BaseGameManager<MemoryTranslationGameState> {
    constructor(lobbyConnections: Set<ServerWebSocket>) {
        super('memory_translation', lobbyConnections);
    }

    handleMessage(ws: ServerWebSocket, message: BaseGameMessage): void {
        const { type, gameId, userId, data } = message;
        console.log('Received message:', type, 'for game:', gameId);

        switch (type) {
            case 'memory_translation_join_game':
                this.handleJoinGame(ws, gameId, userId!, data);
                break;
            case "memory_translation_game_created":
                this.handleGameCreated(message);
            case 'memory_translation_leave_game':
                this.handleLeaveGame(ws, gameId, userId!);
                break;
            case 'memory_translation_player_ready':
                this.handlePlayerReady(message);
                break;
            case 'memory_translation_update_score':
                this.handleUpdateScore(gameId, userId!, data.score, data.moves, data.time);
                break;
            case 'memory_translation_game_over':
                this.handleGameOver(gameId);
                break;
            default:
                console.log('Unknown message type:', type);
        }
    }

    private handleGameCreated(message: MemoryTranslationGameMessage): void {
        this.broadcastToLobby({
            type: 'memory_translation_game_created',
            game: message.game
        });
    }

    private handleJoinGame(ws: ServerWebSocket, message: MemoryTranslationGameMessage): void {
        const gameId = message.gameId;
        if (!this.rooms.has(gameId)) {
            console.log('Creating new game room:', gameId);
            this.rooms.set(gameId, new Set());
            this.setState(gameId, {
                id: gameId,
                status: "waiting",
                current_turn: 0,
                words: message.data?.words || [],
                players: message.data?.players || [],
                language_name: message.data?.language_name || '',
                total_rounds: message.data?.total_rounds || 10,
                category: message.data?.category || '',
                hostId: message.userId || '',
                current_word: null,
                last_answer: null,
                max_players: message.data?.max_players || 2
            });
        }

        const room = this.rooms.get(gameId);
        if (room && !room.has(ws)) {
            console.log('Adding player to room:', gameId);
            room.add(ws);

            const state = this.getState(gameId);
            if (state) {
                const playerExists = state.players.some(p => p.user_id === message.userId);
                if (!playerExists && message.data?.players) {
                    const newPlayer = message.data.players.find(p => p.user_id === message.userId);
                    if (newPlayer) {
                        state.players.push(newPlayer);
                    }
                }
                this.setState(gameId, state);
                this.broadcastState(gameId);
            }
        }
    }

    private handleLeaveGame(ws: ServerWebSocket, gameId: string, userId: string): void {
        const room = this.getRoom(gameId);
        const state = this.getState(gameId);

        if (room && state) {
            room.delete(ws);
            state.players = state.players.filter(p => p.user_id !== parseInt(userId));

            if (state.players.length === 0) {
                this.cleanupCompletely(gameId);
            } else {
                // If host left, assign new host
                if (state.hostId === userId) {
                    state.hostId = state.players[0].user_id!.toString();
                    state.players[0].is_host = true;
                }
                this.broadcastState(gameId);
            }
        }
    }

    private handlePlayerReady(message: MemoryTranslationGameMessage): void {
        const gameId = message.gameId;
        const state = this.getState(gameId);
        const room = this.getRoom(gameId);
        console.log("GameId: ", gameId);
        console.log("State: ", state);
        console.log("Room: ", room);
        if (!state || !room) return;

        console.log('Player ready:', message.data?.player_id, 'in game:', gameId);

        // First broadcast the player ready message to all clients
        this.broadcast(room, {
            type: "player_ready",
            data: message.data
        });

        // Then update the game state
        state.players = state.players.map(player => {
            if (player.id === message.data?.player_id || player.user_id === message.userId) {
                return { ...player, is_ready: true };
            }
            return player;
        });

        const allReady = state.max_players === 1 ||
            (state.players.length >= 2 && state.players.every(player => player.is_ready));

        if (allReady && state.status === 'waiting') {
            console.log('All players ready, starting game:', gameId);
            this.handleStart(gameId);
        }
    }

    private handleStart(gameId: string): void {
        const state = this.getState(gameId);
        if (state) {
            console.log('Starting game:', gameId);
            state.status = "in_progress";
            state.current_round = 0;
            state.current_word = state.words[0];
            this.setState(gameId, state);
            this.broadcastState(gameId);
        }
    }

    private handleUpdateScore(message: MemoryTranslationGameMessage): void {
        const gameId = message.gameId;
        const state = this.getState(gameId);
        if (state) {
            const player = state.players.find(p => p.user_id === message.userId);
            if (player) {
                player.score = message.data?.score;
                player.moves = message.data?.moves;
                player.time = message.data?.time;
            }
            this.broadcastState(gameId);
        }
    }

    private handleGameOver(gameId: string): void {
        const state = this.getState(gameId);
        if (state) {
            state.status = 'completed';
            this.broadcastState(gameId);

            // Clean up game resources after a delay
            setTimeout(() => {
                this.cleanupCompletely(gameId);
            }, 5000);
        }
    }
}
