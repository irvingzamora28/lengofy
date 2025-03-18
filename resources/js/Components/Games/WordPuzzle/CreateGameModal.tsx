import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';

interface CreateGameModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateGameModal: FC<CreateGameModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const { data, setData, post, processing } = useForm({
        language_name: 'en',
        max_players: 2,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('word-puzzle.create'), {
            onSuccess: () => onClose(),
        });
    };

    return (
        <Modal show={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {t('games.word_puzzle.create_game')}
                </h2>

                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('games.language')}
                    </label>
                    <select
                        value={data.language_name}
                        onChange={e => setData('language_name', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700
                                 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="de">Deutsch</option>
                    </select>
                </div>

                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('games.max_players')}
                    </label>
                    <select
                        value={data.max_players}
                        onChange={e => setData('max_players', parseInt(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700
                                 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                    </select>
                </div>

                <div className="mt-6 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                                 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-500
                                 hover:bg-primary-600 rounded-md disabled:opacity-50"
                    >
                        {t('common.create')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateGameModal;
