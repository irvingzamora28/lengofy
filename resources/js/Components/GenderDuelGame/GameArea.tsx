import { AiOutlineCheckCircle, AiOutlineCloseCircle } from 'react-icons/ai';
import { FaTrophy, FaHourglassHalf, FaInfoCircle } from 'react-icons/fa';
import PrimaryButton from '@/Components/PrimaryButton';
import CircularTimer from '../Games/CircularTimer';
import { useEffect, useState } from 'react';
import correctSound from '@/assets/audio/correct.mp3';
import incorrectSound from '@/assets/audio/incorrect.mp3';
import { useTranslation } from 'react-i18next';
import { GenderDuelGamePlayer, Noun } from '@/types';

interface Answer {
    correct: boolean;
    user_id: number;
    player_name: string;
    answer: string;
}

interface GameAreaProps {
    status: 'waiting' | 'in_progress' | 'completed';
    currentWord?: Noun;
    currentRound?: number;
    totalRounds?: number;
    lastAnswer: Answer;
    feedbackMessage: string;
    onAnswer: (answer: string) => void;
    onReady: () => void;
    isCurrentPlayerReady: boolean;
    players: GenderDuelGamePlayer[];
    difficulty: 'easy' | 'medium' | 'hard';
    isHost: boolean;
    onRestart: () => void;
    userId: number;
}

const DIFFICULTY_TIMES = {
    easy: 5,
    medium: 3,
    hard: 1
};

const renderFeedback = (message: string) => {
    if (!message) return null;

    const [mainFeedback, stats] = message.split('\n\n');

    return (
        <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 shadow-md">
            <div className="flex items-center justify-center self-center gap-2 text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {mainFeedback}
            </div>

            {stats && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                    {stats.split('\n').map((line, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 p-2 rounded-md bg-white/50 dark:bg-gray-800/50 hover:shadow-sm transition-all"
                        >
                            <FaInfoCircle className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{line}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const GameArea = ({
    status,
    currentWord,
    currentRound = 0,
    totalRounds = 10,
    lastAnswer,
    feedbackMessage,
    onAnswer,
    onReady,
    isCurrentPlayerReady,
    players,
    difficulty,
    isHost,
    userId,
    onRestart
}: GameAreaProps) => {
    const [roundTimeRemaining, setRoundTimeRemaining] = useState<number>(DIFFICULTY_TIMES[difficulty]);
    const [isRoundTimedOut, setIsRoundTimedOut] = useState<boolean>(false);
    const [shake, setShake] = useState(false);
    const [transitionCountdown, setTransitionCountdown] = useState(3);
    const [transitionType, setTransitionType] = useState<'game_start' | 'next_word' | 'game_restart' | null>(null);
    const { t: trans } = useTranslation();

    const handleAnswer = (answer: string) => {
        const isCorrect = answer === currentWord?.gender;
        if (isCorrect) {
            const audio = new Audio(correctSound);
            audio.play();
            onAnswer(answer);
        } else {
            const audio = new Audio(incorrectSound);
            audio.play();
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }
    };

    const handleRestart = () => {
        onRestart();
    };

    useEffect(() => {
        if (status === 'in_progress' && !transitionType && !lastAnswer) {
            setTransitionCountdown(3);
            setTransitionType('game_start');
        }
    }, [status]);

    useEffect(() => {
        // Reset round time when a new word is received
        if (status === 'in_progress' && currentWord && !transitionType) {
            console.log(`Starting round ${currentRound} with word: ${currentWord.word}`);
            setRoundTimeRemaining(DIFFICULTY_TIMES[difficulty]);
            setIsRoundTimedOut(false);
        }
    }, [currentWord, status, difficulty, transitionType, currentRound]);

    useEffect(() => {
        if (status === 'in_progress' && lastAnswer) {
            console.log(`Round ${currentRound} ended with answer:`, lastAnswer);
            // Only start transition when we receive an answer
            setTransitionCountdown(3);
            setTransitionType('next_word');
            // Clear any existing round timer
            setRoundTimeRemaining(DIFFICULTY_TIMES[difficulty]);
            setIsRoundTimedOut(false);
        }
    }, [lastAnswer, difficulty, currentRound]);

    useEffect(() => {
        let transitionInterval: NodeJS.Timeout | undefined;

        if (transitionType && transitionCountdown > 0) {
            console.log(`Transition countdown: ${transitionCountdown}`);
            transitionInterval = setInterval(() => {
                setTransitionCountdown((prev) => {
                    if (prev <= 1) {
                        console.log('Transition complete');
                        setTransitionType(null);
                        return 3;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (transitionInterval) {
                clearInterval(transitionInterval);
            }
        };
    }, [transitionCountdown, transitionType]);

    useEffect(() => {
        let roundTimer: NodeJS.Timeout | null = null;

        if (status === 'in_progress' && currentWord && !transitionType && !lastAnswer && !isRoundTimedOut) {
            console.log(`Round timer: ${roundTimeRemaining}s remaining`);
            roundTimer = setInterval(() => {
                setRoundTimeRemaining((prevTime) => {
                    if (prevTime <= 1) {
                        console.log('Round timed out');
                        onAnswer('timeout');
                        setIsRoundTimedOut(true);
                        clearInterval(roundTimer!);
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        }

        return () => {
            if (roundTimer) {
                console.log('Clearing round timer');
                clearInterval(roundTimer);
            }
        };
    }, [status, currentWord, isRoundTimedOut, onAnswer, transitionType, lastAnswer, roundTimeRemaining]);

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-2xl p-4 shadow-2xl transition-all duration-300 h-full flex flex-col">
            {status === 'waiting' ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                    <FaHourglassHalf className="text-5xl text-indigo-500 dark:text-indigo-400 animate-pulse" />
                    <div className="text-xl text-gray-700 dark:text-gray-300 font-medium">
                        {trans('gender_duel.waiting_for_players')}
                    </div>
                    {!isCurrentPlayerReady && (
                        <PrimaryButton
                            onClick={onReady}
                            className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 px-6 py-3 text-lg font-bold rounded-full transition-all duration-300 transform hover:scale-105"
                        >
                            {trans('gender_duel.i_am_ready')}
                        </PrimaryButton>
                    )}
                </div>
            ) : transitionType ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                    {transitionType === 'next_word' && lastAnswer && (
                        <div className={`text-2xl font-bold ${
                            lastAnswer.correct ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                            {lastAnswer.correct ? (
                                <div className="flex items-center gap-2">
                                    <AiOutlineCheckCircle className="inline-block" />
                                    {lastAnswer.user_id === userId ? "You" : lastAnswer.player_name} got it right!
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <AiOutlineCloseCircle className="inline-block" />
                                    {lastAnswer.answer === 'timeout' ? 'Time\'s up!' : `${lastAnswer.user_id === userId ? "You" : lastAnswer.player_name} got it wrong!`}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="text-7xl font-bold text-indigo-600 dark:text-indigo-400 animate-pulse">
                        {transitionCountdown}
                    </div>
                    <div className="text-xl text-gray-700 dark:text-gray-300">
                        {transitionType === 'next_word' ? (++currentRound === totalRounds ? 'Game Over' : 'Next word in...') : 'Game starting in...'}
                    </div>
                </div>
            ) : status === 'in_progress' && currentWord ? (
                <div className={`flex-1 flex flex-col h-full text-center ${shake ? 'animate-shake' : ''}`}>
                    <CircularTimer timeLeft={roundTimeRemaining} totalTime={DIFFICULTY_TIMES[difficulty]} />

                    <div className="flex-1 flex flex-col">
                        <div className="flex-none mb-2 md:mb-8">
                            <h1 className="text-5xl md:text-7xl lg:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 transition-all duration-300">
                                {currentWord.word}
                            </h1>
                        </div>

                        <div className="flex-none mt-4">
                            <div className="flex flex-col sm:flex-row justify-center gap-6">
                                {['der', 'die', 'das'].map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        className="inline-flex items-center justify-center
                                        px-8 py-4 md:px-10 md:py-5
                                        text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-wider
                                        rounded-2xl shadow-lg
                                        bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 text-white
                                        hover:from-blue-600 hover:to-indigo-700 dark:hover:from-blue-500 dark:hover:to-indigo-600
                                        active:scale-95 transition-all duration-300 transform w-full sm:w-auto"
                                        onClick={() => handleAnswer(g)}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-none mt-2 md:mt-4">
                            {feedbackMessage && renderFeedback(feedbackMessage)}
                        </div>
                    </div>
                </div>
            ) : status === 'completed' ? (
                <div className="text-center space-y-8">
                    <FaTrophy className="text-6xl text-yellow-500 mx-auto animate-bounce" />
                    <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
                        {trans('gender_duel.game_over')}
                    </h3>
                    {feedbackMessage && renderFeedback(feedbackMessage)}
                    <div className="space-y-3 text-lg text-gray-700 dark:text-gray-200 max-w-md mx-auto">
                        {players
                            .sort((a, b) => b.score - a.score)
                            .map((player, index) => (
                                <div key={player.id} className="flex justify-between items-center border-b border-gray-300 dark:border-gray-600 pb-3 transition-all duration-300 hover:bg-white/30 dark:hover:bg-gray-700/30 rounded-lg px-4 py-2">
                                    <span className="font-bold flex items-center gap-2">
                                        {index + 1}. {index === 0 && <FaTrophy className="text-yellow-500" />} {player.player_name}
                                    </span>
                                    <span className="font-medium bg-indigo-100 dark:bg-indigo-800 px-3 py-1 rounded-full">
                                        {player.score} pts
                                    </span>
                                </div>
                            ))}
                    </div>
                    {isHost && <PrimaryButton onClick={handleRestart} className="mt-4">{trans('gender_duel.restart_game')}</PrimaryButton>}
                </div>
            ) : null}

            {transitionType && (transitionType === 'game_start' || transitionType === 'game_restart') && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded shadow">
                        <h2 className="text-4xl font-bold">{trans('gender_duel.starting_in')} {transitionCountdown}...</h2>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameArea;
