import { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { GenderDuelGame, GenderDuelGamePlayer, GenderDuelGameState, PageProps } from '@/types';
import { MdClose } from 'react-icons/md';
import GameInfo from '@/Components/GenderDuelGame/GameInfo';
import GameArea from '@/Components/GenderDuelGame/GameArea';
import PlayersInfo from '@/Components/GenderDuelGame/PlayersInfo';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import ConfirmationExitModal from '@/Components/Games/ConfirmationExitModal';
import toast from 'react-hot-toast';
import { IoPersonAddSharp } from 'react-icons/io5';
import { FaUserPlus } from 'react-icons/fa';

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

    useEffect(() => {
        const ws = new WebSocket(wsEndpoint);
        wsRef.current = ws;

        ws.onopen = () => {
            // Join the game room
            ws.send(JSON.stringify({
                type: 'join_gender_duel_game',
                gameId: gender_duel_game.id,
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
                    type: 'gender_duel_game_created',
                    gameId: gender_duel_game.id,
                    game: gender_duel_game
                }));
            }

            if (gender_duel_game.max_players === 1) {
                ws.send(JSON.stringify({
                    type: 'player_ready',
                    gameId: genderDuelGameState.id,
                    gameType: 'gender_duel',
                    userId: auth.user.id,
                    data: {
                        player_id: currentPlayer?.id,
                        user_id: auth.user.id
                    }
                }));
            }
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received game message:', data.type);

            switch (data.type) {
                case 'player_ready':
                    setGenderDuelGameState(prev => {
                        const newState = {
                            ...prev,
                            players: prev.players.map(player =>
                                player.id === data.data.player_id || player.user_id === data.data.user_id
                                    ? { ...player, is_ready: true }
                                    : player
                            )
                        };
                        return newState;
                    });
                    break;

                case 'gender_duel_game_state_updated':
                    console.log('Game state updated:', data.data);
                    setGenderDuelGameState(prev => {
                        // Ensure we don't skip rounds by validating the round transition
                        const nextRound = data.data.current_round;
                        if (typeof nextRound === 'number' && nextRound > prev.current_round + 1) {
                            console.error(`Attempted to skip from round ${prev.current_round} to ${nextRound}`);
                            return prev;
                        }

                        return {
                            ...prev,
                            ...data.data,
                            // Keep existing players if not provided in update
                            players: data.data.players || prev.players,
                            // Ensure round transitions are sequential
                            current_round: typeof nextRound === 'number' ? nextRound : prev.current_round
                        };
                    });

                    // If the game is about to start
                    if (data.data.status === 'in_progress' && data.data.current_round === 0) {
                        setLastAnswer(null);
                        setFeedbackMessage('');
                        setShowExitConfirmation(false);
                    }

                    if (data.data.status === 'completed') {
                        console.log('Game completed:', data.data);
                        handleGameCompletion(data.data);
                    }

                    if (data.data.players && data.data.players.length === 0) {
                        router.visit('/games/gender-duel');
                        return;
                    }
                    break;

                case 'answer_submitted':
                    const { player_name, correct, userId, answer } = data.data || {};

                    setLastAnswer(data.data ? {
                        user_id: userId,
                        player_name,
                        correct,
                        answer
                    } : null);
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

    }, [lastAnswer, feedbackMessage]);

    // Function to handle game completion
    const handleGameCompletion = async (data: GenderDuelGameState) => {
        const currentPlayer = data.players.find(player => player.user_id === auth.user.id);
        if (!currentPlayer) {
            console.error('Current player not found:', auth.user.id);
            return;
        }

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

            // Save updated scores to localStorage
            localStorage.setItem(`genderDuelScores_${auth.user.id}`, JSON.stringify({
                highestScore: calculatedHighestScore,
                totalPoints: calculatedTotalPoints,
                winningStreak: currentWinningStreak,
            }));

            // Update feedback message with scores
            const playersScore = data.players.reduce((acc: {[key: string]: number}, player: GenderDuelGamePlayer) => {
                acc[player.id.toString()] = player.score; // Ensure ID is a string
                return acc;
            }, {});

            const maxScore = Math.max(...Object.values(playersScore));
            const winners = Object.keys(playersScore).filter(playerId => playersScore[playerId] === maxScore);
            let message = '';
            if (winners.length === data.players.length) {
                message = `It's a tie!`;
            } else if (winners.length === 1) {
                const winnerId = winners[0];
                const winner = data.players.find(player => player.id.toString() === winnerId);

                if (winner) {
                    message = `${winner.player_name} wins with ${winner.score} points!`;
                } else {
                    console.error('Winner not found:', winnerId);
                    message = `Game completed, but winner not found with ID ${winnerId}`;
                }
            } else if (winners.length === 2) {
                const winnerNames = winners.map(id => {
                    const player = data.players.find(player => player.id.toString() === id);
                    return player ? player.player_name : 'Unknown';
                });
                message = `It's a tie between ${winnerNames.join(' and ')} with ${maxScore} points!`;
            } else {
                const winnerNames = winners.map(id => {
                    const player = data.players.find(player => player.id.toString() === id);
                    return player ? player.player_name : 'Unknown';
                });
                message = `Winners: ${winnerNames.join(', ')} with ${maxScore} points!`;
            }
            setFeedbackMessage(`${message}\n
            ${trans('gender_duel.highest_score')}: ${calculatedHighestScore}\n${trans('gender_duel.total_points')}: ${calculatedTotalPoints}\n${trans('gender_duel.winning_streak')}: ${currentWinningStreak}`);
        } catch (error) {
            console.error('Error updating score:', error);
        }
    };

    const submitAnswer = (gender: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'submit_answer',
                gameId: genderDuelGameState.id,
                gameType: 'gender_duel',
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
                        gameId: genderDuelGameState.id,
                        gameType: 'gender_duel',
                        userId: auth.user.id,
                        data: {
                            player_id: currentPlayer?.id,
                            user_id: auth.user.id
                        }
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
        console.log("Restart requested");
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log("WebSocket is open, sending restart message");
            wsRef.current.send(JSON.stringify({
                type: 'restart_gender_duel_game',
                gameId: genderDuelGameState.id,
                gameType: 'gender_duel',
                data: {
                    words: genderDuelGameState.words,
                    players: genderDuelGameState.players,
                    language_name: genderDuelGameState.language_name,
                    total_rounds: genderDuelGameState.total_rounds,
                    category: genderDuelGameState.category,
                    hostId: genderDuelGameState.hostId
                }
            }));
        } else {
            console.log("WebSocket is not open", wsRef.current?.readyState);
        }
    };

    useEffect(() => {
    }, [genderDuelGameState]);

    const currentPlayer = genderDuelGameState.players.find(player => player.user_id === auth.user.id);

    const handleShare = async () => {
        const url = new URL(window.location.href);
        const baseUrl = `${url.protocol}//${url.host}${url.pathname}`;
        const shareTitle = `Join my Gender Duel Game!`;
        const shareText = `Hey! Join me for a game of Gender Duel on Lengofy!`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: baseUrl,
                });
            } else {
                await navigator.clipboard.writeText(baseUrl);
                toast.success(trans('Game link copied to clipboard!'));
            }
        } catch (error) {
            console.error('Error sharing:', error);
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(baseUrl);
                toast.success(trans('Game link copied to clipboard!'));
            } catch (err) {
                toast.error(trans('Failed to share or copy link'));
            }
        }
    };

    return (
        <>
            <AuthenticatedLayout
                header={
                    <div className="flex justify-between items-center">
                        <h2 className="ml-3 font-extrabold text-2xl text-indigo-700 dark:text-indigo-300 leading-tight">
                        {trans('Gender Duel')}
                    </h2>
                    <div className="flex gap-2">
                        {genderDuelGameState.status === 'waiting' && (
                            <button
                                onClick={handleShare}
                                className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                            >
                                <IoPersonAddSharp className="mr-2 md:hidden" />
                                <FaUserPlus className="mr-2 hidden md:block" />
                                <span className="hidden md:inline">{trans('generals.invite_friends')}</span>
                                <span className="md:hidden">{trans('generals.invite')}</span>
                            </button>
                        )}
                        <button
                            onClick={() => setShowExitConfirmation(true)}
                            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition"
                        >
                            <MdClose size={24} />
                        </button>
                    </div>
                </div>
                }
            >
                <Head title={trans('gender_duel.game_room_title')} />

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
                            totalRounds={genderDuelGameState.total_rounds}
                            lastAnswer={lastAnswer}
                            feedbackMessage={feedbackMessage}
                            onAnswer={submitAnswer}
                            onReady={markReady}
                            isCurrentPlayerReady={currentPlayer?.is_ready || false}
                            players={genderDuelGameState.players}
                            difficulty={auth.user.gender_duel_difficulty || 'medium'}
                            isHost={auth.user.id === genderDuelGameState.hostId}
                            userId={auth.user.id}
                            currentRound={genderDuelGameState.current_round}
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
                    onLeave={leaveGame}
                    onCancel={() => setShowExitConfirmation(false)}
                />
            )}
        </>
    );
}
