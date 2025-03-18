import { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface GameBoardProps {
    letters: string[];
    onSubmit: () => void;
    inputWord: string;
    setInputWord: (word: string) => void;
    disabled: boolean;
}

const GameBoard: FC<GameBoardProps> = ({
    letters,
    onSubmit,
    inputWord,
    setInputWord,
    disabled
}) => {
    const { t } = useTranslation();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
                {letters.map((letter, index) => (
                    <button
                        key={index}
                        className="w-full aspect-square text-3xl font-bold bg-primary-100 dark:bg-primary-900
                                 text-primary-900 dark:text-primary-100 rounded-lg shadow-md
                                 hover:bg-primary-200 dark:hover:bg-primary-800 transition
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setInputWord(inputWord + letter)}
                        disabled={disabled}
                    >
                        {letter}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    value={inputWord}
                    onChange={(e) => setInputWord(e.target.value)}
                    className="w-full p-4 text-xl text-center border rounded-lg
                             dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder={t('games.word_search_puzzle.enter_word')}
                    disabled={disabled}
                />
                <div className="flex gap-4">
                    <button
                        type="submit"
                        className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg
                                 hover:bg-primary-600 transition disabled:opacity-50
                                 disabled:cursor-not-allowed"
                        disabled={disabled || !inputWord.trim()}
                    >
                        {t('games.word_search_puzzle.submit_word')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setInputWord('')}
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-600 rounded-lg
                                 hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                    >
                        {t('common.clear')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default GameBoard;
