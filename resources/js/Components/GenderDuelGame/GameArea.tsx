import { AiOutlineCheckCircle, AiOutlineCloseCircle } from 'react-icons/ai';
import { FaTrophy, FaHourglassHalf } from 'react-icons/fa';
import PrimaryButton from '@/Components/PrimaryButton';
import { useEffect, useRef, useState } from 'react';
import correctSound from '@/assets/audio/correct.mp3';
import incorrectSound from '@/assets/audio/incorrect.mp3';
import { useTranslation } from 'react-i18next';

interface GameAreaProps {
    status: string;
    currentWord?: {
        word: string;
        gender: string;
    };
    currentRound?: number;
    totalRounds?: number;
    lastAnswer: any;
    feedbackMessage: string;
    onAnswer: (answer: string) => void;
    onReady: () => void;
    isCurrentPlayerReady: boolean;
    players: any[];
    difficulty: 'easy' | 'medium' | 'hard';
    isHost: boolean;
    onRestart: () => void;
}

const DIFFICULTY_TIMES = {
    easy: 5,
    medium: 3,
    hard: 1
};

const renderLastAnswer = (lastAnswer: any) => {
    if (!lastAnswer) return null;
    return (
        <div className={`mt-6 flex items-center justify-center gap-3 text-lg md:text-xl font-bold animate-fade-in ${
            lastAnswer.correct ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
        }`}>
            {lastAnswer.correct ? <AiOutlineCheckCircle size={28}/> : <AiOutlineCloseCircle size={28}/>}
            <strong>{lastAnswer.player_name}</strong> {lastAnswer.correct ? 'nailed it!' : 'missed this one'}
        </div>
    );
};

import { FaChartBar, FaInfoCircle } from 'react-icons/fa';

const renderFeedback = (message: string) => {
    if (!message) return null;

    const [mainFeedback, stats] = message.split('\n\n');

    return (
        <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 shadow-md">
            <div className="flex items-center self-center gap-2 text-lg font-bold text-indigo-600 dark:text-indigo-400">
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

const CircularTimer = ({ timeLeft, totalTime }: { timeLeft: number; totalTime: number }) => {
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const prevTimeLeft = useRef(timeLeft);
    const [shouldAnimate, setShouldAnimate] = useState(true);

    useEffect(() => {
      // If time has increased (reset), disable animation temporarily
      if (timeLeft > prevTimeLeft.current) {
        setShouldAnimate(false);
        // Re-enable animation after the next render
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setShouldAnimate(true);
          });
        });
      }
      prevTimeLeft.current = timeLeft;
    }, [timeLeft]);

    const strokeDashoffset = circumference * (1 - timeLeft / totalTime);

    return (
      <div className="self-end mb-4">
        <div className="relative w-14 h-14">
          <svg className="transform -rotate-90 w-14 h-14">
            <circle
              cx="28"
              cy="28"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="28"
              cy="28"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`text-indigo-600 dark:text-indigo-400 ${
                shouldAnimate ? 'transition-all duration-1000 ease-linear' : 'transition-none'
              }`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-gray-700 dark:text-gray-300">
            {timeLeft}
          </div>
        </div>
      </div>
    );
  };


const GameArea = ({
    status,
    currentWord,
    currentRound,
    totalRounds,
    lastAnswer,
    feedbackMessage,
    onAnswer,
    onReady,
    isCurrentPlayerReady,
    players,
    difficulty,
    isHost,
    onRestart
}: GameAreaProps) => {
    const [timeLeft, setTimeLeft] = useState<number>(DIFFICULTY_TIMES[difficulty]);
    const [timeoutProcessed, setTimeoutProcessed] = useState<boolean>(false);
    const [shake, setShake] = useState(false);
    const [showCountdown, setShowCountdown] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const { t: trans } = useTranslation();

    const handleAnswer = (answer: string) => {
        const isCorrect = answer === currentWord?.gender;
        if (isCorrect) {
            const audio = new Audio(correctSound);
            audio.play();
            onAnswer(answer); // Call onAnswer for correct answer
            setTimeLeft(DIFFICULTY_TIMES[difficulty]); // Reset timer only on correct answer
        } else {
            const audio = new Audio(incorrectSound);
            audio.play();
            setShake(true);
            setTimeout(() => setShake(false), 500); // Reset shake after 500ms
            // Timer remains unchanged for incorrect answers, allowing continuous gameplay
        }
    };

    const handleRestart = () => {
        setShowCountdown(true);
        setCountdown(3);
    };

    useEffect(() => {
        let countdownInterval: NodeJS.Timeout | undefined;

        if (showCountdown && countdown > 0) {
            countdownInterval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        setShowCountdown(false);
                        onRestart(); // Start the game immediately
                        console.log('Game restarted (GameArea) after countdown');
                        console.log("status:", status);
                        console.log("currentWord:", currentWord);


                        return 3; // Reset countdown
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (countdownInterval) {
                clearInterval(countdownInterval);
            }
        };
    }, [showCountdown, countdown, onRestart]);

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;

        if (status === 'in_progress' && currentWord && isHost) {
            // Reset timer when word changes or game restarts
            setTimeLeft(DIFFICULTY_TIMES[difficulty]);
            setTimeoutProcessed(false); // Reset the timeout processed flag

            timer = setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime <= 1) {
                        // Time's up - send an empty answer to indicate timeout
                        if (!timeoutProcessed) {
                            onAnswer('timeout');
                            setTimeoutProcessed(true); // Mark timeout as processed
                        }
                        return DIFFICULTY_TIMES[difficulty]; // Reset timer
                    }
                    return prevTime - 1;
                });
            }, 1000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [status, currentWord, difficulty, isHost, timeoutProcessed, onAnswer]);

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
            ) : status === 'in_progress' && currentWord ? (
                <div className={`flex-1 flex flex-col h-full text-center ${shake ? 'animate-shake' : ''}`}>
                    {/* Fixed height header */}
                    <CircularTimer timeLeft={timeLeft} totalTime={DIFFICULTY_TIMES[difficulty]} />

                    {/* Flexible space for word display */}
                    <div className="flex-1 flex flex-col">
                        {/* Word display with minimum height */}
                        <div className="flex-none mb-2 md:mb-8">
                            <h1 className="text-5xl md:text-7xl lg:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 transition-all duration-300">
                                {currentWord.word}
                            </h1>
                        </div>

                        {/* Fixed position buttons at bottom */}
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

                        {/* Fixed height space for feedback */}
                        <div className="flex-1 min-h-[100px] flex flex-col justify-center">
                            {renderLastAnswer(lastAnswer)}
                        </div>


                        {/* Feedback messages below buttons */}
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
                                    <span className="font-bold">
                                        {index + 1}. {player.player_name}
                                    </span>
                                    <span className="font-medium bg-indigo-100 dark:bg-indigo-800 px-3 py-1 rounded-full">
                                        {player.score} pts
                                    </span>
                                </div>
                            ))}
                    </div>
                    <PrimaryButton onClick={handleRestart} className="mt-4">{trans('gender_duel.restart_game')}</PrimaryButton>
                </div>
            ) : null}

            {showCountdown && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded shadow">
                        <h2 className="text-4xl font-bold">{trans('gender_duel.starting_in')} {countdown}...</h2>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameArea;
