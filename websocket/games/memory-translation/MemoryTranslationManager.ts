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
            case 'restart_memory_translation_game':
                this.handleGameRestart(message as MemoryTranslationGameMessage);
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
                players: (message.data?.players || []).map(player => ({
                    ...player,
                    score: 0,
                    moves: 0
                })),
                language_name: message.data?.language_name || '',
                category: message.data?.category || '',
                hostId: message.userId || 0,
                max_players: message.data?.max_players || 2,
                winner: null,
                lastFlippedCards: []
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

            // Find the leaving player before removing them from state
            const leavingPlayer = state.players.find(p => p.user_id === userId);

            // Remove player from state
            state.players = state.players.filter(p => p.user_id !== userId);

            // Broadcast specific player left event
            if (leavingPlayer) {
                this.broadcast(room, {
                    type: 'memory_translation_player_left',
                    gameId,
                    data: {
                        user_id: userId,
                        player_name: leavingPlayer.player_name
                    }
                });
            }

            // If no players left or only one player in multiplayer game, end the game
            if (state.players.length === 0 ||
                (state.max_players > 1 && state.players.length === 1)) {
                this.handleGameEnd(gameId);
                // Broadcast game ended due to not enough players
                this.broadcast(room, {
                    type: 'memory_translation_game_ended',
                    gameId,
                    data: {
                        reason: 'not_enough_players'
                    }
                });
            } else {
                // If host left, assign new host
                if (state.hostId === userId) {
                    state.hostId = state.players[0].user_id!;
                    state.players[0].is_host = true;
                }
                this.setState(gameId, state);
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

            // If this is the second card flipped, we'll wait for the match check
            // Turn change will be handled in handlePairMatched if no match
            if (data?.isSecondCard) {
                // Increment number of moves for the player
                const playerIndex = state.players.findIndex(p => p.user_id === userId);
                if (playerIndex !== -1) {
                    state.players[playerIndex].moves = (state.players[playerIndex].moves || 0) + 1;
                }
                state.lastFlippedCards = data.cardIndices;
                this.setState(gameId, state);
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

        if (room && state && data?.matchedIndices && data?.isMatch !== undefined) {
            const { matchedIndices, isMatch } = data;

            // Broadcast the match result to all players
            this.broadcast(room, {
                type: 'memory_translation_pair_matched',
                gameId,
                userId,
                data: {
                    matchedIndices,
                    isMatch: isMatch
                }
            });

            // Update player score and handle turn change
            if (isMatch) {
                // Update score on match
                const playerIndex = state.players.findIndex(p => p.user_id === userId);
                if (playerIndex !== -1) {
                    state.players[playerIndex].score = (state.players[playerIndex].score || 0) + 1;
                }

                // Check if all pairs have been matched
                const totalPairs = state.words.length / 2;
                const totalMatchedPairs = state.players.reduce((sum, player) => sum + (player.score || 0), 0);

                if (totalMatchedPairs === totalPairs) {
                    // Find winner(s)
                    const maxScore = Math.max(...state.players.map(p => p.score || 0));
                    const winners = state.players.filter(p => p.score === maxScore);

                    // Set winner in state if there's only one winner
                    if (winners.length === 1) {
                        state.winner = winners[0];
                    }

                    // Set game status to completed
                    state.status = 'completed';
                    this.setState(gameId, state);
                    this.handleGameEnd(gameId);
                } else {
                    // Don't change turn on match - player continues
                    this.setState(gameId, state);
                    this.broadcastState(gameId);
                }
            } else {
                // Change turn if no match
                const currentPlayerIndex = state.players.findIndex(p => p.user_id === userId);
                const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
                state.current_turn = state.players[nextPlayerIndex].user_id!;
                this.setState(gameId, state);
                this.broadcastState(gameId);
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

    private handleGameRestart(message: MemoryTranslationGameMessage): void {
        const { gameId, data } = message;
        const state = this.getState(gameId);

        if (state) {
            // Reset game state but keep players
            const newState = {
                ...state,
                status: 'waiting' as const,
                current_turn: data?.hostId || state.hostId,
                winner: null,
                lastFlippedCards: [],
                selectedCards: [],
                matchedPairs: [],
                players: state.players.map(player => ({
                    ...player,
                    score: 0,
                    moves: 0,
                    time: 0,
                    is_ready: false
                }))
            };

            this.setState(gameId, newState);
            this.broadcastState(gameId);

            // Broadcast a specific reset message to ensure all clients reset their card states
            const room = this.getRoom(gameId);
            if (room) {
                this.broadcast(room, {
                    type: 'memory_translation_game_reset',
                    gameId,
                    data: {
                        words: newState.words
                    }
                });
            }
        }
    }
}
