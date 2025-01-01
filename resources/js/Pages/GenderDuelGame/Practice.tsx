import React, { useEffect, useState } from "react";
import { FaCrown, FaFire } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CircularTimer from "@/Components/Games/CircularTimer";
import { Noun } from "@/types";
import correctSound from '@/assets/audio/correct.mp3';
import incorrectSound from '@/assets/audio/incorrect.mp3';

interface GenderDuelPracticeProps extends PageProps {
    auth: any;
    nouns: Noun[];
    difficulty: 'easy' | 'medium' | 'hard';
}

const leaveGame = () => {};

const handleExitClick = () => {
    // if (genderDuelGameState.status === 'in_progress') {
    //     setShowExitConfirmation(true);
    // } else {
    //     leaveGame();
    // }
};

const DIFFICULTY_TIMES = {
    easy: 5,
    medium: 3,
    hard: 1
};

const GENDER_COLORS = {
    der: 'bg-blue-500',
    die: 'bg-pink-500',
    das: 'bg-green-500'
};

const GenderDuelPractice: React.FC<GenderDuelPracticeProps> = ({ auth, nouns, difficulty = 'medium' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(DIFFICULTY_TIMES[difficulty]);
    const [shake, setShake] = useState(false);
    const [streak, setStreak] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        console.log("GenderDuelPractice nouns: ", nouns);

    }, []);

    useEffect(() => {
        if (isPaused) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setCurrentIndex((prevIndex) => (prevIndex + 1) % nouns.length);
                    setStreak(0);
                    return DIFFICULTY_TIMES[difficulty];
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [difficulty, isPaused]);

    const handleAnswer = (isCorrect: boolean) => {
        if (isPaused) return; // Prevent multiple clicks during feedback period
        
        if (isCorrect) {
            const audio = new Audio(correctSound);
            audio.play();
            setShowFeedback(true);
            setIsPaused(true);
            setScore((prev) => prev + 1);
            setStreak((prev) => prev + 1);
            setTimeout(() => {
                setShowFeedback(false);
                setIsPaused(false);
                setCurrentIndex((prev) => (prev + 1) % nouns.length);
                setTimeLeft(DIFFICULTY_TIMES[difficulty]);
            }, 1000);
        } else {
            const audio = new Audio(incorrectSound);
            audio.play();
            setStreak(0);
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center">
                    <button
                        onClick={handleExitClick}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition"
                    >    <MdClose size={24} />
                        </button>
                        <h2 className="ml-3 font-extrabold text-2xl text-indigo-700 dark:text-indigo-300">
                            Gender Duel
                        </h2>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                            {difficulty.toUpperCase()}
                        </span>
                    </div>
                </div>
            }
        >
            <Head title="Practice" />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-black">
                {/* Stats Bar */}
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg p-4">
                    <div className="max-w-6xl mx-auto flex justify-between items-center">
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-2">
                                <FaCrown className="text-yellow-500 w-6 h-6" />
                                <span className="text-lg font-bold dark:text-white">{score}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <FaFire className="text-orange-500 w-6 h-6" />
                                <span className="text-lg font-bold dark:text-white">×{streak}</span>
                            </div>
                        </div>
                        <CircularTimer timeLeft={timeLeft} totalTime={DIFFICULTY_TIMES[difficulty]} />
                    </div>
                </div>

                {/* Game Area */}
                <div className="flex flex-col items-center justify-center p-8 min-h-[calc(100vh-200px)]">
                {showFeedback && (
                        <div className={`absolute inset-0 ${GENDER_COLORS[nouns[currentIndex].gender]} opacity-20 transition-opacity duration-500`} />
                    )}
                        <div className="flex flex-col items-center mb-8">
                            <div className="text-4xl md:text-8xl font-bold mb-4 text-gray-800 dark:text-slate-200 flex items-center">
                                {nouns[currentIndex].word}
                            </div>
                            <div className="text-lg md:text-2xl text-gray-600 dark:text-gray-400">
                                {nouns[currentIndex].translation || 'N/A'}
                            </div>
                        </div>

                        <div className={`grid grid-cols-3 gap-6 ${shake ? 'animate-shake' : ''}`}>
                            <button
                                onClick={() => handleAnswer(nouns[currentIndex].gender === 'der')}
                                className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-2xl md:text-6xl font-bold py-8 px-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
                            >
                                Der
                            </button>
                            <button
                                onClick={() => handleAnswer(nouns[currentIndex].gender === 'die')}
                                className="bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white text-2xl md:text-6xl font-bold py-8 px-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
                            >
                                Die
                            </button>
                            <button
                                onClick={() => handleAnswer(nouns[currentIndex].gender === 'das')}
                                className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-2xl md:text-6xl font-bold py-8 px-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
                            >
                                Das
                            </button>
                        </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default GenderDuelPractice;
