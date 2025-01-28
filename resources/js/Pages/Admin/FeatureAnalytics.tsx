import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '@/Layouts/AdminLayout';

interface FeatureStats {
    feature: string;
    category: string;
    total_interests: number;
}

interface TopFeature {
    feature: string;
    interests: number;
}

interface OverallStats {
    total_features: number;
    total_subscribers: number;
    total_interests: number;
    avg_interests_per_subscriber: number;
}

interface FeatureAnalyticsProps {
    overallStats: OverallStats;
    featureStats: FeatureStats[];
    topFeatures: TopFeature[];
}

export default function FeatureAnalytics({ overallStats, featureStats, topFeatures }: FeatureAnalyticsProps) {
    const { t: trans } = useTranslation();

    return (
        <AdminLayout>
            <Head title={trans('admin.feature_analytics')} />

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                <div className="p-6 text-gray-900 dark:text-gray-100">
                    <h1 className="text-2xl font-semibold mb-6">{trans('admin.feature_analytics')}</h1>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard title={trans('admin.total_features')} value={overallStats.total_features} />
                        <StatCard title={trans('admin.total_subscribers')} value={overallStats.total_subscribers} />
                        <StatCard title={trans('admin.total_interests')} value={overallStats.total_interests} />
                        <StatCard
                            title={trans('admin.avg_interests_per_subscriber')}
                            value={overallStats.avg_interests_per_subscriber.toFixed(2)}
                        />
                    </div>

                    {/* Top Features */}
                    <div className="mt-8">
                        <h2 className="text-xl font-semibold mb-4">{trans('admin.top_features')}</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left">
                                            {trans('admin.feature')}
                                        </th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left">
                                            {trans('admin.interests')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {topFeatures.map((feature, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap">{feature.feature}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{feature.interests}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* All Features */}
                    <div className="mt-8">
                        <h2 className="text-xl font-semibold mb-4">{trans('admin.feature_statistics')}</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left">
                                            {trans('admin.feature')}
                                        </th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left">
                                            {trans('admin.category')}
                                        </th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left">
                                            {trans('admin.interests')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {featureStats.map((stat, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap">{stat.feature}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{stat.category}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{stat.total_interests}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function StatCard({ title, value }: { title: string, value: string | number }) {
    return (
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    );
}
