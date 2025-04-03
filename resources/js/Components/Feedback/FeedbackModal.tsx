import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import toast from 'react-hot-toast';

interface FeedbackModalProps {
    isOpen: boolean;
    closeModal: () => void;
    isGuest: boolean;
}

type FeedbackType = 'content' | 'game' | 'ui_ux' | 'bug' | 'feature' | 'general';

interface FeedbackTypeInfo {
    value: FeedbackType;
    label: string;
    description: string;
}

export default function FeedbackModal({ isOpen, closeModal, isGuest }: FeedbackModalProps) {
    const { t } = useTranslation();
    const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal is opened
    useEffect(() => {
        if (isOpen) {
            setFeedbackType('general');
            setMessage('');
        }
    }, [isOpen]);

    const feedbackTypes: FeedbackTypeInfo[] = [
        {
            value: 'content',
            label: t('feedback.types.content'),
            description: t('feedback.descriptions.content')
        },
        {
            value: 'game',
            label: t('feedback.types.game'),
            description: t('feedback.descriptions.game')
        },
        {
            value: 'ui_ux',
            label: t('feedback.types.ui_ux'),
            description: t('feedback.descriptions.ui_ux')
        },
        {
            value: 'bug',
            label: t('feedback.types.bug'),
            description: t('feedback.descriptions.bug')
        },
        {
            value: 'feature',
            label: t('feedback.types.feature'),
            description: t('feedback.descriptions.feature')
        },
        {
            value: 'general',
            label: t('feedback.types.general'),
            description: t('feedback.descriptions.general')
        }
    ];

    const handleSubmit = () => {
        if (!message.trim()) {
            toast.error(t('feedback.message_required'));
            return;
        }

        setIsSubmitting(true);

        router.post(route('feedback.store'), {
            feedback_type: feedbackType,
            message: message,
        }, {
            onSuccess: () => {
                closeModal();
                setIsSubmitting(false);
            },
            onError: (errors) => {
                console.error(errors);
                // Display specific validation errors if available
                if (errors.feedback_type) {
                    toast.error(errors.feedback_type);
                } else if (errors.message) {
                    toast.error(errors.message);
                } else {
                    toast.error(t('feedback.error'));
                }
                setIsSubmitting(false);
            },
            preserveScroll: true
        });
    };

    const getCurrentTypeDescription = () => {
        return feedbackTypes.find(type => type.value === feedbackType)?.description || '';
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={closeModal}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 dark:bg-black/40" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                                <div className="flex items-center justify-between">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                                    >
                                        {t('feedback.title')}
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-500 dark:hover:text-gray-400"
                                        onClick={closeModal}
                                    >
                                        <span className="sr-only">{t('generals.close')}</span>
                                        <FiX className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="mt-4">
                                    <div className="mb-4">
                                        <label htmlFor="feedback-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('feedback.type_label')}
                                        </label>
                                        <select
                                            id="feedback-type"
                                            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                            value={feedbackType}
                                            onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
                                        >
                                            {feedbackTypes.map((type) => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            {getCurrentTypeDescription()}
                                        </p>
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('feedback.message_label')}
                                        </label>
                                        <textarea
                                            id="feedback-message"
                                            rows={4}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                            placeholder={t('feedback.message_placeholder')}
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                        />
                                    </div>

                                    <div className="mt-6 flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                            onClick={closeModal}
                                        >
                                            {t('generals.cancel')}
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || !message.trim()}
                                        >
                                            {isSubmitting ? t('generals.submitting') : t('generals.submit')}
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
