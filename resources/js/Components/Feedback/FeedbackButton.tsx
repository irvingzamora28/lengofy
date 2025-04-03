import { useState } from 'react';
import { FiMessageSquare } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import FeedbackModal from './FeedbackModal';
import { User } from '@/types';

interface FeedbackButtonProps {
    user: User;
    isMobile?: boolean;
}

export default function FeedbackButton({ user, isMobile = false }: FeedbackButtonProps) {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <>
            {isMobile ? (
                // Mobile version (icon only)
                <div className="px-4 py-2">
                    <button
                        onClick={openModal}
                        className="flex items-center justify-center rounded-full bg-primary-100 p-2 text-primary-600 hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-800"
                        aria-label={t('feedback.provide_feedback')}
                    >
                        <FiMessageSquare className="h-5 w-5" />
                    </button>
                </div>
            ) : (
                // Desktop version (icon + text)
                <button
                    onClick={openModal}
                    className="flex items-center rounded-md border border-transparent bg-primary-100 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-800"
                >
                    <FiMessageSquare className="mr-2 h-5 w-5" />
                    {t('feedback.feedback')}
                </button>
            )}

            <FeedbackModal 
                isOpen={isModalOpen} 
                closeModal={closeModal} 
                isGuest={user?.is_guest || false} 
            />
        </>
    );
}
