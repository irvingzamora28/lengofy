import React, { useEffect, useRef, useState } from "react";
import { FaCrown, FaFire } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CircularTimer from "@/Components/Games/CircularTimer";
import { GenderDuelAnswer, Noun } from "@/types";
import correctSound from '@/assets/audio/correct.mp3';
import incorrectSound from '@/assets/audio/incorrect.mp3';
import { useTranslation } from 'react-i18next';
import ConfirmationExitModal from "./ConfirmationExitModal";
import WrongAnswersSummary from "./WrongAnswersSummary";
import axios from "axios";
import DifficultyModal from "@/Components/Games/DifficultyModal";
import { PageProps } from "@/types";

interface GenderDuelPracticeProps extends PageProps {
    auth: any;
    nouns: Noun[];
    difficulty: 'easy' | 'medium' | 'hard';
    category: number;
    targetLanguage: 'de' | 'es';
}

const DIFFICULTY_TIMES = {
    easy: 5,
    medium: 3,
    hard: 1
};

const GENDER_COLORS_MAP = {
    de: {
        der: 'bg-blue-500 dark:bg-blue-900',
        die: 'bg-pink-500 dark:bg-pink-900',
        das: 'bg-green-500 dark:bg-green-900',
    },
    es: {
        el: 'bg-blue-500 dark:bg-blue-900',
        la: 'bg-pink-500 dark:bg-pink-900',
    },
} as const;


const GenderDuelPractice: React.FC<GenderDuelPracticeProps> = ({ auth, nouns, category, difficulty = 'medium', targetLanguage = 'de' }) => {
    const GENDER_COLORS = GENDER_COLORS_MAP[targetLanguage];
    const [currentIndex, setCurrentIndex] = useState(0);
    const [words, setWords] = useState<Noun[]>(nouns);
    const [showExitConfirmation, setShowExitConfirmation] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(DIFFICULTY_TIMES[difficulty]);
    const [shake, setShake] = useState(false);
    const [streak, setStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [wrongAnswers, setWrongAnswers] = useState<GenderDuelAnswer[]>([]);
    const [countdown, setCountdown] = useState(3);
    const [showDifficultyModal, setShowDifficultyModal] = useState(false);
    const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>(difficulty);
    const [selectedCategory, setSelectedCategory] = useState<number>(category);
    const correctAudioRef = useRef<HTMLAudioElement | null>(null);
    const incorrectAudioRef = useRef<HTMLAudioElement | null>(null);
    const { t: trans } = useTranslation();

    useEffect(() => {
        // Initialize and preload the audio
        correctAudioRef.current = new Audio(correctSound);
        incorrectAudioRef.current = new Audio(incorrectSound);
        correctAudioRef.current.load();
        incorrectAudioRef.current.load();
    }, []);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);


    const leaveGame = () => {
        // Redirect to the lobby page using Inertia
        router.visit(route('games.gender-duel.lobby'));
    };

    const handleExitClick = () => {
        if (!isGameOver) {
            setShowExitConfirmation(true);
        } else {
            leaveGame();
        }
    };


    useEffect(() => {
        if (isGameOver) {
            updateAddScore();
        }
    }, [isGameOver]);

    useEffect(() => {
        if (isPaused || isGameOver || countdown > 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    if (currentIndex + 1 >= words.length) {
                        setIsGameOver(true);
                        return 0;
                    }
                    setCurrentIndex((prevIndex) => prevIndex + 1);
                    setStreak(0);
                    return DIFFICULTY_TIMES[difficulty];
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [difficulty, isPaused, isGameOver, countdown, currentIndex]);

    const handleAnswer = (answer: string) => {
        if (isPaused || countdown > 0) return; // Prevent multiple clicks during feedback period and countdown
        const isCorrect = answer === words[currentIndex].gender;

        if (isCorrect) {
            correctAudioRef.current?.play();
            setShowFeedback(true);
            setIsPaused(true);
            setScore((prev) => prev + 1);
            setStreak((prev) => {
                const newStreak = prev + 1;
                setLongestStreak((longest) => Math.max(longest, newStreak));
                return newStreak;
            });

            setTimeout(() => {
                setShowFeedback(false);
                setIsPaused(false);
                if (currentIndex + 1 >= words.length) {
                    setIsGameOver(true);
                } else {
                    setCurrentIndex((prev) => prev + 1);
                    setTimeLeft(DIFFICULTY_TIMES[difficulty]);
                }
            }, 1000);
        } else {
            if (incorrectAudioRef.current) {
                incorrectAudioRef.current.currentTime = 0; // Reset to the start allowing to play before the previous one ends
                incorrectAudioRef.current.play();
            }
            setStreak(0);
            setShake(true);
            setTimeout(() => setShake(false), 500);
            const isAlreadyWrong = wrongAnswers.some(answer => answer.word === words[currentIndex].word);
            if (!isAlreadyWrong) {
                setWrongAnswers(prev => [...prev, {
                    word: words[currentIndex].word,
                    translation: words[currentIndex].translation,
                    userAnswer: answer,
                    correctAnswer: words[currentIndex].gender,
                }]);
            }
        }
    };

    const fetchWords = async () => {
        // Logic to fetch new words from this route GET 'games.gender-duel.get-words' passing the difficulty and category
        try {
            const response = await axios.get(route('games.gender-duel.get-words'), {
                params: {
                    category: selectedCategory,
                },
            });
            setWords(response.data);
        } catch (error) {
            console.error('Error fetching words:', error);
        }

    }

    const updateAddScore = async () => {
        try {
            const response = await axios.post(route('scores.update-add-score'), {
                user_id: auth.user.id,
                game_id: 1,
                score: score,
                correct_streak: longestStreak,
            });
            console.log('Score updated successfully');
        } catch (error) {
            console.error('Error updating score:', error);
        }
    };

    const restartGame = (fetchNewWords: boolean = false) => {
        setCurrentIndex(0);
        setScore(0);
        setStreak(0);
        setLongestStreak(0);
        setTimeLeft(DIFFICULTY_TIMES[difficulty]);
        setIsGameOver(false);
        setCountdown(3);
        if (fetchNewWords) {
            fetchWords();
        }
    };

    if (countdown > 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-black">
                <div className="text-6xl font-bold text-indigo-700 dark:text-indigo-300">{countdown}</div>
            </div>
        );
    }

    if (isGameOver) {
        return (
            <AuthenticatedLayout
                header={
                    <div className="flex items-center">
                        <button
                            onClick={handleExitClick}
                            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition"
                        >
                            <MdClose size={24} />
                        </button>
                        <h2 className="ml-3 font-extrabold text-2xl text-indigo-700 dark:text-indigo-300">
                            Gender Duel - Results
                        </h2>
                    </div>
                }
            >
                <Head title="Game Over" />
                <div className="w-full mt-10 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-black">
                    <div className="w-11/12 md:w-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                            Game Over!
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                            Your Score: <span className="font-bold">{score}</span>
                        </p>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                            Longest Streak: <span className="font-bold">×{longestStreak}</span>
                        </p>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                            Final Streak: <span className="font-bold">×{streak}</span>
                        </p>
                        <div className="my-4 flex flex-col space-y-4">
                            <button
                                onClick={() => restartGame(false)}
                                className="bg-blue-500 dark:bg-blue-700 text-white py-2 px-4 self-center rounded-lg mb-2 sm:mb-0 w-full sm:w-1/2"
                            >
                                Play Again
                            </button>
                            <button
                                onClick={() => setShowDifficultyModal(true)}
                                className="bg-green-500 dark:bg-green-700 text-white py-2 px-4 self-center rounded-lg w-full sm:w-1/2"
                            >
                                Change difficulty
                            </button>
                        </div>
                        {wrongAnswers.length > 0 && (
                            <WrongAnswersSummary wrongAnswers={wrongAnswers} targetLanguage={targetLanguage} />
                        )}
                    </div>
                </div>
                {showDifficultyModal && (
                    <DifficultyModal
                        showDifficultyModal={showDifficultyModal}
                        setShowDifficultyModal={setShowDifficultyModal}
                        selectedDifficulty={selectedDifficulty}
                        setSelectedDifficulty={setSelectedDifficulty}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        easyText={trans('gender_duel.modal_difficulty.easy_text')}
                        mediumText={trans('gender_duel.modal_difficulty.medium_text')}
                        hardText={trans('gender_duel.modal_difficulty.hard_text')}
                        startGame={() => {
                            router.visit(route('games.gender-duel.practice', {
                                difficulty: selectedDifficulty,
                                category: selectedCategory
                            }));
                            setShowDifficultyModal(false);
                        }}
                        gameType="singlePlayer"
                        showCategories={true}
                    />
                )}
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center">
                        <h2 className="ml-3 font-extrabold text-2xl text-indigo-700 dark:text-indigo-300">
                            Gender Duel
                        </h2>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                            {difficulty.toUpperCase()}
                        </span>
                    </div>
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button
                            onClick={handleExitClick}
                            className="flex items-center justify-center p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200"
                            title={trans('gender_duel.exit_game')}
                        >
                            <MdClose className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
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
                <div className="flex flex-col items-center justify-center p-8 min-h-[calc(100vh-300px)]">
                    {showFeedback && (
                        <div
                            className={`absolute inset-0 ${
                                GENDER_COLORS[words[currentIndex].gender as keyof typeof GENDER_COLORS]
                            } opacity-20 transition-opacity duration-500`}
                        />
                    )}
                    <div className="flex flex-col items-center mb-8">
                        <div className="text-4xl md:text-8xl font-bold mb-4 text-gray-800 dark:text-slate-200 flex items-center">
                            {words[currentIndex].word}
                        </div>
                        <div className="text-lg md:text-2xl text-gray-600 dark:text-gray-400">
                            {words[currentIndex].translation || 'N/A'}
                        </div>
                    </div>

                    <div className={`grid grid-cols-3 gap-6 ${shake ? 'animate-shake' : ''}`}>
                        <button
                            aria-label="der"
                            onClick={() => handleAnswer('der')}
                            className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-2xl md:text-6xl font-bold py-8 px-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
                        >
                            Der
                        </button>
                        <button
                            aria-label="die"
                            onClick={() => handleAnswer('die')}
                            className="bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white text-2xl md:text-6xl font-bold py-8 px-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
                        >
                            Die
                        </button>
                        <button
                            aria-label="das"
                            onClick={() => handleAnswer('das')}
                            className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-2xl md:text-6xl font-bold py-8 px-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
                        >
                            Das
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showExitConfirmation && (
                <ConfirmationExitModal
                    title={trans('gender_duel.modal_exit.title')}
                    message={trans('gender_duel.modal_exit.message')}
                    onLeave={leaveGame}
                    onCancel={() => setShowExitConfirmation(false)}
                />
            )}
        </AuthenticatedLayout>
    );
};

export default GenderDuelPractice;
