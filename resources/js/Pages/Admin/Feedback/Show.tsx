import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from 'react-i18next';
import { FiMessageSquare, FiCheckCircle, FiClock, FiUser, FiCalendar, FiMail } from 'react-icons/fi';

interface FeedbackItem {
    id: number;
    user_id: number | null;
    user?: {
        name: string;
        email: string;
    };
    is_guest: boolean;
    guest_email?: string;
    feedback_type: 'content' | 'game' | 'ui_ux' | 'bug' | 'feature' | 'general';
    message: string;
    status: 'new' | 'in_review' | 'resolved';
    created_at: string;
    updated_at: string;
}

interface Props {
    feedback: FeedbackItem;
}

export default function FeedbackShow({ feedback }: Props) {
    const { t } = useTranslation();
    const { data, setData, patch, processing, errors } = useForm({
        status: feedback.status,
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'in_review':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'resolved':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'content':
                return <FiMessageSquare className="mr-1" />;
            case 'game':
                return <FiMessageSquare className="mr-1" />;
            case 'ui_ux':
                return <FiMessageSquare className="mr-1" />;
            case 'bug':
                return <FiMessageSquare className="mr-1" />;
            case 'feature':
                return <FiMessageSquare className="mr-1" />;
            case 'general':
                return <FiMessageSquare className="mr-1" />;
            default:
                return <FiMessageSquare className="mr-1" />;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'new':
                return <FiMessageSquare className="mr-1" />;
            case 'in_review':
                return <FiClock className="mr-1" />;
            case 'resolved':
                return <FiCheckCircle className="mr-1" />;
            default:
                return <FiMessageSquare className="mr-1" />;
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('admin.feedback-analytics.update-status', feedback.id));
    };

    return (
        <AdminLayout>
            <Head title={t('admin.feedback.view_feedback')} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    {t('admin.feedback.view_feedback')}
                                </h1>
                                <a
                                    href={route('admin.feedback-analytics')}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                >
                                    {t('admin.feedback.back_to_list')}
                                </a>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                            {t('admin.feedback.feedback_details')}
                                        </h2>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    {t('admin.feedback.id')}
                                                </div>
                                                <div className="mt-1 text-gray-900 dark:text-white">
                                                    {feedback.id}
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    {t('admin.feedback.type')}
                                                </div>
                                                <div className="mt-1 text-gray-900 dark:text-white flex items-center">
                                                    {getTypeIcon(feedback.feedback_type)}
                                                    {t(`feedback.types.${feedback.feedback_type}`)}
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    {t('admin.feedback.status')}
                                                </div>
                                                <div className="mt-1">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(feedback.status)}`}>
                                                        {getStatusIcon(feedback.status)}
                                                        {t(`admin.feedback.status_${feedback.status}`)}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    {t('admin.feedback.date')}
                                                </div>
                                                <div className="mt-1 text-gray-900 dark:text-white flex items-center">
                                                    <FiCalendar className="mr-1" />
                                                    {new Date(feedback.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                            {t('admin.feedback.user_details')}
                                        </h2>
                                        
                                        <div className="space-y-4">
                                            {feedback.user ? (
                                                <>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                            {t('admin.feedback.name')}
                                                        </div>
                                                        <div className="mt-1 text-gray-900 dark:text-white flex items-center">
                                                            <FiUser className="mr-1" />
                                                            {feedback.user.name}
                                                        </div>
                                                    </div>
                                                    
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                            {t('admin.feedback.email')}
                                                        </div>
                                                        <div className="mt-1 text-gray-900 dark:text-white flex items-center">
                                                            <FiMail className="mr-1" />
                                                            {feedback.user.email}
                                                        </div>
                                                    </div>
                                                    
                                                    {feedback.is_guest && (
                                                        <div className="mt-2">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                                {t('admin.feedback.guest')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            ) : feedback.guest_email ? (
                                                <div>
                                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                        {t('admin.feedback.guest_email')}
                                                    </div>
                                                    <div className="mt-1 text-gray-900 dark:text-white flex items-center">
                                                        <FiMail className="mr-1" />
                                                        {feedback.guest_email}
                                                    </div>
                                                    <div className="mt-2">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                            {t('admin.feedback.guest')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-gray-500 dark:text-gray-400">
                                                    {t('admin.feedback.anonymous')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6">
                                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                    {t('admin.feedback.message')}
                                </h2>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-600">
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {feedback.message}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                    {t('admin.feedback.update_status')}
                                </h2>
                                
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('admin.feedback.status')}
                                        </label>
                                        <select
                                            id="status"
                                            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm w-full"
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value as 'new' | 'in_review' | 'resolved')}
                                        >
                                            <option value="new">{t('admin.feedback.status_new')}</option>
                                            <option value="in_review">{t('admin.feedback.status_in_review')}</option>
                                            <option value="resolved">{t('admin.feedback.status_resolved')}</option>
                                        </select>
                                        {errors.status && (
                                            <div className="text-red-500 text-sm mt-1">{errors.status}</div>
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                                            disabled={processing}
                                        >
                                            {t('admin.feedback.update')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
