import { ServerWebSocket } from "bun";
import { BaseGameManager } from '../../core/BaseGameManager';
import { GenderDuelGameState, GenderDuelGameMessage } from './types';

export class GenderDuelManager extends BaseGameManager<GenderDuelGameState> {
    private transitionTimers: Map<string, Map<number, NodeJS.Timeout>>;
    private timeoutFlags: Map<string, Set<number>>;

    constructor(lobbyConnections: Set<ServerWebSocket>) {
        super('gender_duel', lobbyConnections);
        this.transitionTimers = new Map();
        this.timeoutFlags = new Map();
    }

    handleMessage(ws: ServerWebSocket, message: GenderDuelGameMessage): void {
        const gameId = message.genderDuelGameId || message.gameId;
        if (!gameId) {
            console.error('No gameId provided in message:', message);
            return;
        }

        console.log('Handling message:', message.type, 'for game:', gameId);

        switch (message.type) {
            case "join_gender_duel_game":
            case "player_joined":
                this.handleJoinGame(ws, message);
                break;
            case "gender_duel_game_created":
                this.handleGameCreated(message);
                break;
            case "submit_answer":
                this.handleAnswer(ws, message);
                break;
            case "player_ready":
                this.handlePlayerReady(message);
                break;
            case "restart_gender_duel_game":
                this.handleRestart(message);
                break;
            case "player_left":
                this.handlePlayerLeft(ws, message);
                break;
            default:
                console.log(`Unhandled gender duel message type: ${message.type}`);
        }
    }

    private handleGameCreated(message: GenderDuelGameMessage): void {
        this.broadcastToLobby({
            type: 'gender_duel_game_created',
            game: message.game
        });
    }

    private handleJoinGame(ws: ServerWebSocket, message: GenderDuelGameMessage): void {
        const gameId = message.genderDuelGameId || message.gameId;
        if (!this.rooms.has(gameId)) {
            console.log('Creating new game room:', gameId);
            this.rooms.set(gameId, new Set());
            this.setState(gameId, {
                id: gameId,
                status: "waiting",
                current_round: 0,
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

    private handlePlayerLeft(ws: ServerWebSocket, message: GenderDuelGameMessage): void {
        const gameId = message.genderDuelGameId || message.gameId;
        const room = this.getRoom(gameId);
        if (room) {
            room.delete(ws);

            const state = this.getState(gameId);
            if (state) {
                state.players = state.players.filter(p => p.user_id !== message.userId);
                this.setState(gameId, state);
            }

            this.clearTimers(gameId);

            if (room.size === 0) {
                this.cleanupCompletely(gameId);
            } else {
                this.broadcastState(gameId);
            }
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

    private handlePlayerReady(message: GenderDuelGameMessage): void {
        const gameId = message.genderDuelGameId || message.gameId;
        const state = this.getState(gameId);
        const room = this.getRoom(gameId);
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

    private handleAnswer(ws: ServerWebSocket, message: GenderDuelGameMessage): void {
        console.log("Answer submitted:", message);
        const gameId = message.genderDuelGameId || message.gameId;
        const room = this.getRoom(gameId);
        const state = this.getState(gameId);

        if (!state || !room) {
            console.log("Game state or room not found");
            return;
        }

        const currentWord = state.words[state.current_round];
        if (!currentWord) {
            console.log("Current word not found for round:", state.current_round);
            return;
        }

        // Check if this is a timeout or a regular answer
        const isTimeout = message.data?.answer === "timeout";
        const isCorrect = !isTimeout && message.data?.answer.toLowerCase() === currentWord.gender.toLowerCase();
        console.log("Answer is correct:", isCorrect);

        // Find the answering player
        const answeringPlayer = state.players.find(p => p.user_id === Number(message.data?.userId));
        if (!answeringPlayer) {
            console.log("Player not found:", message.data?.userId);
            return;
        }

        // For timeouts, check if this round was already handled
        if (isTimeout) {
            if (!this.timeoutFlags.has(gameId)) {
                this.timeoutFlags.set(gameId, new Set());
            }
            const gameTimeouts = this.timeoutFlags.get(gameId)!;

            if (gameTimeouts.has(state.current_round)) {
                console.log("Timeout already handled for this round");
                return;
            }

            gameTimeouts.add(state.current_round);
        }

        // Update player score only if the answer is correct (not timeout)
        if (isCorrect) {
            answeringPlayer.score = (answeringPlayer.score || 0) + 1;
        }

        // First, send the answer result to all clients
        this.broadcast(room, {
            type: "answer_submitted",
            data: {
                playerId: answeringPlayer.id,
                userId: answeringPlayer.user_id,
                player_name: answeringPlayer.player_name,
                word: currentWord.word,
                answer: message.data?.answer,
                correct: isCorrect,
            }
        });

        // Send updated scores immediately
        this.broadcast(room, {
            type: "gender_duel_game_state_updated",
            data: {
                players: state.players,
            }
        });

        // Check if it's the last round
        const isLastRound = state.current_round === state.words.length - 1;

        // Create transition timer
        if (!this.transitionTimers.has(gameId)) {
            this.transitionTimers.set(gameId, new Map());
        }
        const gameTimers = this.transitionTimers.get(gameId)!;

        // Clear any existing timer for this round
        const existingTimer = gameTimers.get(state.current_round);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // Set new transition timer
        const transitionTimer = setTimeout(() => {
            if (isLastRound) {
                // Send game state to frontend without determining winner
                this.broadcast(room, {
                    type: 'gender_duel_game_state_updated',
                    data: {
                        players: state.players,
                        status: "completed",
                        current_round: state.current_round,
                    }
                });

                // Clean up game resources
                this.cleanup(gameId);
            } else {
                // Move to next round
                const nextRound = state.current_round + 1;
                console.log(`Moving from round ${state.current_round} to ${nextRound}`);
                state.current_round = nextRound;

                // Clear the last answer state first
                this.broadcast(room, {
                    type: "answer_submitted",
                    data: null
                });

                // Then send the new round state
                this.broadcast(room, {
                    type: "gender_duel_game_state_updated",
                    data: {
                        players: state.players,
                        current_round: state.current_round,
                        current_word: state.words[state.current_round],
                        status: "in_progress"
                    }
                });

                // Clear the timeout flag for the previous round
                if (isTimeout) {
                    const gameTimeouts = this.timeoutFlags.get(gameId);
                    if (gameTimeouts) {
                        gameTimeouts.delete(state.current_round - 1);
                        if (gameTimeouts.size === 0) {
                            this.timeoutFlags.delete(gameId);
                        }
                    }
                }
            }

            // Clear the transition timer
            gameTimers.delete(state.current_round);
            if (gameTimers.size === 0) {
                this.transitionTimers.delete(gameId);
            }
        }, 3000);

        // Store the transition timer
        gameTimers.set(state.current_round, transitionTimer);
    }

    private handleRestart(message: GenderDuelGameMessage): void {
        const gameId = message.genderDuelGameId || message.gameId;
        const room = this.getRoom(gameId);
        if (!room) return;

        this.cleanup(gameId);

        const newState: GenderDuelGameState = {
            id: gameId,
            status: "waiting",
            current_round: 0,
            current_word: null,
            words: message.data?.words || [],
            players: (message.data?.players || []).map((p: any) => ({ ...p, score: 0, is_ready: false })),
            language_name: message.data?.language_name || '',
            total_rounds: message.data?.total_rounds || 10,
            category: message.data?.category || '',
            hostId: message.data?.hostId || message.userId || '',
            last_answer: null,
            max_players: message.data?.max_players || 2
        };
        this.setState(gameId, newState);
        this.broadcastState(gameId);
    }

    private clearTransitionTimers(gameId: string): void {
        const gameTimers = this.transitionTimers.get(gameId);
        if (gameTimers) {
            for (const timer of gameTimers.values()) {
                clearTimeout(timer);
            }
            this.transitionTimers.delete(gameId);
        }
    }

    private clearTimers(gameId: string): void {
        this.clearTransitionTimers(gameId);
    }

    cleanup(gameId: string): void {
        super.cleanup(gameId);
        this.clearTimers(gameId);
        if (this.timeoutFlags.has(gameId)) {
            this.timeoutFlags.get(gameId)?.clear();
        }
    }

    cleanupCompletely(gameId: string): void {
        this.clearTimers(gameId);
        this.timeoutFlags.delete(gameId);
        super.cleanupCompletely(gameId);
    }
}
