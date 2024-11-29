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
                        gameRooms.get(data.gameId)?.add(ws);
                        console.log(`Player joined game ${data.gameId}`);

                        // Broadcast updated player list to all clients in the room
                        if (gameRoom) {
                            for (const client of gameRoom) {
                                client.send(JSON.stringify({
                                    type: 'game_state_updated',
                                    data: {
                                        players: data.data.players
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
                        if (gameRoom) {
                            const gameState = gameStates.get(data.gameId);
                            if (gameState) {
                                const currentWord = gameState.words[gameState.current_round - 1];
                                const isCorrect = data.data.answer === currentWord.gender;

                                // Broadcast answer result
                                for (const client of gameRoom) {
                                    client.send(JSON.stringify({
                                        type: 'answer_submitted',
                                        data: {
                                            userId: data.data.userId,
                                            answer: data.data.answer,
                                            isCorrect,
                                            translation: currentWord.translation
                                        }
                                    }));
                                }

                                // Move to next round if all players have answered
                                if (gameState.current_round < gameState.words.length) {
                                    gameState.current_round++;
                                    const nextWord = gameState.words[gameState.current_round - 1];

                                    // Broadcast next round
                                    for (const client of gameRoom) {
                                        client.send(JSON.stringify({
                                            type: 'next_round',
                                            data: {
                                                round: gameState.current_round,
                                                word: nextWord
                                            }
                                        }));
                                    }
                                } else {
                                    // Game is finished
                                    for (const client of gameRoom) {
                                        client.send(JSON.stringify({
                                            type: 'game_state_updated',
                                            data: {
                                                status: 'finished'
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
            // Remove the connection from all game rooms
            for (const [gameId, room] of gameRooms.entries()) {
                if (room.has(ws)) {
                    room.delete(ws);
                    if (room.size === 0) {
                        gameRooms.delete(gameId);
                    }
                    console.log(`Player left game ${gameId}`);
                }
            }
        }
    }
});

console.log('WebSocket server running on port 6001');
