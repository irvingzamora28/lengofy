import { serve } from 'bun';

interface GameRoom {
    players: Set<WebSocket>;
}

interface GameMessage {
    type: 'join_game' | 'submit_answer' | 'game_state_update' | 'player_ready' | 'start_game';
    gameId: string;
    userId?: string;
    data?: any;
}

interface GameState {
    status: string;
    players: Array<{
        id: number;
        is_ready: boolean;
        connectionId: number;
        score?: number;
        player_name?: string;
    }>;
    current_round: number;
    words: Array<{
        id: number;
        word: string;
        gender: string;
        translation: string;
    }>;
}

// Store active game rooms and their states
const gameRooms = new Map<string, Set<WebSocket>>();
const gameStates = new Map<string, GameState>();

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
                const data = JSON.parse(message) as GameMessage;
                const gameRoom = gameRooms.get(data.gameId);

                switch (data.type) {
                    case 'join_game':
                        if (!gameRooms.has(data.gameId)) {
                            gameRooms.set(data.gameId, new Set());
                            // Initialize game state
                            gameStates.set(data.gameId, {
                                status: 'waiting',
                                players: [],
                                current_round: 0,
                                words: data.data.words || [],
                            });
                        }

                        // Add connection ID to track this specific client
                        ws.id = data.userId;

                        gameRooms.get(data.gameId)?.add(ws);
                        console.log(`Player joined game ${data.gameId}`);

                        // Update game state with new player
                        const gameState = gameStates.get(data.gameId);
                        if (gameState) {
                            const players = data.data.players || [];
                            gameState.players = players.map(player => ({
                                ...player,
                                id: player.user_id // Map user_id to id for consistency
                            }));
                        }

                        // Broadcast updated player list to all clients in the room
                        if (gameRoom) {
                            for (const client of gameRoom) {
                                client.send(JSON.stringify({
                                    type: 'game_state_updated',
                                    data: {
                                        players: gameState?.players || []
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

                    case 'start_game':
                        console.log('Starting game:', data.gameId);

                        if (gameRoom) {
                            const gameState = gameStates.get(data.gameId);
                            if (gameState) {
                                gameState.status = 'in_progress';
                                gameState.current_round = 1;

                                console.log('Starting game:', data.gameId);
                                // Broadcast game start to all players with first word
                                for (const client of gameRoom) {
                                    client.send(JSON.stringify({
                                        type: 'game_state_updated',
                                        data: {
                                            status: 'in_progress',
                                            current_round: 1,
                                            current_word: gameState.words[0]
                                        }
                                    }));
                                }
                            }
                        }
                        break;

                    case 'submit_answer':
                        console.log('Answer submitted:', data);
                        const answerGameRoom = gameRooms.get(data.gameId);
                        const currentGameState = gameStates.get(data.gameId);
                        const currentWord = currentGameState?.words[currentGameState?.current_round || 0];

                        if (currentWord && currentGameState && answerGameRoom) {
                            const isCorrect = data.data.answer.toLowerCase() === currentWord.gender.toLowerCase();

                            // Update player score
                            const playerIndex = currentGameState.players.findIndex(
                                player => player.id === ws.id
                            );

                            if (playerIndex !== -1 && isCorrect) {
                                currentGameState.players[playerIndex].score =
                                    (currentGameState.players[playerIndex].score || 0) + 1;
                            }

                            // Broadcast answer result and updated scores
                            for (const client of answerGameRoom) {
                                const answeringPlayer = currentGameState.players.find(p => p.id === ws.id);
                                client.send(JSON.stringify({
                                    type: 'answer_submitted',
                                    data: {
                                        playerId: ws.id,
                                        player_name: answeringPlayer?.player_name || 'Unknown Player',
                                        word: currentWord.word,
                                        answer: data.data.answer,
                                        correct: isCorrect
                                    }
                                }));

                                // Send updated game state with new scores
                                client.send(JSON.stringify({
                                    type: 'game_state_updated',
                                    data: {
                                        players: currentGameState.players
                                    }
                                }));
                            }

                            // If answer was correct, move to next round
                            if (isCorrect) {
                                // Check if there are more rounds
                                if (currentGameState.current_round < currentGameState.words.length - 1) {
                                    // Move to next round
                                    currentGameState.current_round++;
                                    const nextWord = currentGameState.words[currentGameState.current_round];

                                    // Broadcast next round to all players
                                    for (const client of answerGameRoom) {
                                        client.send(JSON.stringify({
                                            type: 'next_round',
                                            data: {
                                                round: currentGameState.current_round,
                                                word: nextWord
                                            }
                                        }));
                                    }
                                } else {
                                    // Game is finished
                                    currentGameState.status = 'completed';

                                    // Sort players by score to determine winner
                                    const sortedPlayers = [...currentGameState.players]
                                        .sort((a, b) => (b.score || 0) - (a.score || 0));

                                    // Broadcast game completion to all players
                                    for (const client of answerGameRoom) {
                                        client.send(JSON.stringify({
                                            type: 'game_state_updated',
                                            data: {
                                                status: 'completed',
                                                players: sortedPlayers,
                                                winner: sortedPlayers[0]
                                            }
                                        }));
                                    }
                                }
                            }
                        }
                        break;

                    case 'game_state_update':
                        if (gameRoom) {
                            console.log('Broadcasting game state update:', data);
                            // Broadcast to all players in the game room
                            for (const client of gameRoom) {
                                client.send(JSON.stringify({
                                    type: 'game_state_updated',
                                    data: data.data
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
            for (const [gameId, clients] of gameRooms.entries()) {
                if (clients.has(ws)) {
                    clients.delete(ws);
                    console.log(`Player left game ${gameId}`);

                    // Get current game state
                    const gameState = gameStates.get(gameId);
                    if (gameState && gameState.players) {
                        // Remove the disconnected player
                        const updatedPlayers = gameState.players.filter(
                            player => player.id !== ws.id
                        );
                        gameState.players = updatedPlayers;

                        // Broadcast updated player list to remaining clients
                        for (const client of clients) {
                            client.send(JSON.stringify({
                                type: 'game_state_updated',
                                data: {
                                    players: updatedPlayers
                                }
                            }));
                        }
                    }

                    // If no players left, clean up the game room
                    if (clients.size === 0) {
                        gameRooms.delete(gameId);
                        gameStates.delete(gameId);
                        console.log(`Game ${gameId} cleaned up - no players remaining`);
                    }
                    break;
                }
            }
        }
    }
});

console.log('WebSocket server running on port 6001');