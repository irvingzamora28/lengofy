import { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface WordListProps {
    words: string[];
}

const WordList: FC<WordListProps> = ({ words }) => {
    const { t } = useTranslation();

    return (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                {t('games.word_puzzle.found_words')}
            </h3>
            {words.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    {t('games.word_puzzle.no_words_yet')}
                </p>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    {words.map((word, index) => (
                        <div
                            key={index}
                            className="bg-white dark:bg-gray-800 p-2 rounded text-center
                                     text-gray-900 dark:text-gray-100"
                        >
                            {word}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WordList;
