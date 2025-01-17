import { ServerWebSocket } from "bun";
import { BaseGameManager } from "../../core/BaseGameManager";
import { BaseGameMessage } from "../../core/types";
import { MemoryTranslationGameMessage, MemoryTranslationGameState } from "./types";

export class MemoryTranslationManager extends BaseGameManager<MemoryTranslationGameState> {
    constructor(lobbyConnections: Set<ServerWebSocket>) {
        super('memory_translation', lobbyConnections);
    }

    handleMessage(ws: ServerWebSocket, message: BaseGameMessage): void {
        const { type, gameId, userId, data } = message;
        console.log('Received message:', type, 'for game:', gameId);

        switch (type) {
            case 'join_memory_translation_game':
            case 'player_joined':
                this.handleJoinGame(ws, message as MemoryTranslationGameMessage);
                break;
            case "memory_translation_game_created":
                this.handleGameCreated(message as MemoryTranslationGameMessage);
                break;
            case 'memory_translation_leave_game':
                this.handleLeaveGame(ws, gameId, userId!);
                break;
            case 'memory_translation_player_ready':
                this.handlePlayerReady(message as MemoryTranslationGameMessage);
                break;
            case 'memory_translation_flip_card':
                this.handleCardFlip(message as MemoryTranslationGameMessage);
                break;
            case 'memory_translation_pair_matched':
                this.handlePairMatched(message as MemoryTranslationGameMessage);
                break;
            case 'memory_translation_update_score':
                this.handleUpdateScore(message as MemoryTranslationGameMessage);
                break;
            case 'memory_translation_game_end':
                this.handleGameEnd(gameId);
                break;
            case 'update_player_time':
                this.handleUpdatePlayerTime(message as MemoryTranslationGameMessage);
                break;
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
                category: message.data?.category || '',
                hostId: message.userId || 0,
                max_players: message.data?.max_players || 2,
                winner: null
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

                // If this is a new game, update the words with the card pairs
                if (message.data?.words && state.words.length === 0) {
                    state.words = message.data.words;
                }

                this.setState(gameId, state);
                this.broadcastState(gameId);
            }
        }
    }

    private handleLeaveGame(ws: ServerWebSocket, gameId: string, userId: number): void {
        const room = this.getRoom(gameId);
        const state = this.getState(gameId);

        if (room && state) {
            room.delete(ws);

            // Remove player from state
            state.players = state.players.filter(p => p.user_id !== userId);

            // If no players left or only one player in multiplayer game, end the game
            if (state.players.length === 0 ||
                (state.max_players > 1 && state.players.length === 1)) {
                this.handleGameEnd(gameId);
            } else {
                // If host left, assign new host
                if (state.hostId === userId) {
                    state.hostId = state.players[0].user_id!;
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
            type: "memory_translation_player_ready",
            gameId: gameId,
            userId: message.userId,
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
        } else {
            this.setState(gameId, state);
            this.broadcastState(gameId);
        }
    }

    private handleCardFlip(message: MemoryTranslationGameMessage): void {
        const { gameId, userId, data } = message;
        const state = this.getState(gameId);
        const room = this.getRoom(gameId);

        if (state && room && state.status === 'in_progress' && state.current_turn === userId) {
            // Broadcast the card flip to all players
            this.broadcast(room, {
                type: 'memory_translation_card_flipped',
                gameId,
                userId,
                data: {
                    cardIndex: data?.cardIndex,
                    isSecondCard: data?.isSecondCard
                }
            });

            // If this is the second card flipped, move to next player's turn after a delay
            if (data?.isSecondCard) {
                setTimeout(() => {
                    const currentPlayerIndex = state.players.findIndex(p => p.user_id === userId);
                    const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
                    state.current_turn = state.players[nextPlayerIndex].user_id!;
                    this.setState(gameId, state);
                    this.broadcastState(gameId);
                }, 1500); // Wait for the cards to be visible before changing turns
            }
        }
    }

    private handleStart(gameId: string): void {
        const state = this.getState(gameId);
        if (state) {
            console.log('Starting game:', gameId);
            state.status = "in_progress";
            state.current_turn = state.players[0].user_id!;
            this.setState(gameId, state);
            this.broadcastState(gameId);
        }
    }

    private handlePairMatched(message: MemoryTranslationGameMessage): void {
        const { gameId, userId, data } = message;
        const room = this.getRoom(gameId);
        const state = this.getState(gameId);

        if (room && state && data?.matchedIndices) {
            // Broadcast the matched pair to all players
            this.broadcast(room, {
                type: 'memory_translation_pair_matched',
                gameId,
                userId,
                data: {
                    matchedIndices: data.matchedIndices
                }
            });

            // Update player score
            if (data.score !== undefined) {
                const playerIndex = state.players.findIndex(p => p.user_id === userId);
                if (playerIndex !== -1) {
                    state.players[playerIndex].score = data.score;
                    this.setState(gameId, state);
                    this.broadcastState(gameId);
                }
            }
        }
    }

    private handleUpdateScore(message: MemoryTranslationGameMessage): void {
        const gameId = message.gameId;
        const state = this.getState(gameId);
        if (state) {
            const player = state.players.find(p => p.user_id === message.userId);
            if (player) {
                player.score = message.data?.score || 0;
                player.moves = message.data?.moves || 0;
                player.time = message.data?.time || 0;
            }
            this.setState(gameId, state);
            this.broadcastState(gameId);
        }
    }

    private handleUpdatePlayerTime(message: MemoryTranslationGameMessage): void {
        const { gameId, userId, data } = message;
        const state = this.getState(gameId);

        if (state && data?.time !== undefined) {
            const playerIndex = state.players.findIndex(p => p.user_id === userId);
            if (playerIndex !== -1) {
                state.players[playerIndex].time = data.time;
                this.setState(gameId, state);
            }
        }
    }

    private handleGameEnd(gameId: string): void {
        const state = this.getState(gameId);
        if (state) {
            state.status = 'completed';
            this.broadcastState(gameId);

            // Clean up game resources after a delay
            setTimeout(() => {
                this.cleanupCompletely(gameId);
            }, 60000); // 1 minute delay
        }
    }
}
