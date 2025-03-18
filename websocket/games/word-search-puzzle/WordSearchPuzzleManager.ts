import { ServerWebSocket } from "bun";
import { BaseGameManager } from "../../core/BaseGameManager";
import { BaseGameMessage } from "../../core/types";
import { WordSearchPuzzleGameMessage, WordSearchPuzzleGameState } from "./types";

export class WordSearchPuzzleManager extends BaseGameManager<WordSearchPuzzleGameState> {
    constructor(lobbyConnections: Set<ServerWebSocket>) {
        super('word_search_puzzle', lobbyConnections);
    }

    handleMessage(ws: ServerWebSocket, message: BaseGameMessage): void {
        const { type, gameId, userId } = message;
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
        }
    }

    private handleStart(gameId: string): void {
        const state = this.getState(gameId);
        if (state) {
            console.log('Starting game:', gameId);
            state.status = "in_progress";
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
                    score: 0
                })),
                words_found: new Map(),
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
                        state.players.push(newPlayer);
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

        this.broadcast(room, {
            type: "word_search_puzzle_player_ready",
            gameId: gameId,
            userId: message.userId,
            data: message.data
        });

        state.players = state.players.map(player => {
            if (player.id === message.data?.player_id || player.user_id === message.userId) {
                return { ...player, is_ready: true };
            }
            return player;
        });

        const allReady = state.max_players === 1 ||
            (state.players.length >= 2 && state.players.every(player => player.is_ready));

        if (allReady && state.status === 'waiting') {
            this.handleStart(gameId);
        } else {
            this.setState(gameId, state);
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
}
