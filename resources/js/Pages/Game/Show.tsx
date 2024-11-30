import { useEffect, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';

interface Props extends PageProps {
    auth: any;
    game: {
        id: number;
        status: string;
        players: Array<{
            id: number;
            user_id: number;
            player_name: string;
            score: number;
            is_ready: boolean;
            is_guest: boolean;
        }>;
        max_players: number;
        current_round: number;
        total_rounds: number;
        current_word: any;
        language_name: string;
        words: any;
    };
    wsEndpoint: string;
}

export default function Show({ auth, game, wsEndpoint }: Props) {
    const [gameState, setGameState] = useState(game);
    const [lastAnswer, setLastAnswer] = useState<any>(null);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        console.log(game);
        console.log(gameState);

    }, []);

    useEffect(() => {
        const ws = new WebSocket(wsEndpoint);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connected');
            ws.send(JSON.stringify({
                type: 'join_game',
                gameId: game.id,
                userId: auth.user.id,
                data: {
                    words: game.words,
                    players: game.players
                }
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);

            switch (data.type) {
                case 'player_ready':
                    console.log('Player ready update received:', data);
                    setGameState(prev => {
                        const newState = {
                            ...prev,
                            players: prev.players.map(player =>
                                player.id === data.data.player_id
                                    ? { ...player, is_ready: true }
                                    : player
                            )
                        };

                        // Check if all players are ready
                        const allReady = newState.players.length >= 2 &&
                            newState.players.every(player => player.is_ready);

                        if (allReady && newState.status === 'waiting') {
                            console.log('onMessage: All players are ready, starting game');
                            // Send game start request
                            ws.send(JSON.stringify({
                                type: 'start_game',
                                gameId: game.id,
                                userId: auth.user.id
                            }));
                        }

                        return newState;
                    });
                    break;

                case 'game_state_updated':
                    console.log('Game state update received:', data.data);
                    setGameState(prev => ({
                        ...prev,
                        ...data.data,
                        players: data.data.players || prev.players
                    }));

                    // If game is completed, show winner
                    if (data.data.status === 'completed' && data.data.winner) {
                        setFeedbackMessage(`Game Over! ${data.data.winner.player_name} wins with ${data.data.winner.score} points!`);
                    }

                    // If player list is empty, redirect to lobby
                    if (data.data.players && data.data.players.length === 0) {
                        router.visit('/game/lobby');
                        return;
                    }
                    break;

                case 'answer_submitted':
                    console.log('Answer submitted:', data.data);
                    const { playerId, player_name, word, answer, correct } = data.data;
                    setLastAnswer({
                        playerId,
                        player_name,
                        word,
                        answer,
                        correct
                    });
                    break;

                case 'score_updated':
                    console.log('Score updated:', data.data);
                    setGameState(prev => ({
                        ...prev,
                        players: prev.players.map(p =>
                            p.id === data.data.player.id
                                ? { ...p, score: data.data.player.score }
                                : p
                        )
                    }));
                    break;

                case 'next_round':
                    console.log('Next round:', data.data);
                    setGameState(prev => ({
                        ...prev,
                        current_round: data.data.round,
                        current_word: data.data.word
                    }));
                    // Clear previous answer and feedback
                    setLastAnswer(null);
                    setFeedbackMessage('');
                    break;
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [game.id]);

    const submitAnswer = (gender: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'submit_answer',
                gameId: gameState.id,
                data: {
                    answer: gender,
                    userId: auth.user.id
                }
            }));
        }
    };

    const markReady = () => {
        // First, update the database through HTTP
        router.post(`/games/${gameState.id}/ready`, {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                // Then, notify other players through WebSocket
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    console.log(`Player ${auth.user.id} is ready. Sending WebSocket message...`);

                    wsRef.current.send(JSON.stringify({
                        type: 'player_ready',
                        gameId: gameState.id,
                        data: {
                            player_id: currentPlayer?.id,
                            user_id: auth.user.id
                        }
                    }));

                    // Update local state immediately
                    setGameState(prev => ({
                        ...prev,
                        players: prev.players.map(player =>
                            player.id === currentPlayer?.id
                                ? { ...player, is_ready: true }
                                : player
                        )
                    }));
                }
            }
        });
    };

    const leaveGame = () => {
        router.delete(`/games/${gameState.id}/leave`);
    };

    const currentPlayer = gameState.players.find(player => player.user_id === auth.user.id);

    const renderLastAnswer = () => {
        if (!lastAnswer) return null;
        if (lastAnswer.error) return <div className="text-red-500">{lastAnswer.error}</div>;

        return (
            <div className={`text-lg ${lastAnswer.correct ? 'text-green-500' : 'text-red-500'}`}>
                <p><strong>{lastAnswer.player_name}</strong> answered {lastAnswer.correct ? 'correctly' : 'incorrectly'}!</p>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Game Room</h2>}
        >
            <Head title="Game Room" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">Game #{gameState.id}</h2>
                            <div className="flex items-center gap-4">
                            {gameState.status === 'waiting' && !currentPlayer?.is_ready && (
                                <PrimaryButton onClick={markReady}>
                                    Ready
                                </PrimaryButton>
                                )}
                                <button
                                    type="button"
                                    className="inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150"
                                    onClick={leaveGame}
                                >
                                    Leave Game
                                </button>
                            </div>
                        </div>

                        {/* Game Info */}
                        <div className="flex justify-between items-center mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <div className="flex items-center gap-6">
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Language:</span>
                                    <span className="ml-2 font-medium">{gameState.language_name}</span>
                                </div>
                                {gameState.status === 'in_progress' && (
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400">Round:</span>
                                        <span className="ml-2 font-medium">{gameState.current_round}/{gameState.total_rounds}</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                <span className={`ml-2 font-medium ${
                                    gameState.status === 'waiting' ? 'text-yellow-500' :
                                    gameState.status === 'in_progress' ? 'text-green-500' :
                                    'text-red-500'
                                }`}>
                                    {gameState.status.charAt(0).toUpperCase() + gameState.status.slice(1).replace('_', ' ')}
                                </span>
                            </div>
                        </div>

                        {/* Players List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-4">Players</h3>
                                <div className="space-y-2">
                                    {gameState.players.map((player: any) => (
                                        <div
                                            key={player.id}
                                            className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-600 rounded"
                                        >
                                            <span>{player.player_name}</span>
                                            <div>
                                                <span className="mr-4">Score: {player.score}</span>
                                                {player.is_ready && (
                                                    <span className="text-green-500">Ready</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Game Area */}
                        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                            {gameState.status === 'waiting' ? (
                                <div className="text-center">
                                    <p className="mb-4">
                                        Waiting for players...
                                        {gameState.players.length < gameState.max_players &&
                                            ` (${gameState.players.length}/${gameState.max_players})`}
                                    </p>
                                </div>
                            ) : gameState.status === 'in_progress' && gameState.current_word ? (
                                <div className="text-center">
                                    <h3 className="text-xl mb-2">Round {gameState.current_round} of {gameState.total_rounds}</h3>
                                    <h4 className="text-lg mb-4">{gameState.current_word.word}</h4>
                                    <div className="flex justify-center gap-4 mb-4">
                                        <button
                                            type="button"
                                            className="inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150"
                                            onClick={() => submitAnswer('der')}
                                        >
                                            der
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150"
                                            onClick={() => submitAnswer('die')}
                                        >
                                            die
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150"
                                            onClick={() => submitAnswer('das')}
                                        >
                                            das
                                        </button>
                                    </div>
                                    {renderLastAnswer()}
                                    {feedbackMessage && (
                                        <div className="text-lg text-gray-500">{feedbackMessage}</div>
                                    )}
                                </div>
                            ) : gameState.status === 'completed' ? (
                                <div className="text-center">
                                    <h3 className="text-xl mb-4">Game Over!</h3>
                                    <div className="space-y-2">
                                        {feedbackMessage && (
                                            <div className="text-lg text-gray-500">{feedbackMessage}</div>
                                        )}
                                        {gameState.players.sort((a, b) => b.score - a.score).map((player, index) => (
                                            <div key={player.id} className="flex justify-between items-center">
                                                <span>{index + 1}. {player.player_name}</span>
                                                <span>{player.score} points</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
