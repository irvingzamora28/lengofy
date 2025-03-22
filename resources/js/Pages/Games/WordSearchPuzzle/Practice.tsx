import { useState, useEffect } from 'react';
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { FaClock, FaTrophy, FaEye, FaEyeSlash, FaStar } from 'react-icons/fa';
import { MdClose, MdGamepad } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import matchSound from "@/assets/audio/correct-match.mp3";
import LettersGrid from '@/Components/WordSearchPuzzle/LettersGrid';
import { useWordSearchPuzzle } from '@/Hooks/useWordSearchPuzzle';
import WordList from '@/Components/WordSearchPuzzle/WordList';

const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const playSound = (() => {
    const audio = new Audio(matchSound);
    return () => {
        audio.currentTime = 0;
        audio.play().catch(() => {
            // Ignore errors from browsers blocking autoplay
        });
    };
})();

interface WordSearchPuzzlePracticeProps {
    auth: {
        user: {
            language_pair_id: number;
        };
    };
    difficulty: 'easy' | 'medium' | 'hard';
    category: number;
    words: {
        id: number;
        word: string;
        translation: string;
    }[];
}

export default function WordSearchPuzzlePractice({ auth, difficulty, category, words: initialWords }: WordSearchPuzzlePracticeProps) {
    const { t: trans } = useTranslation();
    const gridSize = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 30;

    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isGameFinished, setIsGameFinished] = useState(false);

    const { grid, words, score, handleWordSelected } = useWordSearchPuzzle({
        initialWords,
        gridSize,
        onWordFound: playSound,
    });

    // Timer logic
    useEffect(() => {
        if (!isGameFinished) {
            const timer = setInterval(() => {
                setTimeElapsed((prev) => prev + 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isGameFinished]);

    // Check if game is finished
    useEffect(() => {
        if (score === words.length) {
            setIsGameFinished(true);
        }
    }, [score, words.length]);

    const getCellSizeClass = () => {
        switch (gridSize) {
            case 10: return 'h-10 w-10';
            case 15: return 'h-6 w-6 md:h-9 md:w-9';
            default: return 'h-6 w-6';
        }
    };

    const leaveGame = () => {
        router.visit(route("dashboard"));
    };

    const handleExitClick = () => {
        leaveGame();
    };

    return (
        <AuthenticatedLayout
            header={
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-center w-full"
                >
                    <div className="flex items-center">
                        <MdGamepad className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                        <h2 className="ml-3 font-extrabold text-2xl text-indigo-700 dark:text-indigo-300">
                            Word Search Puzzle Game
                        </h2>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="absolute top-4 right-4"
                    >
                        <button
                            onClick={handleExitClick}
                            className="flex items-center justify-center p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200 shadow-md"
                            title="Exit"
                        >
                            <MdClose className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                    </motion.div>
                </motion.div>
            }
        >
            <Head title="Word Search Puzzle Game" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg sm:rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                    >
                        {/* Game Stats Bar */}
                        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow-inner">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md"
                            >
                                <FaStar className="mr-2 text-yellow-300" />
                                <span className="font-bold">{trans('word_search_puzzle.game_info.score')}: {score}/{words.length}</span>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-md"
                            >
                                <FaClock className="mr-2 text-gray-100" />
                                <span className="font-bold">{trans('word_search_puzzle.game_info.time')}: {formatTime(timeElapsed)}</span>
                            </motion.div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Puzzle Grid Container */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="lg:w-2/3 w-full"
                            >
                                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md mb-4">
                                    <div className="w-full overflow-auto max-h-[60vh] md:max-h-[80vh] p-2">
                                        <LettersGrid
                                            grid={grid}
                                            gridSize={gridSize}
                                            getCellSizeClass={getCellSizeClass}
                                            onWordSelected={handleWordSelected}
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Word Lists */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="lg:w-1/3 w-full"
                            >
                                <WordList words={words} />
                            </motion.div>
                        </div>

                        {/* Completion Message */}
                        <AnimatePresence>
                            {isGameFinished && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="mt-6 text-center p-6 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg shadow-lg"
                                >
                                    <motion.div
                                        animate={{ rotate: [0, 10, -10, 10, 0] }}
                                        transition={{ duration: 0.5, repeat: 3 }}
                                        className="text-2xl font-bold text-white flex items-center justify-center"
                                    >
                                        <FaTrophy className="mr-3 text-yellow-300 text-4xl" />
                                        <div>
                                            <div>{trans('word_search_puzzle.game_info.congratulations')}!</div>
                                            <div className="text-lg font-normal mt-1">Time: {formatTime(timeElapsed)}</div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
