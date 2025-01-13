import { serve } from "bun";
import { readFileSync } from "fs";
import { config } from "dotenv";
import {
    GenderDuelGame,
    GenderDuelGamePlayer,
    GenderDuelGameState,
} from "./resources/js/types";

// Load environment variables from .env file
config();

// Check if the environment is local
const isLocal = process.env.APP_ENV === 'local';
const url = process.env.APP_URL;

interface GenderDuelGameRoom {
    players: Set<WebSocket>;
}

interface GenderDuelGameMessage {
    type:
        | "join_gender_duel_game"
        | "start_gender_duel_game"
        | "submit_answer"
        | "gender_duel_game_state_update"
        | "player_ready"
        | "restart_gender_duel_game"
        | "join_lobby"
        | "gender-duel-game-created"
        | "gender-duel-game-ended"
        | "word_puzzle_game_created"
        | "word_puzzle_game_ended"
        | "memory_game_created"
        | "memory_game_ended"
        | "restart_word_puzzle_game"
        | "restart_memory_game";
    genderDuelGameId?: string;
    wordPuzzleGameId?: string;
    memoryGameId?: string;
    userId?: string;
    data?: any;
};

// Game types and their states
type GameType = 'gender_duel' | 'word_puzzle' | 'memory';

interface BaseGameState {
    id: string;
    status: 'waiting' | 'in_progress' | 'completed';
    players: any[];
    hostId: string;
}

interface GenderDuelGameState extends BaseGameState {
    current_round: number;
    current_word: any;
    words: any[];
    language_name: string;
    total_rounds: number;
    category: string;
    last_answer: any;
}

interface WordPuzzleGameState extends BaseGameState {
    current_puzzle: string;
    hints_remaining: number;
    time_remaining: number;
}

interface MemoryGameState extends BaseGameState {
    cards: any[];
    matched_pairs: number;
    current_turn: string;
}

// Game rooms and states for different game types
const gameRooms = new Map<GameType, Map<string, Set<WebSocket>>>();
const gameStates = new Map<GameType, Map<string, BaseGameState>>();
const gameTimeoutFlags = new Map<GameType, Map<string, Set<number>>>();
const lobbyConnections = new Set<WebSocket>();

// Initialize maps for each game type
function initializeGameType(gameType: GameType) {
    if (!gameRooms.has(gameType)) {
        gameRooms.set(gameType, new Map());
    }
    if (!gameStates.has(gameType)) {
        gameStates.set(gameType, new Map());
    }
    if (!gameTimeoutFlags.has(gameType)) {
        gameTimeoutFlags.set(gameType, new Map());
    }
}

// Initialize known game types
initializeGameType('gender_duel');
initializeGameType('word_puzzle');
initializeGameType('memory');

// Helper function to clean up game resources
function cleanupGame(gameType: GameType, gameId: string) {
    console.log(`Cleaning up ${gameType} game resources for`, gameId);
    const timeoutFlags = gameTimeoutFlags.get(gameType)?.get(gameId);
    if (timeoutFlags) {
        timeoutFlags.clear();
    }
}

function cleanupGameCompletely(gameType: GameType, gameId: string) {
    console.log(`Completely cleaning up ${gameType} game`, gameId);
    gameRooms.get(gameType)?.delete(gameId);
    gameStates.get(gameType)?.delete(gameId);
    gameTimeoutFlags.get(gameType)?.delete(gameId);
    broadcastToLobby({
        type: `${gameType}-game-ended`,
        gameId: gameId,
    });
}

// Helper function to get game room and state
function getGameRoom(gameType: GameType, gameId: string): Set<WebSocket> | undefined {
    return gameRooms.get(gameType)?.get(gameId);
}

function getGameState<T extends BaseGameState>(gameType: GameType, gameId: string): T | undefined {
    return gameStates.get(gameType)?.get(gameId) as T;
}

function setGameState<T extends BaseGameState>(gameType: GameType, gameId: string, state: T) {
    gameStates.get(gameType)?.set(gameId, state);
}

// Helper function to broadcast game state
function broadcastGameState(gameType: GameType, gameId: string, room: Set<WebSocket>) {
    const gameState = getGameState(gameType, gameId);
    if (gameState) {
        for (const client of room) {
            client.send(
                JSON.stringify({
                    type: `${gameType}_game_state_updated`,
                    data: gameState,
                })
            );
        }
    }
}

// Helper function to clean up player resources
function cleanupPlayer(ws: WebSocket) {
    // Remove from lobby
    lobbyConnections.delete(ws);

    // Find and remove the client from any game rooms they're in
    for (const [gameType, rooms] of gameRooms.entries()) {
        for (const [gameId, room] of rooms.entries()) {
            if (room.has(ws)) {
                room.delete(ws);
                console.log(`Removed client from ${gameType} game ${gameId}, ${room.size} players remaining`);

                // Only cleanup completely if all players have left
                if (room.size === 0) {
                    cleanupGameCompletely(gameType, gameId);
                } else {
                    // Update remaining players about the disconnection
                    const gameState = getGameState(gameType, gameId);
                    if (gameState) {
                        for (const client of room) {
                            client.send(
                                JSON.stringify({
                                    type: `${gameType}_game_state_updated`,
                                    data: gameState,
                                })
                            );
                        }
                    }
                }
            }
        }
    }
};

const serverConfig = {
    port: 6001,
    fetch(req, server) {
        // Upgrade WebSocket connections
        if (server.upgrade(req)) {
            return; // Return if upgrade was successful
        }
        return new Response("Upgrade failed", { status: 500 });
    },
    websocket: {
        open(ws: WebSocket) {
            console.log("Client connected");
        },
        message(ws: WebSocket, message: string) {
            try {
                const data = JSON.parse(message) as GenderDuelGameMessage;
                const gameType = data.type.split('_')[0] as GameType;
                const gameId = data.genderDuelGameId || data.wordPuzzleGameId || data.memoryGameId;

                switch (data.type) {
                    case "join_lobby":
                        // Add to lobby connections if not already there
                        if (!lobbyConnections.has(ws)) {
                            lobbyConnections.add(ws);
                            console.log(
                                "Client joined lobby. Total lobby connections:",
                                lobbyConnections.size
                            );
                        }
                        break;

                    case "gender-duel-game-created":
                        // Broadcast the new game to all lobby connections
                        broadcastToLobby({
                            type: "gender-duel-game-created",
                            game: data.game
                        });
                        break;
                    case "gender-duel-game-ended":
                        // Broadcast the new game to all lobby connections
                        broadcastToLobby({
                            type: "gender-duel-game-ended",
                            gameId: gameId
                        });
                        break;
                    case "word_puzzle_game_created":
                        // Broadcast the new game to all lobby connections
                        broadcastToLobby({
                            type: "word_puzzle_game_created",
                            game: data.game
                        });
                        break;
                    case "word_puzzle_game_ended":
                        // Broadcast the new game to all lobby connections
                        broadcastToLobby({
                            type: "word_puzzle_game_ended",
                            gameId: gameId
                        });
                        break;
                    case "memory_game_created":
                        // Broadcast the new game to all lobby connections
                        broadcastToLobby({
                            type: "memory_game_created",
                            game: data.game
                        });
                        break;
                    case "memory_game_ended":
                        // Broadcast the new game to all lobby connections
                        broadcastToLobby({
                            type: "memory_game_ended",
                            gameId: gameId
                        });
                        break;

                    case "join_gender_duel_game":
                        if (!gameRooms.get('gender_duel')?.has(gameId)) {
                            gameRooms.get('gender_duel')?.set(
                                gameId,
                                new Set()
                            );
                            // Initialize game state
                            setGameState('gender_duel', gameId, {
                                id: gameId,
                                status: "waiting",
                                players: [],
                                current_round: 0, // zero-based indexing for current_round
                                words: data.data.words || [],
                                hostId: data.userId, // Register the host
                                max_players: data.data.max_players,
                                winner: null,
                            } as GenderDuelGameState);
                        }

                        // Remove from lobby when joining a game
                        lobbyConnections.delete(ws);

                        // Add connection ID to track this specific client
                        ws.id = data.userId;

                        gameRooms.get('gender_duel')?.get(gameId)?.add(ws);

                        // Update game state with new player
                        const gameState = getGameState('gender_duel', gameId);
                        if (gameState) {
                            const players = data.data.players || [];
                            gameState.players = players.map(
                                (player: GenderDuelGamePlayer) => ({
                                    ...player,
                                    user_id: player.user_id || null,
                                    guest_id: player.guest_id || null,
                                    score: player.score || 0,
                                    is_ready: player.is_ready || false,
                                    is_host:
                                        player.user_id === gameState.hostId, // Set host flag
                                })
                            );

                        }

                        // Broadcast updated player list to all clients in the room
                        const gameRoom = getGameRoom('gender_duel', gameId);
                        if (gameRoom) {
                            for (const client of gameRoom) {
                                client.send(
                                    JSON.stringify({
                                        type: "gender_duel_game_state_updated",
                                        data: gameState,
                                    })
                                );
                            }
                        }
                        break;

                    case "join_word_puzzle_game":
                        if (!gameRooms.get('word_puzzle')?.has(gameId)) {
                            gameRooms.get('word_puzzle')?.set(
                                gameId,
                                new Set()
                            );
                            // Initialize game state
                            setGameState('word_puzzle', gameId, {
                                id: gameId,
                                status: "waiting",
                                players: [],
                                current_puzzle: data.data.current_puzzle,
                                hints_remaining: data.data.hints_remaining,
                                time_remaining: data.data.time_remaining,
                                hostId: data.userId, // Register the host
                            } as WordPuzzleGameState);
                        }

                        // Remove from lobby when joining a game
                        lobbyConnections.delete(ws);

                        // Add connection ID to track this specific client
                        ws.id = data.userId;

                        gameRooms.get('word_puzzle')?.get(gameId)?.add(ws);

                        // Update game state with new player
                        const gameState = getGameState('word_puzzle', gameId);
                        if (gameState) {
                            const players = data.data.players || [];
                            gameState.players = players.map(
                                (player: any) => ({
                                    ...player,
                                    user_id: player.user_id || null,
                                    guest_id: player.guest_id || null,
                                    score: player.score || 0,
                                    is_ready: player.is_ready || false,
                                    is_host:
                                        player.user_id === gameState.hostId, // Set host flag
                                })
                            );

                        }

                        // Broadcast updated player list to all clients in the room
                        const gameRoom = getGameRoom('word_puzzle', gameId);
                        if (gameRoom) {
                            for (const client of gameRoom) {
                                client.send(
                                    JSON.stringify({
                                        type: "word_puzzle_game_state_updated",
                                        data: gameState,
                                    })
                                );
                            }
                        }
                        break;

                    case "join_memory_game":
                        if (!gameRooms.get('memory')?.has(gameId)) {
                            gameRooms.get('memory')?.set(
                                gameId,
                                new Set()
                            );
                            // Initialize game state
                            setGameState('memory', gameId, {
                                id: gameId,
                                status: "waiting",
                                players: [],
                                cards: data.data.cards,
                                matched_pairs: data.data.matched_pairs,
                                current_turn: data.data.current_turn,
                                hostId: data.userId, // Register the host
                            } as MemoryGameState);
                        }

                        // Remove from lobby when joining a game
                        lobbyConnections.delete(ws);

                        // Add connection ID to track this specific client
                        ws.id = data.userId;

                        gameRooms.get('memory')?.get(gameId)?.add(ws);

                        // Update game state with new player
                        const gameState = getGameState('memory', gameId);
                        if (gameState) {
                            const players = data.data.players || [];
                            gameState.players = players.map(
                                (player: any) => ({
                                    ...player,
                                    user_id: player.user_id || null,
                                    guest_id: player.guest_id || null,
                                    score: player.score || 0,
                                    is_ready: player.is_ready || false,
                                    is_host:
                                        player.user_id === gameState.hostId, // Set host flag
                                })
                            );

                        }

                        // Broadcast updated player list to all clients in the room
                        const gameRoom = getGameRoom('memory', gameId);
                        if (gameRoom) {
                            for (const client of gameRoom) {
                                client.send(
                                    JSON.stringify({
                                        type: "memory_game_state_updated",
                                        data: gameState,
                                    })
                                );
                            }
                        }
                        break;

                    case "player_ready":
                        if (gameType === 'gender_duel') {
                            const gameRoom = getGameRoom('gender_duel', gameId);
                            if (gameRoom) {
                                // Broadcast to all players in the game room
                                for (const client of gameRoom) {
                                    client.send(
                                        JSON.stringify({
                                            type: "player_ready",
                                            data: data.data,
                                        })
                                    );
                                }
                            }
                        } else if (gameType === 'word_puzzle') {
                            const gameRoom = getGameRoom('word_puzzle', gameId);
                            if (gameRoom) {
                                // Broadcast to all players in the game room
                                for (const client of gameRoom) {
                                    client.send(
                                        JSON.stringify({
                                            type: "player_ready",
                                            data: data.data,
                                        })
                                    );
                                }
                            }
                        } else if (gameType === 'memory') {
                            const gameRoom = getGameRoom('memory', gameId);
                            if (gameRoom) {
                                // Broadcast to all players in the game room
                                for (const client of gameRoom) {
                                    client.send(
                                        JSON.stringify({
                                            type: "player_ready",
                                            data: data.data,
                                        })
                                    );
                                }
                            }
                        }
                        break;

                    case "start_gender_duel_game":
                        if (gameType === 'gender_duel') {
                            const gameRoom = getGameRoom('gender_duel', gameId);
                            if (gameRoom) {
                                const gameState = getGameState('gender_duel', gameId);
                                if (gameState) {
                                    gameState.status = "in_progress";
                                    gameState.current_round = 0; // Start from index 0 (zero-based)

                                    // Broadcast game start to all players with first word (round 0)
                                    for (const client of gameRoom) {
                                        client.send(
                                            JSON.stringify({
                                                type: "gender_duel_game_state_updated",
                                                data: {
                                                    ...gameState,
                                                    current_word:
                                                        gameState.words[
                                                            gameState.current_round
                                                        ],
                                                },
                                            })
                                        );
                                    }
                                }
                            }
                        }
                        break;

                    case "start_word_puzzle_game":
                        if (gameType === 'word_puzzle') {
                            const gameRoom = getGameRoom('word_puzzle', gameId);
                            if (gameRoom) {
                                const gameState = getGameState('word_puzzle', gameId);
                                if (gameState) {
                                    gameState.status = "in_progress";

                                    // Broadcast game start to all players
                                    for (const client of gameRoom) {
                                        client.send(
                                            JSON.stringify({
                                                type: "word_puzzle_game_state_updated",
                                                data: gameState,
                                            })
                                        );
                                    }
                                }
                            }
                        }
                        break;

                    case "start_memory_game":
                        if (gameType === 'memory') {
                            const gameRoom = getGameRoom('memory', gameId);
                            if (gameRoom) {
                                const gameState = getGameState('memory', gameId);
                                if (gameState) {
                                    gameState.status = "in_progress";

                                    // Broadcast game start to all players
                                    for (const client of gameRoom) {
                                        client.send(
                                            JSON.stringify({
                                                type: "memory_game_state_updated",
                                                data: gameState,
                                            })
                                        );
                                    }
                                }
                            }
                        }
                        break;

                    case "submit_answer":
                        if (gameType === 'gender_duel') {
                            console.log("Answer submitted:", data);
                            const answerGameRoom = getGameRoom('gender_duel', gameId);
                            const currentGameState = getGameState('gender_duel', gameId);

                            if (!currentGameState || !answerGameRoom) {
                                console.log("Game state or room not found");
                                return;
                            }

                            const currentWord =
                                currentGameState.words[
                                    currentGameState.current_round
                                ];
                            if (!currentWord) {
                                console.log(
                                    "Current word not found for round:",
                                    currentGameState.current_round
                                );
                                return;
                            }

                            // Check if this is a timeout or a regular answer
                            const isTimeout = data.data.answer === "timeout";
                            const isCorrect =
                                !isTimeout &&
                                data.data.answer.toLowerCase() ===
                                    currentWord.gender.toLowerCase();
                            console.log("Answer is correct:", isCorrect);

                            // Find the answering player
                            const answeringPlayer = currentGameState.players.find(
                                (p) => p.user_id === Number(data.data.userId)
                            );

                            if (!answeringPlayer) {
                                console.log("Player not found:", data.data.userId);
                                return;
                            }

                            // For timeouts, check if this round was already handled
                            if (isTimeout) {
                                if (!gameTimeoutFlags.get('gender_duel')?.has(gameId)) {
                                    gameTimeoutFlags.get('gender_duel')?.set(gameId, new Set());
                                }
                                const gameTimeouts = gameTimeoutFlags.get('gender_duel')?.get(gameId)!;

                                if (gameTimeouts.has(currentGameState.current_round)) {
                                    console.log("Timeout already handled for this round");
                                    return;
                                }

                                gameTimeouts.add(currentGameState.current_round);
                            }

                            // Update player score only if the answer is correct (not timeout)
                            if (isCorrect) {
                                answeringPlayer.score =
                                    (answeringPlayer.score || 0) + 1;
                            }

                            // First, send the answer result to all clients
                            for (const client of answerGameRoom) {
                                client.send(
                                    JSON.stringify({
                                        type: "answer_submitted",
                                        data: {
                                            playerId: answeringPlayer.id,
                                            userId: answeringPlayer.user_id,
                                            player_name:
                                                answeringPlayer.player_name,
                                            word: currentWord.word,
                                            answer: data.data.answer,
                                            correct: isCorrect,
                                        },
                                    })
                                );

                                // Send updated scores immediately
                                client.send(
                                    JSON.stringify({
                                        type: "gender_duel_game_state_updated",
                                        data: {
                                            players: currentGameState.players,
                                        },
                                    })
                                );
                            }

                            // Check if it's the last round
                            const isLastRound = currentGameState.current_round === currentGameState.words.length - 1;

                            // Create transition timer
                            if (!transitionTimers.has('gender_duel')) {
                                transitionTimers.set('gender_duel', new Map());
                            }
                            const gameTimers = transitionTimers.get('gender_duel')!;

                            // Clear any existing timer for this round
                            const existingTimer = gameTimers.get(currentGameState.current_round);
                            if (existingTimer) {
                                clearTimeout(existingTimer);
                            }

                            // Set new transition timer
                            const transitionTimer = setTimeout(() => {
                                if (isLastRound) {
                                    // End the game
                                    currentGameState.status = "completed";
                                    const winner = currentGameState.players.reduce((prev, current) =>
                                        (current.score || 0) > (prev.score || 0) ? current : prev
                                    );

                                    // Send final game state
                                    for (const client of answerGameRoom) {
                                        client.send(
                                            JSON.stringify({
                                                type: "gender_duel_game_state_updated",
                                                data: {
                                                    players: currentGameState.players,
                                                    status: "completed",
                                                    winner,
                                                    current_round: currentGameState.current_round,
                                                },
                                            })
                                        );
                                    }

                                    // Clean up game resources
                                    cleanupGame('gender_duel', gameId);
                                } else {
                                    // Move to next round
                                    const nextRound = currentGameState.current_round + 1;
                                    console.log(`Moving from round ${currentGameState.current_round} to ${nextRound}`);
                                    currentGameState.current_round = nextRound;

                                    // Clear the last answer state first
                                    for (const client of answerGameRoom) {
                                        client.send(
                                            JSON.stringify({
                                                type: "answer_submitted",
                                                data: null
                                            })
                                        );
                                    }

                                    // Then send the new round state
                                    for (const client of answerGameRoom) {
                                        client.send(
                                            JSON.stringify({
                                                type: "gender_duel_game_state_updated",
                                                data: {
                                                    players: currentGameState.players,
                                                    current_round: currentGameState.current_round,
                                                    current_word: currentGameState.words[currentGameState.current_round],
                                                    status: "in_progress"
                                                },
                                            })
                                        );
                                    }

                                    // Clear the timeout flag for the previous round
                                    if (isTimeout) {
                                        const gameTimeouts = gameTimeoutFlags.get('gender_duel')?.get(gameId);
                                        if (gameTimeouts) {
                                            gameTimeouts.delete(currentGameState.current_round - 1);
                                            if (gameTimeouts.size === 0) {
                                                gameTimeoutFlags.get('gender_duel')?.delete(gameId);
                                            }
                                        }
                                    }
                                }

                                // Clear the transition timer
                                gameTimers.delete(currentGameState.current_round);
                                if (gameTimers.size === 0) {
                                    transitionTimers.delete('gender_duel');
                                }
                            }, 3000);

                            // Store the transition timer
                            gameTimers.set(currentGameState.current_round, transitionTimer);
                        }
                        break;

                    case "gender_duel_game_state_update":
                        if (gameType === 'gender_duel') {
                            const gameRoom = getGameRoom('gender_duel', gameId);
                            if (gameRoom) {
                                console.log(
                                    "Broadcasting game state update:",
                                    data
                                );
                                const gameState = getGameState('gender_duel', gameId);
                                // Broadcast to all players in the game room
                                for (const client of gameRoom) {
                                    client.send(
                                        JSON.stringify({
                                            type: "gender_duel_game_state_updated",
                                            data: {
                                                ...data.data,
                                                players:
                                                    data.data.players ||
                                                    gameState?.players ||
                                                    [],
                                            },
                                        })
                                    );
                                }
                            }
                        }
                        break;

                    case "restart_gender_duel_game":
                        console.log("Received restart request", data);
                        const gameRoom = getGameRoom('gender_duel', gameId);
                        if (gameRoom) {
                            console.log("Found game room, cleaning up old game state");
                            // Only clean up game state, not the room
                            cleanupGame('gender_duel', gameId);

                            // Initialize new game state
                            const newGameState: GenderDuelGameState = {
                                id: gameId,
                                status: "waiting",
                                current_round: 0,
                                current_word: null,
                                words: data.data.words,
                                players: data.data.players.map((p: any) => ({ ...p, score: 0, is_ready: false })),
                                language_name: data.data.language_name,
                                total_rounds: data.data.total_rounds,
                                category: data.data.category,
                                hostId: data.data.hostId,
                                last_answer: null
                            };
                            setGameState('gender_duel', gameId, newGameState);
                            console.log("Created new game state", newGameState);

                            // Reset timeout flags for this game
                            if (gameTimeoutFlags.get('gender_duel')?.has(gameId)) {
                                gameTimeoutFlags.get('gender_duel')?.get(gameId)?.clear();
                            }

                            // Broadcast new game state to all clients
                            console.log("Broadcasting to clients", gameRoom.size);
                            for (const client of gameRoom) {
                                client.send(
                                    JSON.stringify({
                                        type: "gender_duel_game_state_updated",
                                        data: newGameState,
                                    })
                                );
                            }
                        } else {
                            console.log("Game room not found for restart", gameId);
                        }
                        break;

                    case "restart_word_puzzle_game":
                        const wordPuzzleRoom = getGameRoom('word_puzzle', gameId);
                        if (wordPuzzleRoom) {
                            cleanupGame('word_puzzle', gameId);

                            const newGameState: WordPuzzleGameState = {
                                id: gameId,
                                status: "waiting",
                                players: data.data.players.map((p: any) => ({ ...p, score: 0, is_ready: false })),
                                current_puzzle: data.data.current_puzzle,
                                hints_remaining: data.data.hints_remaining,
                                time_remaining: data.data.time_remaining,
                                hostId: data.data.hostId
                            };
                            setGameState('word_puzzle', gameId, newGameState);

                            for (const client of wordPuzzleRoom) {
                                client.send(
                                    JSON.stringify({
                                        type: "word_puzzle_game_state_updated",
                                        data: newGameState,
                                    })
                                );
                            }
                        }
                        break;

                    case "restart_memory_game":
                        const memoryRoom = getGameRoom('memory', gameId);
                        if (memoryRoom) {
                            cleanupGame('memory', gameId);

                            const newGameState: MemoryGameState = {
                                id: gameId,
                                status: "waiting",
                                players: data.data.players.map((p: any) => ({ ...p, score: 0, is_ready: false })),
                                cards: data.data.cards,
                                matched_pairs: 0,
                                current_turn: data.data.hostId,
                                hostId: data.data.hostId
                            };
                            setGameState('memory', gameId, newGameState);

                            for (const client of memoryRoom) {
                                client.send(
                                    JSON.stringify({
                                        type: "memory_game_state_updated",
                                        data: newGameState,
                                    })
                                );
                            }
                        }
                        break;
                }
            } catch (error) {
                console.error("Error processing message:", error);
            }
        },
        close(ws: WebSocket) {
            console.log("Client disconnected");
            cleanupPlayer(ws);
        },
    },
    ...(isLocal ? {} : {
        tls: {
            cert: readFileSync(
                `/etc/letsencrypt/live/${process.env.SERVER_NAME}/fullchain.pem`
            ),
            key: readFileSync(
                `/etc/letsencrypt/live/${process.env.SERVER_NAME}/privkey.pem`
            ),
        },
    }),
};

const server = serve(serverConfig);

// Helper function to broadcast to all lobby connections
function broadcastToLobby(data: any) {
    console.log("Broadcasting to lobby:", data);
    console.log("Number of lobby connections:", lobbyConnections.size);

    lobbyConnections.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

console.log(
    `WebSocket server running on ${
        serverConfig.tls ? "wss" : "ws"
    } on port ${serverConfig.port}`
);
