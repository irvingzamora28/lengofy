import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';

interface Props {
    difficulty: 'easy' | 'medium' | 'hard';
    category: number;
}

interface Word {
    id: number;
    word: string;
    translation: string;
    found: boolean;
}

export default function WordSearchPuzzlePractice({ difficulty, category }: Props) {
    const { t: trans } = useTranslation();
    const [words] = useState<Word[]>([
        { id: 1, word: 'house', translation: 'casa', found: false },
        { id: 2, word: 'car', translation: 'coche', found: false },
        { id: 3, word: 'dog', translation: 'perro', found: false },
        { id: 4, word: 'cat', translation: 'gato', found: false },
        { id: 5, word: 'book', translation: 'libro', found: false },
    ]);
    const [selectedWord, setSelectedWord] = useState<Word | null>(null);
    const [score, setScore] = useState(0);
    const [attempts, setAttempts] = useState(0);

    const handleWordClick = (word: Word) => {
        if (word.found) return;

        if (!selectedWord) {
            setSelectedWord(word);
        } else {
            setAttempts(attempts + 1);

            // Check if the selected words match (are translations of each other)
            if (
                (selectedWord.word === word.translation || selectedWord.translation === word.word) &&
                selectedWord.id !== word.id
            ) {
                // Mark both words as found
                words.forEach(w => {
                    if (w.id === selectedWord.id || w.id === word.id) {
                        w.found = true;
                    }
                });
                setScore(score + 1);
            }

            setSelectedWord(null);
        }
    };

    const isGameComplete = words.every(word => word.found);

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                {trans('word_search_puzzle.practice_mode')}
            </h2>}
        >
            <Head title={trans('word_search_puzzle.practice_mode')} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        {/* Score and Attempts Display */}
                        <div className="mb-6 flex justify-between items-center">
                            <div className="text-lg">
                                {trans('word_search_puzzle.score')}: {score}
                            </div>
                            <div className="text-lg">
                                {trans('word_search_puzzle.attempts')}: {attempts}
                            </div>
                        </div>

                        {/* Game Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Source Language Words */}
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold mb-4">English</h3>
                                {words.map(word => (
                                    <button
                                        key={`source-${word.id}`}
                                        onClick={() => handleWordClick(word)}
                                        className={`w-full p-4 rounded-lg transition-colors ${
                                            word.found
                                                ? 'bg-green-100 dark:bg-green-900 cursor-default'
                                                : selectedWord?.id === word.id
                                                ? 'bg-blue-100 dark:bg-blue-900'
                                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                        disabled={word.found}
                                    >
                                        {word.word}
                                    </button>
                                ))}
                            </div>

                            {/* Target Language Words */}
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold mb-4">Spanish</h3>
                                {words.map(word => (
                                    <button
                                        key={`target-${word.id}`}
                                        onClick={() => handleWordClick(word)}
                                        className={`w-full p-4 rounded-lg transition-colors ${
                                            word.found
                                                ? 'bg-green-100 dark:bg-green-900 cursor-default'
                                                : selectedWord?.id === word.id
                                                ? 'bg-blue-100 dark:bg-blue-900'
                                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                        disabled={word.found}
                                    >
                                        {word.translation}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Game Complete Message */}
                        {isGameComplete && (
                            <div className="mt-6 text-center">
                                <h3 className="text-xl font-bold text-green-600 dark:text-green-400">
                                    {trans('word_search_puzzle.practice_complete')}
                                </h3>
                                <p className="mt-2">
                                    {trans('word_search_puzzle.final_score', { score, attempts })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
