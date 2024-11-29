import { FormEventHandler, useEffect } from 'react';
import Modal from '@/Components/Modal';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import { useForm } from '@inertiajs/react';

interface Props {
    show: boolean;
    onClose: () => void;
    languagePairs: Record<string, string>;
}

export default function CreateGameModal({ show, onClose, languagePairs }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        language_pair_id: '',
        max_players: 8,
    });

    useEffect(() => {
        return () => {
            reset();
        };
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('games.create'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal show={show} onClose={onClose}>
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-medium text-gray-900">
                    Create New Game
                </h2>

                <div className="mt-6">
                    <InputLabel htmlFor="language_pair_id" value="Language Pair" />
                    <select
                        id="language_pair_id"
                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                        value={data.language_pair_id}
                        onChange={(e) => setData('language_pair_id', e.target.value)}
                        required
                    >
                        <option value="">Select a language pair</option>
                        {languagePairs && Object.entries(languagePairs).map(([id, name]) => (
                            <option key={id} value={id}>
                                {name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.language_pair_id} className="mt-2" />
                </div>

                <div className="mt-6">
                    <InputLabel htmlFor="max_players" value="Maximum Players" />
                    <input
                        id="max_players"
                        type="number"
                        min="2"
                        max="8"
                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                        value={data.max_players}
                        onChange={(e) => setData('max_players', parseInt(e.target.value))}
                        required
                    />
                    <InputError message={errors.max_players} className="mt-2" />
                </div>

                <div className="mt-6 flex justify-end">
                    <PrimaryButton disabled={processing}>
                        Create Game
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
