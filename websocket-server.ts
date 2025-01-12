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
        | "gender-duel-game-ended";
    genderDuelGameId: string;
    userId?: string;
    data?: any;
};

// Store active game rooms and their states
const genderDuelGameRooms = new Map<string, Set<WebSocket>>();
const genderDuelGameStates = new Map<string, GenderDuelGameState>();
const lobbyConnections = new Set<WebSocket>();

// Store timeout flags and transition timers for each game
const timeoutFlags = new Map<string, Set<number>>();
const transitionTimers = new Map<string, Map<number, NodeJS.Timeout>>();

// Helper function to clean up game resources
const cleanupGame = (gameId: string) => {
    console.log("Cleaning up game resources for", gameId);
    // Only remove timeouts and reset game state, don't remove the game room
    if (timeoutFlags.has(gameId)) {
        timeoutFlags.get(gameId)?.clear();
    }
}

const cleanupGameCompletely = (gameId: string) => {
    console.log("Completely cleaning up game", gameId);
    // Remove all game resources when all players have left
    genderDuelGameRooms.delete(gameId);
    genderDuelGameStates.delete(gameId);
    timeoutFlags.delete(gameId);
    broadcastToLobby({
        type: "gender-duel-game-ended",
        genderDuelGameId: gameId,
    });
}

// Helper function to clean up player resources
const cleanupPlayer = (ws: WebSocket) => {
    // Remove from lobby
    lobbyConnections.delete(ws);

    // Find and remove the client from any game rooms they're in
    for (const [gameId, room] of genderDuelGameRooms.entries()) {
        if (room.has(ws)) {
            room.delete(ws);
            console.log(`Removed client from game ${gameId}, ${room.size} players remaining`);

            // Only cleanup completely if all players have left
            if (room.size === 0) {
                cleanupGameCompletely(gameId);
            } else {
                // Update remaining players about the disconnection
                const gameState = genderDuelGameStates.get(gameId);
                if (gameState) {
                    for (const client of room) {
                        client.send(
                            JSON.stringify({
                                type: "gender_duel_game_state_updated",
                                data: gameState,
                            })
                        );
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
                const gameRoom = genderDuelGameRooms.get(data.genderDuelGameId);

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
                            genderDuelGameId: data.genderDuelGameId
                        });
                        break;

                    case "join_gender_duel_game":
                        if (!genderDuelGameRooms.has(data.genderDuelGameId)) {
                            genderDuelGameRooms.set(
                                data.genderDuelGameId,
                                new Set()
                            );
                            // Initialize game state
                            genderDuelGameStates.set(data.genderDuelGameId, {
                                status: "waiting",
                                players: [],
                                current_round: 0, // zero-based indexing for current_round
                                words: data.data.words || [],
                                hostId: data.userId, // Register the host
                                max_players: data.data.max_players,
                                winner: null,
                            });
                        }

                        // Remove from lobby when joining a game
                        lobbyConnections.delete(ws);

                        // Add connection ID to track this specific client
                        ws.id = data.userId;

                        genderDuelGameRooms.get(data.genderDuelGameId)?.add(ws);

                        // Update game state with new player
                        const gameState = genderDuelGameStates.get(
                            data.genderDuelGameId
                        );
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
                        if (gameRoom) {
                            for (const client of gameRoom) {
                                client.send(
                                    JSON.stringify({
                                        type: "gender_duel_game_state_updated",
                                        data: {
                                            players: gameState?.players || [],
                                            status: gameState?.status,
                                        },
                                    })
                                );
                            }
                        }
                        break;

                    case "player_ready":
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
                        break;

                    case "start_gender_duel_game":
                        if (gameRoom) {
                            const gameState = genderDuelGameStates.get(
                                data.genderDuelGameId
                            );
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
                        break;

                    case "restart_gender_duel_game":
                        console.log("Received restart request", data);
                        if (gameRoom) {
                            console.log("Found game room, cleaning up old game state");
                            // Only clean up game state, not the room
                            cleanupGame(data.genderDuelGameId);

                            // Initialize new game state
                            const newGameState: GenderDuelGameState = {
                                id: data.genderDuelGameId,
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
                            genderDuelGameStates.set(data.genderDuelGameId, newGameState);
                            console.log("Created new game state", newGameState);

                            // Reset timeout flags for this game
                            if (timeoutFlags.has(data.genderDuelGameId)) {
                                timeoutFlags.get(data.genderDuelGameId)?.clear();
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
                            console.log("Game room not found for restart", data.genderDuelGameId);
                        }
                        break;

                    case "submit_answer": {
                        console.log("Answer submitted:", data);
                        const answerGameRoom = genderDuelGameRooms.get(
                            data.genderDuelGameId
                        );
                        const currentGameState = genderDuelGameStates.get(
                            data.genderDuelGameId
                        );

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
                            if (!timeoutFlags.has(data.genderDuelGameId)) {
                                timeoutFlags.set(data.genderDuelGameId, new Set());
                            }
                            const gameTimeouts = timeoutFlags.get(data.genderDuelGameId)!;

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
                        if (!transitionTimers.has(data.genderDuelGameId)) {
                            transitionTimers.set(data.genderDuelGameId, new Map());
                        }
                        const gameTimers = transitionTimers.get(data.genderDuelGameId)!;

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
                                cleanupGame(data.genderDuelGameId);
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
                                    const gameTimeouts = timeoutFlags.get(data.genderDuelGameId);
                                    if (gameTimeouts) {
                                        gameTimeouts.delete(currentGameState.current_round - 1);
                                        if (gameTimeouts.size === 0) {
                                            timeoutFlags.delete(data.genderDuelGameId);
                                        }
                                    }
                                }
                            }

                            // Clear the transition timer
                            gameTimers.delete(currentGameState.current_round);
                            if (gameTimers.size === 0) {
                                transitionTimers.delete(data.genderDuelGameId);
                            }
                        }, 3000);

                        // Store the transition timer
                        gameTimers.set(currentGameState.current_round, transitionTimer);
                        break;
                    }

                    case "gender_duel_game_state_update":
                        if (gameRoom) {
                            console.log(
                                "Broadcasting game state update:",
                                data
                            );
                            const gameState = genderDuelGameStates.get(
                                data.genderDuelGameId
                            );
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
