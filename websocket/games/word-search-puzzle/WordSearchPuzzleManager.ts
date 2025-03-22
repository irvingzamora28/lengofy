import { ServerWebSocket } from "bun";
import { BaseGameManager } from "../../core/BaseGameManager";
import { BaseGameMessage } from "../../core/types";
import { WordSearchPuzzleGameMessage, WordSearchPuzzleGameState } from "./types";

export class WordSearchPuzzleManager extends BaseGameManager<WordSearchPuzzleGameState> {
    constructor(lobbyConnections: Set<ServerWebSocket>) {
        super('word_search_puzzle', lobbyConnections);
    }

    handleMessage(ws: ServerWebSocket, message: BaseGameMessage): void {
        const { type, gameId, userId, data } = message;
        console.log('Received message:', type, 'for game:', gameId);

        switch (type) {
            case 'join_word_search_puzzle_game':
            case 'player_joined':
                this.handleJoinGame(ws, message as WordSearchPuzzleGameMessage);
                break;
            case "word_search_puzzle_game_created":
                this.handleGameCreated(message as WordSearchPuzzleGameMessage);
                break;
            case 'word_search_puzzle_leave_game':
                this.handleLeaveGame(ws, gameId, userId!);
                break;
            case 'word_search_puzzle_player_ready':
                this.handlePlayerReady(message as WordSearchPuzzleGameMessage);
                break;
            case 'word_search_puzzle_game_end':
                this.handleGameEnd(gameId);
                break;
            case 'word_search_puzzle_word_found':
                this.handleWordFound(message as WordSearchPuzzleGameMessage);
                break;
        }
    }

    private handleStart(gameId: string): void {
        const state = this.getState(gameId);
        if (state) {
            console.log('Starting game:', gameId);
            state.status = "in_progress";
            state.round_start_time = Date.now();
            this.setState(gameId, state);
            this.broadcastState(gameId);
        }
    }

    private handleGameCreated(message: WordSearchPuzzleGameMessage): void {
        this.broadcastToLobby({
            type: 'word_search_puzzle_game_created',
            game: message.game
        });
    }

    private handleJoinGame(ws: ServerWebSocket, message: WordSearchPuzzleGameMessage): void {
        const gameId = message.gameId;
        if (!this.rooms.has(gameId)) {
            console.log('Creating new game room:', gameId);
            this.rooms.set(gameId, new Set());
            this.setState(gameId, {
                id: gameId,
                status: "waiting",
                players: (message.data?.players || []).map(player => ({
                    ...player,
                    player_name: player.player_name || player.name, // Ensure player_name is set
                    score: 0,
                    words_found: new Set()
                })),
                // Initialize words_found as an object instead of Map
                words_found: {},
                round_time: 180,
                round_start_time: null,
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
                        state.players.push({
                            ...newPlayer,
                            player_name: newPlayer.player_name || newPlayer.name, // Ensure player_name is set
                            score: 0,
                            words_found: new Set()
                        });
                    }
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
            state.players = state.players.filter(p => p.user_id !== userId);

            if (state.players.length === 0 ||
                (state.max_players > 1 && state.players.length === 1)) {
                this.handleGameEnd(gameId);
                this.broadcast(room, {
                    type: 'word_search_puzzle_game_ended',
                    gameId,
                    data: { reason: 'not_enough_players' }
                });
            } else {
                if (state.hostId === userId) {
                    state.hostId = state.players[0].user_id!;
                    state.players[0].is_host = true;
                }
                this.setState(gameId, state);
                this.broadcastState(gameId);
            }
        }
    }

    private handlePlayerReady(message: WordSearchPuzzleGameMessage): void {
        const gameId = message.gameId;
        const state = this.getState(gameId);
        const room = this.getRoom(gameId);

        if (!state || !room) return;

        console.log('Player ready:', message.data?.player_id, 'in game:', gameId);
        console.log('Received grid:', message.data?.grid); // Debug log

        // First broadcast the player ready message to all clients
        this.broadcast(room, {
            type: "word_search_puzzle_player_ready",
            gameId: gameId,
            userId: message.userId,
            data: message.data
        });

        // Update the game state with the grid from the first ready player
        if (message.data?.grid && (!state.grid || state.grid.length === 0)) {
            state.grid = message.data.grid;
            console.log('Setting initial grid:', state.grid); // Debug log
        }

        // Then update the game state
        state.players = state.players.map(player => {
            if (player.id === message.data?.player_id || player.user_id === message.userId) {
                return { ...player, is_ready: true };
            }
            return player;
        });

        this.setState(gameId, state);

        const allReady = state.max_players === 1 ||
            (state.players.length >= 2 && state.players.every(player => player.is_ready));

        if (allReady && state.status === 'waiting') {
            console.log('All players ready, starting game:', gameId);
            this.handleStart(gameId);
        } else {
            this.broadcastState(gameId);
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

    private handleWordFound(message: WordSearchPuzzleGameMessage): void {
        const { gameId, userId, data } = message;
        const state = this.getState(gameId);
        const room = this.getRoom(gameId);

        if (!state || !room) return;

        const { word, cells } = data;

        // Initialize words_found for the user if it doesn't exist
        if (!state.words_found[userId]) {
            state.words_found[userId] = new Set();
        }

        // Verify if word exists in the game's word list and hasn't been found yet
        if (state.words.includes(word) &&
            !Object.values(state.words_found).some(set => set.has(word))) {

            // Update player's found words
            state.words_found[userId].add(word);

            // Update player's score
            const player = state.players.find(p => p.user_id === userId);
            if (player) {
                player.score += 1;
            }

            // Broadcast the word found event
            this.broadcast(room, {
                type: 'word_search_puzzle_word_found',
                gameId,
                userId,
                data: { word, cells }
            });

            // Broadcast score update
            this.broadcast(room, {
                type: 'score_updated',
                gameId,
                data: { player }
            });

            // Check if game is complete (all words found)
            const totalWordsFound = Object.values(state.words_found)
                .reduce((total, set) => total + set.size, 0);

            if (totalWordsFound === state.words.length) {
                // Find winner(s)
                const highestScore = Math.max(...state.players.map(p => p.score));
                const winners = state.players.filter(p => p.score === highestScore);

                state.status = 'completed';
                state.winner = winners[0]; // In case of tie, first player wins

                this.broadcastState(gameId);
            } else {
                this.setState(gameId, state);
                this.broadcastState(gameId);
            }
        }
    }

    private broadcastState(gameId: string): void {
        const state = this.getState(gameId);
        const room = this.getRoom(gameId);

        if (state && room) {
            console.log('Broadcasting state with grid:', state.grid); // Debug log
            this.broadcast(room, {
                type: 'word_search_puzzle_game_state_updated',
                gameId,
                data: {
                    ...state,
                    grid: state.grid, // Explicitly include the grid
                }
            });
        }
    }
}
