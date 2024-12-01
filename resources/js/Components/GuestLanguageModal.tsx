import React, { useState } from 'react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import { useForm } from '@inertiajs/react';
import LanguagePairSelect from '@/Pages/Profile/Partials/LanguagePairSelect';
import InputError from '@/Components/InputError';

interface Props {
    show: boolean;
    onClose: () => void;
    languagePairs: Record<string, any>;
}

export default function GuestLanguageModal({ show, onClose, languagePairs }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        language_pair_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('guest.create'), {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <Modal show={show} onClose={onClose}>
            <form onSubmit={handleSubmit} className="p-6">
                <h2 className="text-lg font-medium text-slate-300">
                    Select Your Language Learning Journey
                </h2>

                <div className="mt-6">
                    <LanguagePairSelect
                        languagePairs={languagePairs}
                        value={data.language_pair_id}
                        onChange={(value) => setData('language_pair_id', value)}
                        error={errors.language_pair_id}
                    />
                    <InputError message={errors.language_pair_id} className="mt-2" />
                </div>

                <div className="mt-6 flex justify-end">
                    <PrimaryButton disabled={processing}>
                        {processing ? 'Starting...' : 'Start Learning'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
