import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';
import LanguagePairSelect from '@/Pages/Profile/Partials/LanguagePairSelect';
import InputError from '@/Components/InputError';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

interface Props {
    show: boolean;
    onClose: () => void;
    languagePairs: Record<string, any>;
}

export default function GuestLanguageModal({ show, onClose, languagePairs }: Props) {
    const { t: trans } = useTranslation();

    // Initialize with the first language pair
    const defaultLanguagePairId = Object.keys(languagePairs)[0] || '';

    const { data, setData, post, processing, errors } = useForm({
        language_pair_id: defaultLanguagePairId,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('guest.create'), {
            preserveScroll: true,
            onSuccess: () => {
                i18n.changeLanguage(languagePairs[data.language_pair_id].sourceLanguage.code);
                localStorage.setItem('I18N_LANGUAGE', languagePairs[data.language_pair_id].sourceLanguage.code);
                onClose();
            },
        });
    };

    const modalVariants = {
        hidden: {
            opacity: 0,
            scale: 0.9,
            transition: { duration: 0.3 }
        },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 20
            }
        },
        exit: {
            opacity: 0,
            scale: 0.9,
            transition: { duration: 0.2 }
        }
    };

    const buttonVariants = {
        hover: { scale: 1.05 },
        tap: { scale: 0.95 }
    };

    return (
        <AnimatePresence>
            {show && (
                <Modal
                    show={show}
                    onClose={onClose}
                    maxWidth="md"
                >
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={modalVariants}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden"
                    >
                        <div className="bg-primary-500/10 p-6 border-b border-gray-200 dark:border-gray-700">
                            <motion.h2
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-2xl font-bold text-primary-600 dark:text-primary-400"
                            >
                                {trans('chooseLanguageJourney')}
                            </motion.h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                {trans('selectLanguagePairDescription')}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <LanguagePairSelect
                                    languagePairs={languagePairs}
                                    value={data.language_pair_id}
                                    onChange={(value) => setData('language_pair_id', value)}
                                    error={errors.language_pair_id}
                                    className="w-full"
                                />
                                <InputError message={errors.language_pair_id} className="mt-2" />
                            </motion.div>

                            <motion.div
                                className="flex justify-end space-x-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <motion.button
                                    type="button"
                                    onClick={onClose}
                                    variants={buttonVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                >
                                    {trans('generals.cancel')}
                                </motion.button>
                                <motion.button
                                    type="submit"
                                    disabled={processing || !data.language_pair_id}
                                    variants={buttonVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    className={`
                                        px-6 py-2 rounded-full text-white font-semibold
                                        ${processing || !data.language_pair_id
                                            ? 'bg-primary-300 cursor-not-allowed'
                                            : 'bg-primary-600 hover:bg-primary-500'}
                                        transition-colors duration-300 ease-in-out
                                    `}
                                >
                                    {processing ? trans('starting') : trans('startLearning')}
                                </motion.button>
                            </motion.div>
                        </form>
                    </motion.div>
                </Modal>
            )}
        </AnimatePresence>
    );
}
