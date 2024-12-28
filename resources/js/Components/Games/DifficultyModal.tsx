import { useEffect, useState } from 'react';
import Modal from '../Modal';
import axios from 'axios';
import InputLabel from '../InputLabel';
import Select from '../Select';
import { Category, Translations } from '@/types';

interface DifficultyModalProps {
    showDifficultyModal: boolean;
    setShowDifficultyModal: React.Dispatch<React.SetStateAction<boolean>>;
    selectedDifficulty: string;
    setSelectedDifficulty: React.Dispatch<React.SetStateAction<"easy" | "medium" | "hard">>;
    selectedCategory: number;
    setSelectedCategory: React.Dispatch<React.SetStateAction<number>>;
    startGame: () => void;
    translations: Translations;
    gameType: 'singlePlayer' | 'multiPlayer';
}

export default function DifficultyModal({
    showDifficultyModal,
    setShowDifficultyModal,
    selectedDifficulty,
    setSelectedDifficulty,
    selectedCategory,
    setSelectedCategory,
    startGame,
    translations,
    gameType
}: DifficultyModalProps) {
    const [categories, setCategories] = useState<Category[]>([]);

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
                <h2 className="text-2xl font-bold mb-4 dark:text-white">Select Difficulty</h2>

                <div className="mb-6">
                    <div className="flex flex-col items-start mb-2">
                        <InputLabel
                            htmlFor="select_category"
                            value="Select Word Category"
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
                                    {translations.categories[category.key]}
                                </option>
                            ))}
                        </Select>
                        <p className="flex flex-col items-start mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Choose '{translations.categories.all}' for words from every category
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                        <button
                            key={difficulty}
                            onClick={() => setSelectedDifficulty(difficulty)}
                            className={`w-full py-3 rounded-lg transition-colors duration-200 ${
                                selectedDifficulty === difficulty
                                    ? 'bg-blue-500 dark:bg-blue-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                            <span className="block text-sm mt-1 opacity-80">
                                {difficulty === 'easy' && '5 seconds per word'}
                                {difficulty === 'medium' && '3 seconds per word'}
                                {difficulty === 'hard' && '1 second per word'}
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
                        {gameType === 'singlePlayer' ? 'Start Practice' : 'Create Room'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
