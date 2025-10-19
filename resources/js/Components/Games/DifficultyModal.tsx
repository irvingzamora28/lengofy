import { useEffect, useState } from 'react';
import Modal from '../Modal';
import axios from 'axios';
import InputLabel from '../InputLabel';
import Select from '../Select';
import { Category, Translations } from '@/types';
import { useTranslation } from 'react-i18next';

interface VerbList {
    id: number;
    name: string;
    description: string | null;
    items_count: number;
}

interface TaskTypes {
    article_gender: boolean;
    translation: boolean;
    verb_conjugation: boolean;
}

interface Tense {
    id: number;
    name: string;
    code: string;
}

interface DifficultyModalProps {
    showDifficultyModal: boolean;
    setShowDifficultyModal: React.Dispatch<React.SetStateAction<boolean>>;
    selectedDifficulty: string;
    setSelectedDifficulty: React.Dispatch<React.SetStateAction<"easy" | "medium" | "hard">>;
    selectedCategory: number;
    setSelectedCategory: React.Dispatch<React.SetStateAction<number>>;
    selectedVerbList?: number | null;
    setSelectedVerbList?: React.Dispatch<React.SetStateAction<number | null>>;
    selectedTenses?: number[];
    setSelectedTenses?: React.Dispatch<React.SetStateAction<number[]>>;
    taskTypes?: TaskTypes;
    setTaskTypes?: React.Dispatch<React.SetStateAction<TaskTypes>>;
    startGame: () => void;
    gameType?: 'singlePlayer' | 'multiPlayer';
    onDifficultyChange?: () => void;
    showCategories?: boolean;
    showVerbLists?: boolean;
    showTaskTypes?: boolean;
    easyText: string;
    mediumText: string;
    hardText: string;
    isRestart?: boolean;
}

export default function DifficultyModal({
    showDifficultyModal,
    setShowDifficultyModal,
    selectedDifficulty,
    setSelectedDifficulty,
    selectedCategory,
    setSelectedCategory,
    selectedVerbList,
    setSelectedVerbList,
    selectedTenses,
    setSelectedTenses,
    taskTypes,
    setTaskTypes,
    isRestart = false,
    startGame,
    gameType = 'multiPlayer',
    onDifficultyChange,
    showCategories = true,
    showVerbLists = false,
    showTaskTypes = true,
    easyText,
    mediumText,
    hardText
}: DifficultyModalProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [verbLists, setVerbLists] = useState<VerbList[]>([]);
    const [tenses, setTenses] = useState<Tense[]>([]);
    const { t: trans } = useTranslation();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const promises = [axios.get(route('categories.index'))];
                
                if (showVerbLists && taskTypes?.verb_conjugation) {
                    promises.push(axios.get(route('api.verb-lists.index')));
                }
                
                if (showTaskTypes) {
                    promises.push(axios.get(route('api.tenses.index')));
                }
                
                const responses = await Promise.all(promises);
                
                setCategories([
                    { id: 0, key: 'all' },
                    ...responses[0].data.map((category: any) => ({
                        id: category.id,
                        key: category.key
                    }))
                ]);
                
                let responseIndex = 1;
                if (showVerbLists && taskTypes?.verb_conjugation && responses[responseIndex]) {
                    setVerbLists(responses[responseIndex].data.data || []);
                    responseIndex++;
                }
                
                if (showTaskTypes && responses[responseIndex]) {
                    const fetchedTenses = responses[responseIndex].data || [];
                    setTenses(fetchedTenses);
                    // Default to ONLY the first tense each time the modal fetches tenses
                    if (setSelectedTenses && Array.isArray(fetchedTenses) && fetchedTenses.length > 0) {
                        setSelectedTenses([fetchedTenses[0].id]);
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        if (showDifficultyModal) {
            fetchData();
        }
    }, [showDifficultyModal, showVerbLists, taskTypes?.verb_conjugation]);

    // After tenses are loaded and the modal is open, enforce ONLY the first tense selected.
    useEffect(() => {
        if (!showDifficultyModal) return;
        if (!tenses || tenses.length === 0) return;
        if (!setSelectedTenses) return;
        const firstId = tenses[0].id;
        // If selection is anything other than exactly [firstId], normalize it
        if (!selectedTenses || selectedTenses.length !== 1 || selectedTenses[0] !== firstId) {
            setSelectedTenses([firstId]);
        }
    }, [showDifficultyModal, tenses, selectedTenses]);

    // If verb conjugation is turned off, clear any selected verb list so it won't be sent
    useEffect(() => {
        if (!taskTypes?.verb_conjugation) {
            setSelectedVerbList?.(null);
        }
    }, [taskTypes?.verb_conjugation]);

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

                {/* Task Type Selector */}
                {showTaskTypes && taskTypes && setTaskTypes && (
                    <div className="mb-6">
                        <div className="flex flex-col items-start mb-3">
                            <InputLabel
                                htmlFor="task_types"
                                value="Task Types"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Select which types of questions you want to practice
                            </p>
                        </div>
                        <div className="space-y-3">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={taskTypes.article_gender}
                                    onChange={(e) => setTaskTypes({ ...taskTypes, article_gender: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                                    Article/Gender <span className="text-xs text-gray-500">(der/die/das)</span>
                                </span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={taskTypes.translation}
                                    onChange={(e) => setTaskTypes({ ...taskTypes, translation: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                                    Translation <span className="text-xs text-gray-500">(word meaning)</span>
                                </span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={taskTypes.verb_conjugation}
                                    onChange={(e) => setTaskTypes({ ...taskTypes, verb_conjugation: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                                    Verb Conjugation <span className="text-xs text-gray-500">(tense forms)</span>
                                </span>
                            </label>
                        </div>
                        {!taskTypes.article_gender && !taskTypes.translation && !taskTypes.verb_conjugation && (
                            <p className="mt-2 text-xs text-red-500">
                                Please select at least one task type
                            </p>
                        )}
                    </div>
                )}

                {/* Verb List Selector - Only show if verb conjugation is enabled */}
                {showVerbLists && taskTypes?.verb_conjugation && (
                    <div className="mb-6">
                        <div className="flex flex-col items-start mb-2">
                            <InputLabel
                                htmlFor="select_verb_list"
                                value={trans('Verb List (Optional)')}
                            />
                        </div>
                        <div className="mt-1 relative">
                            <Select
                                id="select_verb_list"
                                value={selectedVerbList ?? ''}
                                onChange={(e) =>
                                    setSelectedVerbList?.(e.target.value ? parseInt(e.target.value, 10) : null)
                                }
                                className="block w-full pl-10 pr-10"
                            >
                                <option value="">{trans('All Verbs (Default)')}</option>
                                {verbLists.map((list) => (
                                    <option key={list.id} value={list.id}>
                                        {list.name} ({list.items_count} {trans('verbs')})
                                    </option>
                                ))}
                            </Select>
                            <p className="flex flex-col items-start mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {trans('Select a custom verb list to practice only those verbs, or leave empty to use all verbs.')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Tense Selector - Only show if verb conjugation is enabled */}
                {showTaskTypes && taskTypes?.verb_conjugation && selectedTenses && setSelectedTenses && (
                    <div className="mb-6">
                        <div className="flex flex-col items-start mb-3">
                            <InputLabel
                                htmlFor="tense_selector"
                                value="Tenses (for Verb Conjugation)"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Select which tenses to practice
                            </p>
                        </div>
                        <div className="space-y-2">
                            {tenses.map((tense) => (
                                <label key={tense.id} className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedTenses.includes(tense.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedTenses([...selectedTenses, tense.id]);
                                            } else {
                                                setSelectedTenses(selectedTenses.filter(id => id !== tense.id));
                                            }
                                        }}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                                        {tense.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                        {selectedTenses.length === 0 && (
                            <p className="mt-2 text-xs text-red-500">
                                Please select at least one tense
                            </p>
                        )}
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
                        onClick={() => {
                            startGame();
                            setShowDifficultyModal(false);
                        }}
                        className="bg-green-500 hover:bg-green-600 dark:bg-green-600
                                 dark:hover:bg-green-700 text-white font-bold py-2 px-6
                                 rounded-lg transition-colors duration-200"
                    >
                        {gameType === 'singlePlayer'
                            ? trans('gender_duel.modal_difficulty.start_practice')
                            : isRestart
                                ? trans('gender_duel.modal_difficulty.start')
                                : trans('gender_duel.modal_difficulty.create_room')}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
