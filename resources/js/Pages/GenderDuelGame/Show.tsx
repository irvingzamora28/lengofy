import { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { GenderDuelGame, GenderDuelGameState, PageProps } from '@/types';
import { MdClose } from 'react-icons/md';
import GameInfo from '@/Components/GenderDuelGame/GameInfo';
import GameArea from '@/Components/GenderDuelGame/GameArea';
import PlayersInfo from '@/Components/GenderDuelGame/PlayersInfo';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import ConfirmationExitModal from './ConfirmationExitModal';

interface Props extends PageProps {
    auth: any;
    gender_duel_game: GenderDuelGame;
    wsEndpoint: string;
    justCreated: boolean;
}

export default function Show({ auth, gender_duel_game, wsEndpoint, justCreated }: Props) {
    const [genderDuelGameState, setGenderDuelGameState] = useState(gender_duel_game);
    const [lastAnswer, setLastAnswer] = useState<any>(null);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [showExitConfirmation, setShowExitConfirmation] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const { t: trans } = useTranslation();

    // Determine the host player
    const hostId = genderDuelGameState.hostId;
    console.log("Show hostId:", hostId);

    useEffect(() => {
        const ws = new WebSocket(wsEndpoint);
        wsRef.current = ws;

        ws.onopen = () => {
            // Join the game room
            ws.send(JSON.stringify({
                type: 'join_gender_duel_game',
                genderDuelGameId: gender_duel_game.id,
                userId: auth.user.id,
                max_players: gender_duel_game.max_players,
                data: {
                    words: gender_duel_game.words,
                    players: gender_duel_game.players
                }
            }));

            // If this is a newly created game, broadcast it to the lobby
            if (justCreated) {
                ws.send(JSON.stringify({
                    type: 'gender-duel-game-created',
                    genderDuelGameId: gender_duel_game.id,
                    game: {
                        id: gender_duel_game.id,
                        players: gender_duel_game.players,
                        max_players: gender_duel_game.max_players,
                        language_name: gender_duel_game.language_name,
                        source_language: {
                            id: gender_duel_game.source_language?.id,
                            code: gender_duel_game.source_language?.code,
                            name: gender_duel_game.source_language?.name,
                            flag: gender_duel_game.source_language?.flag,
                        },
                        target_language: {
                            id: gender_duel_game.target_language?.id,
                            code: gender_duel_game.target_language?.code,
                            name: gender_duel_game.target_language?.name,
                            flag: gender_duel_game.target_language?.flag,
                        },
                    }
                }));
            }

            if (gender_duel_game.max_players === 1) {
                ws.send(JSON.stringify({
                    type: 'player_ready',
                    genderDuelGameId: genderDuelGameState.id,
                    data: {
                        player_id: currentPlayer?.id,
                        user_id: auth.user.id
                    }
                }));
            }
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
                        const allReady = newState.max_players === 1 || (newState.players.length >= 2 &&
                            newState.players.every(player => player.is_ready));

                        if (allReady && newState.status === 'waiting') {
                            console.log('All players are ready');

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
                    console.log("gender_duel_game_state_updated: ", data);
                    console.log("Game status: ", data.status);
                    console.log("Game status: ", data.data.status);

                    if (data.data.status === 'completed' && data.data.winner) {
                        setFeedbackMessage(`${data.data.winner.player_name} wins with ${data.data.winner.score} points!`);
                        handleGameCompletion(data.data);
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
                // Client will disconnect and will trigger "gender-duel-game-ended" if it was the last player
                ws.close();
            }
        };
    }, [gender_duel_game.id]);

    useEffect(() => {
        console.log("lastAnswer: ", lastAnswer);
        console.log("feedbackMessage: ", feedbackMessage);

    }, [lastAnswer, feedbackMessage]);

    // Function to handle game completion
    const handleGameCompletion = async (data: GenderDuelGameState) => {
        console.log("handleGameCompletion data: ", data);
        const currentPlayer = data.players.find(player => player.user_id === auth.user.id);
        if (!currentPlayer) return;

        // Calculate scores
        const currentScore = currentPlayer.score || 0;
        const isWinner = data.winner?.user_id === auth.user.id;

        // Get previous scores from localStorage or default to initial values
        const prevScores = JSON.parse(localStorage.getItem(`genderDuelScores_${auth.user.id}`) || '{"highestScore": 0, "totalPoints": 0, "winningStreak": 0}');

        const calculatedHighestScore = Math.max(currentScore, prevScores.highestScore);
        const calculatedTotalPoints = (prevScores.totalPoints || 0) + currentScore;
        const currentWinningStreak = isWinner ? (prevScores.winningStreak || 0) + 1 : 0;

        const scoreData = {
            user_id: auth.user.id,
            game_id: 1, // GenderDuel game ID
            highest_score: calculatedHighestScore,
            total_points: calculatedTotalPoints,
            winning_streak: currentWinningStreak,
        };

        try {
            const response = await axios.post('/scores/update', scoreData);
            console.log('Score updated successfully');

            // Save updated scores to localStorage
            localStorage.setItem(`genderDuelScores_${auth.user.id}`, JSON.stringify({
                highestScore: calculatedHighestScore,
                totalPoints: calculatedTotalPoints,
                winningStreak: currentWinningStreak,
            }));

            // Update feedback message with scores
            setFeedbackMessage(`${data.winner?.player_name} ${trans('gender_duel.wins_with')} ${data.winner?.score} ${trans('gender_duel.points')}!\n
                ${trans('gender_duel.highest_score')}: ${calculatedHighestScore}\n${trans('gender_duel.total_points')}: ${calculatedTotalPoints}\n${trans('gender_duel.winning_streak')}: ${currentWinningStreak}`);
        } catch (error) {
            console.error('Error updating score:', error);
        }
    };

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

    const onRestart = () => {
        if (genderDuelGameState.status === 'completed') {
            console.log("Send restart message to WebSocket server");

            // Send restart message to WebSocket server
            wsRef.current?.send(JSON.stringify({
                type: 'restart_gender_duel_game',
                genderDuelGameId: genderDuelGameState.id,
            }));
            setLastAnswer(null);
            setFeedbackMessage('');
            setShowExitConfirmation(false);
        }
    };

    useEffect(() => {
        console.log("Show: genderDuelGameState:", genderDuelGameState);
    }, [genderDuelGameState]);

    const currentPlayer = genderDuelGameState.players.find(player => player.user_id === auth.user.id);

    return (
        <>
            <AuthenticatedLayout
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
                            category={genderDuelGameState.category}
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
                            isHost={hostId === auth.user.id} // Pass host information
                            currentRound={genderDuelGameState.current_round} // zero-based
                            onRestart={onRestart}
                        />

                        <PlayersInfo
                            status={genderDuelGameState.status}
                            players={genderDuelGameState.players}
                            currentPlayerId={currentPlayer?.id}
                        />
                    </div>
                </div>
            </AuthenticatedLayout>

            {/* Confirmation Modal */}
            {showExitConfirmation && (
                <ConfirmationExitModal
                    title={trans('gender_duel.modal_exit.title')}
                    message={trans('gender_duel.modal_exit.message')}
                    onLeave={leaveGame}
                    onCancel={() => setShowExitConfirmation(false)}
                />
            )}
        </>
    );
}
