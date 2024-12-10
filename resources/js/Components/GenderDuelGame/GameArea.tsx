import { AiOutlineCheckCircle, AiOutlineCloseCircle } from 'react-icons/ai';
import { FaTrophy, FaHourglassHalf } from 'react-icons/fa';
import PrimaryButton from '@/Components/PrimaryButton';
import { useEffect, useState } from 'react';

interface GameAreaProps {
    status: string;
    currentWord?: {
        word: string;
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

export default function GameArea({
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
    isHost
}: GameAreaProps) {
    const [timeLeft, setTimeLeft] = useState<number>(DIFFICULTY_TIMES[difficulty]);
    const [timeoutProcessed, setTimeoutProcessed] = useState<boolean>(false);

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;
        console.log("isHost:", isHost);

        if (status === 'in_progress' && currentWord && isHost) {
            // Reset timer when word changes
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
                        return DIFFICULTY_TIMES[difficulty];
                    }
                    return prevTime - 1;
                });
            }, 1000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [status, currentWord, difficulty, isHost, timeoutProcessed]);

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-2xl p-4 shadow-2xl transition-all duration-300 h-full flex flex-col items-center justify-center">
            {status === 'waiting' ? (
                <div className="text-center space-y-6">
                    <FaHourglassHalf className="text-5xl text-indigo-500 dark:text-indigo-400 animate-pulse mx-auto" />
                    <div className="text-xl text-gray-700 dark:text-gray-300 font-medium">
                        Waiting for all players to be ready...
                    </div>
                    {!isCurrentPlayerReady && (
                        <PrimaryButton
                            onClick={onReady}
                            className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 px-6 py-3 text-lg font-bold rounded-full transition-all duration-300 transform hover:scale-105"
                        >
                            I'm Ready!
                        </PrimaryButton>
                    )}
                </div>
            ) : status === 'in_progress' && currentWord ? (
                <div className="text-center w-full space-y-8">
                    <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                        {/* Display round as one-based: currentRound is zero-based */}
                        Round {currentRound !== undefined ? currentRound + 1 : ''} - Time left: {timeLeft}s
                    </div>
                    <h1 className="text-5xl md:text-7xl lg:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 transition-all duration-300">
                        {currentWord.word}
                    </h1>

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
                                onClick={() => onAnswer(g)}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                    {renderLastAnswer(lastAnswer)}
                    {feedbackMessage && (
                        <div className="text-xl text-gray-700 dark:text-gray-200 mt-6 font-medium animate-fade-in">
                            {feedbackMessage}
                        </div>
                    )}
                </div>
            ) : status === 'completed' ? (
                <div className="text-center space-y-8">
                    <FaTrophy className="text-6xl text-yellow-500 mx-auto animate-bounce" />
                    <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
                        Game Over!
                    </h3>
                    {feedbackMessage && (
                        <div className="text-xl text-gray-700 dark:text-gray-200 font-medium">
                            {feedbackMessage}
                        </div>
                    )}
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
                </div>
            ) : null}
        </div>
    );
}
