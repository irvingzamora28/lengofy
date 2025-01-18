import { useEffect, useState } from 'react';
import Modal from '../Modal';
import axios from 'axios';
import InputLabel from '../InputLabel';
import Select from '../Select';
import { Category, Translations } from '@/types';
import { useTranslation } from 'react-i18next';

interface DifficultyModalProps {
    showDifficultyModal: boolean;
    setShowDifficultyModal: React.Dispatch<React.SetStateAction<boolean>>;
    selectedDifficulty: string;
    setSelectedDifficulty: React.Dispatch<React.SetStateAction<"easy" | "medium" | "hard">>;
    selectedCategory: number;
    setSelectedCategory: React.Dispatch<React.SetStateAction<number>>;
    startGame: () => void;
    gameType?: 'singlePlayer' | 'multiPlayer';
    onDifficultyChange?: () => void;
    showCategories?: boolean;
    easyText: string;
    mediumText: string;
    hardText: string;
}

export default function DifficultyModal({
    showDifficultyModal,
    setShowDifficultyModal,
    selectedDifficulty,
    setSelectedDifficulty,
    selectedCategory,
    setSelectedCategory,
    startGame,
    gameType = 'multiPlayer',
    onDifficultyChange,
    showCategories = true,
    easyText,
    mediumText,
    hardText
}: DifficultyModalProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const { t: trans } = useTranslation();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(route('categories.index'));
                setCategories([
                    { id: 0, key: 'all' },
                    ...response.data.map((category: any) => ({
                        id: category.id,
                        key: category.key
                    }))
                ]);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        if (showDifficultyModal) {
            fetchCategories();
        }
    }, [showDifficultyModal]);

    return (
        <Modal show={showDifficultyModal} onClose={() => setShowDifficultyModal(false)}>
            <div className="p-6 text-center">
                <h2 className="text-2xl font-bold mb-4 dark:text-white">{trans('gender_duel.modal_difficulty.title')}</h2>

                {showCategories && (
                    <div className="mb-6">
                        <div className="flex flex-col items-start mb-2">
                            <InputLabel
                                htmlFor="select_category"
                                value={trans('gender_duel.modal_difficulty.select_word_category')}
                            />

                        </div>
                        <div className="mt-1 relative">
                            <Select
                                id="select_category"
                                value={selectedCategory}
                                onChange={(e) =>
                                    setSelectedCategory(parseInt(e.target.value, 10))
                                }
                                className="block w-full pl-10 pr-10"
                            >
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {trans('categories.' + category.key)}
                                    </option>
                                ))}
                            </Select>
                            <p className="flex flex-col items-start mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {trans('gender_duel.modal_difficulty.choose')} '{trans('categories.all')}' {trans('gender_duel.modal_difficulty.for_words_from_every_category')}
                            </p>
                        </div>
                    </div>
                )}
                <div className="space-y-4">
                    {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                        <button
                            key={difficulty}
                            onClick={() => {
                                setSelectedDifficulty(difficulty);
                                onDifficultyChange?.();
                            }}
                            className={`w-full py-3 rounded-lg transition-colors duration-200 ${
                                selectedDifficulty === difficulty
                                    ? 'bg-blue-500 dark:bg-blue-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            {trans(`gender_duel.modal_difficulty.${difficulty}`)}
                            <span className="block text-sm mt-1 opacity-80">
                                {difficulty === 'easy' && easyText}
                                {difficulty === 'medium' && mediumText}
                                {difficulty === 'hard' && hardText}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="mt-6">
                    <button
                        onClick={startGame}
                        className="bg-green-500 hover:bg-green-600 dark:bg-green-600
                                 dark:hover:bg-green-700 text-white font-bold py-2 px-6
                                 rounded-lg transition-colors duration-200"
                    >
                        {gameType === 'singlePlayer' ? trans('gender_duel.modal_difficulty.start_practice') : trans('gender_duel.modal_difficulty.create_room')}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
