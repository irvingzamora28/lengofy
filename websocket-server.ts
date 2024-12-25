import { serve } from 'bun';
import { GenderDuelGame, GenderDuelGamePlayer, GenderDuelGameState } from './resources/js/types';

interface GenderDuelGameRoom {
    players: Set<WebSocket>;
}

interface GenderDuelGameMessage {
    type: 'join_gender_duel_game' | 'submit_answer' | 'gender_duel_game_state_update' | 'player_ready' | 'start_gender_duel_game' | 'restart_gender_duel_game';
    genderDuelGameId: string;
    userId?: string;
    data?: any;
}
// Store active game rooms and their states
const genderDuelGameRooms = new Map<string, Set<WebSocket>>();
const genderDuelGameStates = new Map<string, GenderDuelGameState>();

const server = serve({
    port: 6001,
    fetch(req, server) {
        // Upgrade the request to a WebSocket connection
        if (server.upgrade(req)) {
            return; // Return if upgrade was successful
        }
        return new Response('Upgrade failed', { status: 500 });
    },
    websocket: {
        open(ws: WebSocket) {
            console.log('Client connected');
        },
        message(ws: WebSocket, message: string) {
            try {
                const data = JSON.parse(message) as GenderDuelGameMessage;
                const gameRoom = genderDuelGameRooms.get(data.genderDuelGameId);
                console.log('websocket-server: Message received:', data);
                console.log('websocket-server: Game room:', gameRoom);

                switch (data.type) {
                    case 'join_gender_duel_game':
                        if (!genderDuelGameRooms.has(data.genderDuelGameId)) {
                            genderDuelGameRooms.set(data.genderDuelGameId, new Set());
                            // Initialize game state
                            genderDuelGameStates.set(data.genderDuelGameId, {
                                status: 'waiting',
                                players: [],
                                current_round: 0, // zero-based indexing for current_round
                                words: data.data.words || [],
                                hostId: data.userId, // Register the host
                                max_players: data.data.max_players,
                                winner: null
                            });
                        }

                        // Add connection ID to track this specific client
                        ws.id = data.userId;

                        genderDuelGameRooms.get(data.genderDuelGameId)?.add(ws);
                        console.log(`Player joined game ${data.genderDuelGameId}`);

                        // Update game state with new player
                        const gameState = genderDuelGameStates.get(data.genderDuelGameId);
                        if (gameState) {
                            const players = data.data.players || [];
                            gameState.players = players.map((player: GenderDuelGamePlayer) => ({
                                ...player,
                                user_id: player.user_id || null,
                                guest_id: player.guest_id || null,
                                score: player.score || 0,
                                is_ready: player.is_ready || false,
                                is_host: player.user_id === gameState.hostId // Set host flag
                            }));

                            console.log('Updated players:', gameState.players);
                        }

                        // Broadcast updated player list to all clients in the room
                        if (gameRoom) {
                            for (const client of gameRoom) {
                                console.log('Broadcasting updated player list and status');
                                client.send(JSON.stringify({
                                    type: 'gender_duel_game_state_updated',
                                    data: {
                                        players: gameState?.players || [],
                                        status: gameState?.status
                                    }
                                }));
                            }
                        }
                        break;

                    case 'player_ready':
                        console.log('websocket-server: Player ready update received:');
                        if (gameRoom) {
                            // Broadcast to all players in the game room
                            for (const client of gameRoom) {
                                client.send(JSON.stringify({
                                    type: 'player_ready',
                                    data: data.data
                                }));
                            }
                        }
                        break;

                    case 'start_gender_duel_game':
                        console.log('Starting game:', data.genderDuelGameId);

                        if (gameRoom) {
                            const gameState = genderDuelGameStates.get(data.genderDuelGameId);
                            if (gameState) {
                                gameState.status = 'in_progress';
                                gameState.current_round = 0; // Start from index 0 (zero-based)

                                console.log('Starting game:', data.genderDuelGameId);
                                console.log(gameState.words);

                                // Broadcast game start to all players with first word (round 0)
                                for (const client of gameRoom) {
                                    client.send(JSON.stringify({
                                        type: 'gender_duel_game_state_updated',
                                        data: {
                                            ...gameState,
                                            current_word: gameState.words[gameState.current_round]
                                        }
                                    }));
                                }
                            }
                        }
                        break;

                    case 'restart_gender_duel_game':
                        if (gameRoom) {
                            // Reset game state
                            const gameState = genderDuelGameStates.get(data.genderDuelGameId);
                            if (gameState) {
                                gameState.status = 'in_progress';
                                gameState.current_round = 0; // Reset to the first round (zero-based)
                                gameState.players.forEach(player => {
                                    player.score = 0;
                                });
                                // Notify all players in the game room about the updated game state
                                console.log('Restarting game:', data.genderDuelGameId);
                                console.log("Notifying all players in the game room about the updated game state");
                                console.log(gameRoom.size + " players in the game room");


                                gameRoom.forEach(client => {
                                    client.send(JSON.stringify({
                                        type: 'gender_duel_game_state_updated',
                                        genderDuelGameId: data.genderDuelGameId,
                                        // Append to data current_word
                                        data: {
                                            ...gameState,
                                            current_word: gameState.words[gameState.current_round]
                                        }
                                    }));
                                });
                            }
                        }
                        break;

                    case 'submit_answer':
                        console.log('Answer submitted:', data);
                        const answerGameRoom = genderDuelGameRooms.get(data.genderDuelGameId);
                        const currentGameState = genderDuelGameStates.get(data.genderDuelGameId);

                        if (!currentGameState || !answerGameRoom) {
                            console.log('Game state or room not found');
                            return;
                        }

                        const currentWord = currentGameState.words[currentGameState.current_round];
                        if (!currentWord) {
                            console.log('Current word not found for round:', currentGameState.current_round);
                            return;
                        }

                        console.log('Current word:', currentWord);
                        console.log('Submitted answer:', data.data.answer);
                        console.log('Expected gender:', currentWord.gender);

                        // Check if this is a timeout or a regular answer
                        const isTimeout = data.data.answer === 'timeout';
                        const isCorrect = !isTimeout && data.data.answer.toLowerCase() === currentWord.gender.toLowerCase();
                        console.log('Answer is correct:', isCorrect);

                        // Find the answering player
                        const answeringPlayer = currentGameState.players.find(
                            p => p.user_id === Number(data.data.userId)
                        );

                        if (!answeringPlayer) {
                            console.log('Player not found:', data.data.userId);
                            return;
                        }

                        // Update player score only if the answer is correct (not timeout)
                        if (isCorrect) {
                            answeringPlayer.score = (answeringPlayer.score || 0) + 1;
                        }

                        // Broadcast answer result and updated scores
                        for (const client of answerGameRoom) {
                            // Send answer_submitted event regardless of correctness
                            client.send(JSON.stringify({
                                type: 'answer_submitted',
                                data: {
                                    playerId: answeringPlayer.id,
                                    userId: answeringPlayer.user_id,
                                    player_name: answeringPlayer.player_name,
                                    word: currentWord.word,
                                    answer: data.data.answer,
                                    correct: isCorrect
                                }
                            }));

                            // Send updated game state with new scores
                            client.send(JSON.stringify({
                                type: 'gender_duel_game_state_updated',
                                data: {
                                    players: currentGameState.players
                                }
                            }));
                        }

                        // Move to next round only if the answer was correct or if it was a timeout
                        if (isCorrect || isTimeout) {
                            if (currentGameState.current_round < currentGameState.words.length - 1) {
                                currentGameState.current_round += 1; // Move to the next round (still zero-based)
                                const nextWord = currentGameState.words[currentGameState.current_round];
                                // Broadcast the next word
                                for (const client of answerGameRoom) {
                                    client.send(JSON.stringify({
                                        type: 'gender_duel_game_state_updated',
                                        data: {
                                            current_word: nextWord,
                                            current_round: currentGameState.current_round // zero-based
                                        }
                                    }));
                                }
                            } else {
                                console.log("Game is finished");

                                // Game is finished
                                currentGameState.status = 'completed';

                                // Sort players by score to determine winner
                                const sortedPlayers = [...currentGameState.players]
                                    .sort((a, b) => (b.score || 0) - (a.score || 0));

                                // Broadcast game completion to all players
                                for (const client of answerGameRoom) {
                                    client.send(JSON.stringify({
                                        type: 'gender_duel_game_state_updated',
                                        data: {
                                            status: 'completed',
                                            players: sortedPlayers,
                                            winner: sortedPlayers[0]
                                        }
                                    }));
                                }
                            }
                        }
                        break;

                    case 'gender_duel_game_state_update':
                        if (gameRoom) {
                            console.log('Broadcasting game state update:', data);
                            const gameState = genderDuelGameStates.get(data.genderDuelGameId);
                            // Broadcast to all players in the game room
                            for (const client of gameRoom) {
                                client.send(JSON.stringify({
                                    type: 'gender_duel_game_state_updated',
                                    data: {
                                        ...data.data,
                                        players: data.data.players || gameState?.players || []
                                    }
                                }));
                            }
                        }
                        break;
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        },
        close(ws: WebSocket) {
            // Handle client disconnection
            console.log('Client disconnected');

            // Find and remove client from their game room
            for (const [gameId, clients] of genderDuelGameRooms.entries()) {
                if (clients.has(ws)) {
                    clients.delete(ws);
                    console.log(`Player left game ${gameId}`);

                    // Get current game state
                    const gameState = genderDuelGameStates.get(gameId);
                    if (gameState && gameState.players) {
                        // Remove the disconnected player
                        const updatedPlayers = gameState.players.filter(
                            player => player.user_id !== Number(ws.id)
                        );
                        gameState.players = updatedPlayers;

                        // Broadcast updated player list to remaining clients
                        for (const client of clients) {
                            client.send(JSON.stringify({
                                type: 'gender_duel_game_state_updated',
                                data: {
                                    players: updatedPlayers
                                }
                            }));
                        }
                    }

                    // If no players left, clean up the game room
                    if (clients.size === 0) {
                        genderDuelGameRooms.delete(gameId);
                        genderDuelGameStates.delete(gameId);
                        console.log(`Game ${gameId} cleaned up - no players remaining`);
                    }
                    break;
                }
            }
        }
    }
});

console.log('WebSocket server running on port 6001');
