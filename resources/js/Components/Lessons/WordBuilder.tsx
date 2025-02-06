import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiRefreshCw, FiCheck, FiX } from "react-icons/fi";

interface WordBuilderProps {
    targetWord: string;
    nativeWord: string;
}

const WordBuilder: React.FC<WordBuilderProps> = ({
    targetWord,
    nativeWord,
}) => {
    const [letters, setLetters] = useState<string[]>([]);
    const [answer, setAnswer] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<string>("");
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    // Function to scramble the target word
    const scrambleWord = (word: string): string[] => {
        const array = word.split("");
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    };

    // Initialize scrambled letters on component mount
    useEffect(() => {
        setLetters(scrambleWord(targetWord));
    }, [targetWord]);

    // Add a letter to the answer (used for both drag-and-drop and click-to-select)
    const addLetterToAnswer = (letter: string) => {
        const index = letters.indexOf(letter);
        if (index !== -1) {
            setAnswer((prev) => [...prev, letter]);
            setLetters((prev) => prev.filter((_, i) => i !== index)); // Remove only one instance
        }
    };

    const handleSubmit = () => {
        const constructedWord = answer.join("");
        if (constructedWord === targetWord) {
            setFeedback("Excellent! You got it right!");
            setIsCorrect(true);
        } else {
            setFeedback(`Not quite. Try again!`);
            setIsCorrect(false);
        }
    };

    const resetGame = () => {
        setAnswer([]);
        setLetters(scrambleWord(targetWord));
        setFeedback("");
        setIsCorrect(null);
    };

    return (
        <div className="max-w-xl mx-auto p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
                <div className="text-lg my-2 font-semibold text-gray-800 dark:text-gray-100">
                    Build the Word
                </div>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={resetGame}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title="Reset"
                >
                    <FiRefreshCw className="w-5 h-5" />
                </motion.button>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium my-2">
                Translate: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{nativeWord}</span>
            </div>

            {/* Answer Zone */}
            <motion.div
                className={`min-h-[60px] p-3 my-2 rounded-lg border-2 border-dashed transition-colors duration-300 flex flex-wrap gap-2 items-center ${isCorrect === true ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : isCorrect === false ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50'}`}
                onDrop={(e: React.DragEvent<HTMLDivElement>) => {
                    e.preventDefault();
                    const droppedLetter = e.dataTransfer.getData("text/plain");
                    addLetterToAnswer(droppedLetter);
                }}
                onDragOver={(e: React.DragEvent<HTMLDivElement>) => e.preventDefault()}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 0.2 }}
            >
                <AnimatePresence>
                    {answer.map((letter, index) => (
                        <motion.div
                            key={`answer-${index}`}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-md text-lg font-medium shadow-sm"
                        >
                            {letter}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Available Letters */}
            <div className="flex flex-wrap my-4 gap-2">
                <AnimatePresence>
                    {letters.map((letter, index) => (
                        <motion.div
                            key={`letter-${index}`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => addLetterToAnswer(letter)}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md cursor-pointer text-lg font-medium shadow-sm hover:shadow-md transition-shadow duration-200 select-none"
                        >
                            <div
                                draggable
                                onDragStart={(e: React.DragEvent<HTMLDivElement>) => e.dataTransfer.setData("text/plain", letter)}
                            >
                                {letter}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>


            {/* Submit Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                className="w-full py-2.5 px-4 bg-blue-500 dark:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors hover:bg-blue-600 dark:hover:bg-blue-700"
            >
                {isCorrect === true ? (
                    <FiCheck className="w-5 h-5" />
                ) : isCorrect === false ? (
                    <FiX className="w-5 h-5" />
                ) : null}
                Check Answer
            </motion.button>

            {/* Feedback */}
            <AnimatePresence>
                {feedback && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`text-center text-sm font-medium ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    >
                        {feedback}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WordBuilder;
