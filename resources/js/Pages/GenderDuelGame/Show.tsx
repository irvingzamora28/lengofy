import { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { GenderDuelGame, PageProps } from '@/types';
import { MdClose } from 'react-icons/md';
import GameInfo from '@/Components/GenderDuelGame/GameInfo';
import GameArea from '@/Components/GenderDuelGame/GameArea';
import PlayersInfo from '@/Components/GenderDuelGame/PlayersInfo';

interface Props extends PageProps {
    auth: any;
    gender_duel_game: GenderDuelGame;
    wsEndpoint: string;
}

export default function Show({ auth, gender_duel_game, wsEndpoint }: Props) {
    const [genderDuelGameState, setGenderDuelGameState] = useState(gender_duel_game);
    const [lastAnswer, setLastAnswer] = useState<any>(null);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [showExitConfirmation, setShowExitConfirmation] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket(wsEndpoint);
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({
                type: 'join_gender_duel_game',
                genderDuelGameId: gender_duel_game.id,
                userId: auth.user.id,
                data: {
                    words: gender_duel_game.words,
                    players: gender_duel_game.players
                }
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'player_ready':
                    setGenderDuelGameState(prev => {
                        const newState = {
                            ...prev,
                            players: prev.players.map(player =>
                                player.id === data.data.player_id
                                    ? { ...player, is_ready: true }
                                    : player
                            )
                        };
                        const allReady = newState.players.length >= 2 &&
                            newState.players.every(player => player.is_ready);

                        if (allReady && newState.status === 'waiting') {
                            ws.send(JSON.stringify({
                                type: 'start_gender_duel_game',
                                genderDuelGameId: gender_duel_game.id,
                                userId: auth.user.id
                            }));
                        }
                        return newState;
                    });
                    break;

                case 'gender_duel_game_state_updated':
                    setGenderDuelGameState(prev => ({
                        ...prev,
                        ...data.data,
                        players: data.data.players || prev.players
                    }));

                    if (data.data.status === 'completed' && data.data.winner) {
                        setFeedbackMessage(`🎉 Game Over! ${data.data.winner.player_name} wins with ${data.data.winner.score} points!`);
                    }

                    if (data.data.players && data.data.players.length === 0) {
                        router.visit('/games/gender-duel');
                        return;
                    }
                    break;

                case 'answer_submitted':
                    const { player_name, correct } = data.data;
                    setLastAnswer({
                        player_name,
                        correct
                    });
                    break;

                case 'score_updated':
                    setGenderDuelGameState(prev => ({
                        ...prev,
                        players: prev.players.map(p =>
                            p.id === data.data.player.id
                                ? { ...p, score: data.data.player.score }
                                : p
                        )
                    }));
                    break;

                case 'next_round':
                    setGenderDuelGameState(prev => ({
                        ...prev,
                        current_round: data.data.round,
                        current_word: data.data.word
                    }));
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
    }, [gender_duel_game.id]);

    const submitAnswer = (gender: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'submit_answer',
                genderDuelGameId: genderDuelGameState.id,
                data: {
                    answer: gender,
                    userId: auth.user.id
                }
            }));
        }
    };

    const markReady = () => {
        router.post(route(`games.gender-duel.ready`, `${genderDuelGameState.id}`), {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                        type: 'player_ready',
                        genderDuelGameId: genderDuelGameState.id,
                        data: {
                            player_id: currentPlayer?.id,
                            user_id: auth.user.id
                        }
                    }));

                    setGenderDuelGameState(prev => ({
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
        router.delete(route(`games.gender-duel.leave`, `${genderDuelGameState.id}`));
    };

    const handleExitClick = () => {
        if (genderDuelGameState.status === 'in_progress') {
            setShowExitConfirmation(true);
        } else {
            leaveGame();
        }
    };

    const currentPlayer = genderDuelGameState.players.find(player => player.user_id === auth.user.id);

    return (
        <>
            <AuthenticatedLayout
                user={auth.user}
                header={
                    <div className="flex items-center">
                        <button
                            onClick={handleExitClick}
                            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition"
                        >
                            <MdClose size={24} />
                        </button>
                        <h2 className="ml-3 font-extrabold text-2xl text-indigo-700 dark:text-indigo-300 leading-tight">
                            Gender Duel
                        </h2>
                    </div>
                }
            >
                <Head title="Game Room" />

                <div className="py-6 bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-black dark:to-black">
                    <div className="max-w-7xl min-h-[26rem] md:h-[30rem] mx-auto px-4">
                        <GameInfo
                            languageName={genderDuelGameState.language_name}
                            currentRound={genderDuelGameState.current_round}
                            totalRounds={genderDuelGameState.total_rounds}
                            status={genderDuelGameState.status}
                        />

                        <GameArea
                            status={genderDuelGameState.status}
                            currentWord={genderDuelGameState.current_word}
                            lastAnswer={lastAnswer}
                            feedbackMessage={feedbackMessage}
                            onAnswer={submitAnswer}
                            onReady={markReady}
                            isCurrentPlayerReady={currentPlayer?.is_ready || false}
                            players={genderDuelGameState.players}
                            difficulty={auth.user.gender_duel_difficulty || 'medium'}
                        />

                        <PlayersInfo
                            players={genderDuelGameState.players}
                            currentPlayerId={currentPlayer?.id}
                        />
                    </div>
                </div>
            </AuthenticatedLayout>

            {/* Confirmation Modal */}
            {showExitConfirmation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                            Leave Game?
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            The game is still in progress. Are you sure you want to leave?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowExitConfirmation(false)}
                                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 rounded font-semibold text-gray-700 dark:text-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={leaveGame}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-semibold"
                            >
                                Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
