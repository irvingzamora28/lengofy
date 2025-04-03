import { useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from 'react-i18next';
import { FiMessageSquare, FiCheckCircle, FiClock } from 'react-icons/fi';

interface FeedbackItem {
    id: number;
    user_id: number | null;
    user?: {
        name: string;
        email: string;
    };
    is_guest: boolean;
    feedback_type: 'content' | 'game' | 'ui_ux' | 'bug' | 'feature' | 'general';
    message: string;
    status: 'new' | 'in_review' | 'resolved';
    created_at: string;
    updated_at: string;
}

interface Props {
    feedback: FeedbackItem[];
}

export default function FeedbackIndex({ feedback }: Props) {
    const { t } = useTranslation();
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');

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

    const filteredFeedback = feedback.filter((item) => {
        if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
        if (selectedType !== 'all' && item.feedback_type !== selectedType) return false;
        return true;
    });

    return (
        <AdminLayout>
            <Head title={t('admin.feedback.title')} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                                {t('admin.feedback.title')}
                            </h1>

                            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                                <div>
                                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('admin.feedback.filter_by_status')}
                                    </label>
                                    <select
                                        id="status-filter"
                                        className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                    >
                                        <option value="all">{t('admin.feedback.all_statuses')}</option>
                                        <option value="new">{t('admin.feedback.status_new')}</option>
                                        <option value="in_review">{t('admin.feedback.status_in_review')}</option>
                                        <option value="resolved">{t('admin.feedback.status_resolved')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('admin.feedback.filter_by_type')}
                                    </label>
                                    <select
                                        id="type-filter"
                                        className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value)}
                                    >
                                        <option value="all">{t('admin.feedback.all_types')}</option>
                                        <option value="content">{t('feedback.types.content')}</option>
                                        <option value="game">{t('feedback.types.game')}</option>
                                        <option value="ui_ux">{t('feedback.types.ui_ux')}</option>
                                        <option value="bug">{t('feedback.types.bug')}</option>
                                        <option value="feature">{t('feedback.types.feature')}</option>
                                        <option value="general">{t('feedback.types.general')}</option>
                                    </select>
                                </div>
                            </div>

                            {filteredFeedback.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 dark:text-gray-400">{t('admin.feedback.no_feedback')}</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                                    {t('admin.feedback.id')}
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                                    {t('admin.feedback.user')}
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                                    {t('admin.feedback.type')}
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                                    {t('admin.feedback.message')}
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                                    {t('admin.feedback.status')}
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                                    {t('admin.feedback.date')}
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                                    {t('admin.feedback.actions')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                            {filteredFeedback.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {item.id}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {item.user ? (
                                                            <div>
                                                                <div>{item.user.name}</div>
                                                                <div className="text-xs text-gray-400 dark:text-gray-500">{item.user.email}</div>
                                                                {item.is_guest && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                                        {t('admin.feedback.guest')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 dark:text-gray-500">
                                                                {t('admin.feedback.anonymous')}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        <span className="inline-flex items-center">
                                                            {getTypeIcon(item.feedback_type)}
                                                            {t(`feedback.types.${item.feedback_type}`)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                        {item.message}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                                            {getStatusIcon(item.status)}
                                                            {t(`admin.feedback.status_${item.status}`)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(item.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <a
                                                            href={route('admin.feedback-analytics.show', item.id)}
                                                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                                                        >
                                                            {t('admin.feedback.view')}
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
