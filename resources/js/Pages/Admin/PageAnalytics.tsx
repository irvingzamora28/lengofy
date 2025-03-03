import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface DailyData {
    date: string;
    count: number;
}

interface PageViewsData {
    total: number;
    change: number;
    dailyData: DailyData[];
}

interface VisitorsData {
    total: number;
    change: number;
    dailyData: DailyData[];
}

interface TopPage {
    path: string;
    visitors: number;
}

interface Referrer {
    source: string;
    visitors: number;
}

interface LogStatus {
    accessible: boolean;
    path: string;
    message: string;
    using_fallback: boolean;
}

interface PageAnalyticsProps {
    pageViews: PageViewsData;
    visitors: VisitorsData;
    topPages: TopPage[];
    referrers: Referrer[];
    logStatus: LogStatus;
}

export default function PageAnalytics({ pageViews, visitors, topPages, referrers, logStatus }: PageAnalyticsProps) {
    const chartRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (chartRef.current) {
            // Destroy existing chart if it exists
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                chartInstance.current = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: visitors.dailyData.map(item => item.date),
                        datasets: [
                            {
                                label: 'Visitors',
                                data: visitors.dailyData.map(item => item.count),
                                borderColor: '#3b82f6',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                tension: 0.3,
                                fill: true,
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    precision: 0
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            }
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [visitors]);

    return (
        <AdminLayout>
            <Head title="Page Analytics" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Page Analytics</h1>
                
                {/* Log Status Banner */}
                {logStatus.using_fallback && (
                    <div className={`p-4 mb-4 rounded-lg ${logStatus.accessible ? 'bg-blue-50 dark:bg-blue-900' : 'bg-yellow-50 dark:bg-yellow-900'}`}>
                        <div className="flex items-center">
                            <div className={`flex-shrink-0 inline-flex items-center justify-center rounded-full p-1 ${logStatus.accessible ? 'bg-blue-100 dark:bg-blue-800' : 'bg-yellow-100 dark:bg-yellow-800'}`}>
                                <svg className={`w-4 h-4 ${logStatus.accessible ? 'text-blue-600 dark:text-blue-300' : 'text-yellow-600 dark:text-yellow-300'}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className={`text-sm font-medium ${logStatus.accessible ? 'text-blue-800 dark:text-blue-300' : 'text-yellow-800 dark:text-yellow-300'}`}>
                                    {logStatus.accessible ? 'Information' : 'Warning'}
                                </h3>
                                <div className={`mt-1 text-sm ${logStatus.accessible ? 'text-blue-700 dark:text-blue-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                                    <p>{logStatus.message}</p>
                                    <p className="mt-1"><strong>Path:</strong> {logStatus.path}</p>
                                    {logStatus.using_fallback && <p className="mt-1">Using fallback data for demonstration.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Visitors Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="p-5">
                            <div className="flex justify-between items-center">
                                <h2 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Visitors</h2>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${visitors.change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {visitors.change >= 0 ? '+' : ''}{visitors.change}%
                                </span>
                            </div>
                            <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{visitors.total}</p>
                        </div>
                        <div className="h-64 p-5 pt-0">
                            <canvas ref={chartRef} className="w-full h-full"></canvas>
                        </div>
                    </div>

                    {/* Page Views Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="p-5">
                            <div className="flex justify-between items-center">
                                <h2 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Page Views</h2>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${pageViews.change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {pageViews.change >= 0 ? '+' : ''}{pageViews.change}%
                                </span>
                            </div>
                            <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{pageViews.total}</p>
                        </div>
                        <div className="p-5">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Top Pages */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Top Pages</h3>
                                    <ul className="space-y-2">
                                        {topPages.slice(0, 5).map((page, index) => (
                                            <li key={index} className="flex justify-between items-center">
                                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate" title={page.path}>
                                                    {page.path}
                                                </span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{page.visitors}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                {/* Referrers */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Referrers</h3>
                                    <ul className="space-y-2">
                                        {referrers.map((referrer, index) => (
                                            <li key={index} className="flex justify-between items-center">
                                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate" title={referrer.source}>
                                                    {referrer.source}
                                                </span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{referrer.visitors}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* All Pages Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="p-5">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">All Pages</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Page
                                        </th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Visitors
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {topPages.map((page, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {page.path}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                                                {page.visitors}
                                            </td>
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
