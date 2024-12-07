import { useEffect, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { GenderDuelGame, PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';

import { MdClose } from 'react-icons/md';
import { FaHourglassHalf, FaPlay, FaFlagCheckered } from 'react-icons/fa';
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from 'react-icons/ai';
import { FaUser, FaCheckCircle } from 'react-icons/fa';

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

    const renderLastAnswer = () => {
        if (!lastAnswer) return null;
        return (
            <div className={`mt-4 flex items-center justify-center gap-2 text-lg font-bold ${
                lastAnswer.correct ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'
            }`}>
                {lastAnswer.correct ? <AiOutlineCheckCircle size={24}/> : <AiOutlineCloseCircle size={24}/>}
                <strong>{lastAnswer.player_name}</strong> {lastAnswer.correct ? 'got it right!' : 'was incorrect'}
            </div>
        );
    };

    const gameStatusIcon = () => {
        switch(genderDuelGameState.status) {
            case 'waiting':
                return <FaHourglassHalf className="inline-block mr-1" />;
            case 'in_progress':
                return <FaPlay className="inline-block mr-1" />;
            case 'completed':
                return <FaFlagCheckered className="inline-block mr-1" />;
            default:
                return null;
        }
    };

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
                    <div className="max-w-7xl min-h-[26rem] md:h-[32rem] mx-auto px-4">
                        {/* Secondary Info (Top) */}
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">{genderDuelGameState.language_name}</span>
                                {genderDuelGameState.status === 'in_progress' && (
                                    <span className="text-xs opacity-75">
                                        Round {genderDuelGameState.current_round}/{genderDuelGameState.total_rounds}
                                    </span>
                                )}
                            </div>
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-white text-xs font-semibold
                                bg-gray-400 dark:bg-gray-700"
                            >
                                {gameStatusIcon()}
                                {genderDuelGameState.status.charAt(0).toUpperCase() + genderDuelGameState.status.slice(1).replace('_', ' ')}
                            </div>
                        </div>

                        {/* Ready Button if waiting */}
                        {genderDuelGameState.status === 'waiting' && !currentPlayer?.is_ready && (
                            <div className="text-center mb-6">
                                <PrimaryButton
                                    onClick={markReady}
                                    className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 px-4 py-2 text-sm font-semibold"
                                >
                                    Ready to Start
                                </PrimaryButton>
                            </div>
                        )}

                        {/* Main Game Area */}
                        <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-6 shadow-lg transition-colors h-full flex flex-col items-center justify-center">
                            {genderDuelGameState.status === 'waiting' ? (
                                <div className="text-center text-gray-600 dark:text-gray-300">
                                    Waiting for all players to be ready...
                                </div>
                            ) : genderDuelGameState.status === 'in_progress' && genderDuelGameState.current_word ? (
                                <div className="text-center w-full">
                                    {/* The main highlight: The word */}
                                    <h1 className="text-4xl md:text-6xl lg:text-9xl font-extrabold text-gray-900 dark:text-gray-100 mb-8 transition-all">
                                        {genderDuelGameState.current_word.word}
                                    </h1>

                                    {/* The primary action buttons - larger on desktop */}
                                    <div className="flex flex-col sm:flex-row justify-center gap-8 mb-4">
                                        {['der', 'die', 'das'].map((g) => (
                                            <button
                                                key={g}
                                                type="button"
                                                className="inline-flex items-center justify-center
                                                px-6 py-6 md:px-8 md:py-4

                                                text-2xl md:text-4xl lg:text-6xl font-bold uppercase tracking-wide
                                                rounded-lg shadow-lg
                                                bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600
                                                active:scale-95 transition transform w-full sm:w-auto"
                                                onClick={() => submitAnswer(g)}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                    {renderLastAnswer()}
                                    {feedbackMessage && (
                                        <div className="text-lg text-gray-700 dark:text-gray-200 mt-4 font-medium">
                                            {feedbackMessage}
                                        </div>
                                    )}
                                </div>
                            ) : genderDuelGameState.status === 'completed' ? (
                                <div className="text-center">
                                    <h3 className="text-2xl mb-4 font-extrabold text-purple-600 dark:text-purple-300">🎉 Game Over! 🎉</h3>
                                    {feedbackMessage && (
                                        <div className="text-lg text-gray-700 dark:text-gray-200 mb-6 font-medium">
                                            {feedbackMessage}
                                        </div>
                                    )}
                                    <div className="space-y-2 text-base text-gray-700 dark:text-gray-200">
                                        {genderDuelGameState.players
                                            .sort((a, b) => b.score - a.score)
                                            .map((player, index) => (
                                                <div key={player.id} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 pb-2">
                                                    <span className="font-medium">
                                                        {index + 1}. {player.player_name}
                                                    </span>
                                                    <span>{player.score} pts</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Players Info - Low Key */}
                        {genderDuelGameState.players.length > 0 && (
                            <div className="mt-6 text-sm text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-800/70 rounded-lg p-4">
                                <h3 className="text-gray-800 dark:text-gray-200 font-semibold flex items-center gap-2 mb-2 text-base">
                                    <FaUser /> Players
                                </h3>
                                <div className="space-y-2">
                                    {genderDuelGameState.players.map((player: any) => (
                                        <div
                                            key={player.id}
                                            className={`flex items-center justify-between rounded px-3 py-2
                                                ${player.is_ready ? 'bg-green-50 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'}`}
                                        >
                                            <span className={`
                                                ${currentPlayer?.id === player.id ? 'underline font-bold' : 'font-medium'}
                                                text-gray-800 dark:text-gray-100`
                                            }>
                                                {player.player_name}
                                            </span>
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
                                                <span>Score: {player.score}</span>
                                                {player.is_ready && (
                                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-300 font-semibold">
                                                        <FaCheckCircle/>
                                                        Ready
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
