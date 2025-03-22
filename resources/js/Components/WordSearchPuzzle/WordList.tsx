import { motion, AnimatePresence } from 'framer-motion';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Word {
    id: number;
    word: string;
    translation: string;
    found: boolean;
}

interface WordListProps {
    words: Word[];
}

export default function WordList({ words }: WordListProps) {
    const { t: trans } = useTranslation();
    const [showTranslations, setShowTranslations] = useState(false);

    const toggleTranslations = () => {
        setShowTranslations(!showTranslations);
    };

    return (
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md mb-4">
            <div className="flex justify-between items-center border-b pb-2 border-gray-200 dark:border-gray-700 mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {trans('word_search_puzzle.game_info.words')}
                </h3>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleTranslations}
                    className="flex items-center gap-2 px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-colors text-sm shadow-md"
                >
                    {showTranslations ? <FaEyeSlash className="w-3 h-3" /> : <FaEye className="w-3 h-3" />}
                    {showTranslations ? trans('word_search_puzzle.game_info.hide_translation') : trans('word_search_puzzle.game_info.show_translation')}
                </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                    <h4 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        {trans('word_search_puzzle.game_info.translation')}
                    </h4>
                    <div className="space-y-1 max-h-[40vh]">
                        {words.map((word) => (
                            <motion.div
                                key={`translation-${word.id}`}
                                whileHover={{ x: 3 }}
                                className={`p-2 rounded-md ${
                                    word.found
                                        ? 'line-through bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {word.translation}
                            </motion.div>
                        ))}
                    </div>
                </div>

                <AnimatePresence>
                    {showTranslations && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <h4 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">
                                {trans('word_search_puzzle.game_info.words')}
                            </h4>
                            <div className="space-y-1 max-h-[40vh]">
                                {words.map((word) => (
                                    <motion.div
                                        key={`word-${word.id}`}
                                        whileHover={{ x: 3 }}
                                        className={`p-2 rounded-md ${
                                            word.found
                                                ? 'line-through bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        {word.word}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
