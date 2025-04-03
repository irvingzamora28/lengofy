import { PropsWithChildren, useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { FiMenu, FiX, FiBarChart2, FiUsers, FiPieChart, FiChevronDown, FiChevronRight, FiMessageSquare } from 'react-icons/fi';

export default function AdminLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<PageProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [analyticsOpen, setAnalyticsOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };

        // Set initial state
        handleResize();

        // Add event listener
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const toggleAnalytics = () => {
        setAnalyticsOpen(!analyticsOpen);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
            {/* Top navigation */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 z-10">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <button
                                onClick={toggleSidebar}
                                className="p-2 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                {sidebarOpen && isMobile ? <FiX size={24} /> : <FiMenu size={24} />}
                            </button>
                            <div className="ml-4 shrink-0 flex items-center">
                                <Link href={route('admin.feature-analytics')}>
                                    <span className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                        Lengofy Admin
                                    </span>
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <div className="ml-3 relative">
                                <Link
                                    href={route('admin.logout')}
                                    method="post"
                                    as="button"
                                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    Logout
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside 
                    className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                    fixed md:relative md:translate-x-0 z-20 md:z-0 w-64 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
                    transition-transform duration-300 ease-in-out overflow-y-auto`}
                >
                    <div className="p-4">
                        <nav className="space-y-1">
                            {/* Analytics Dropdown */}
                            <div>
                                <button
                                    onClick={toggleAnalytics}
                                    className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 group"
                                >
                                    <div className="flex items-center">
                                        <FiBarChart2 className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                                        <span>Analytics</span>
                                    </div>
                                    {analyticsOpen ? <FiChevronDown className="h-4 w-4" /> : <FiChevronRight className="h-4 w-4" />}
                                </button>
                                {analyticsOpen && (
                                    <div className="pl-10 space-y-1">
                                        <Link
                                            href={route('admin.feature-analytics')}
                                            className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <FiPieChart className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                                            Feature Analytics
                                        </Link>
                                        <Link
                                            href={route('admin.page-analytics')}
                                            className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <FiBarChart2 className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                                            Page Analytics
                                        </Link>
                                        <Link
                                            href={route('admin.feedback-analytics')}
                                            className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <FiMessageSquare className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                                            Feedback Analytics
                                        </Link>
                                    </div>
                                )}
                            </div>
                            
                            {/* Users */}
                            <Link
                                href={route('admin.users')}
                                className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <FiUsers className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                                Users
                            </Link>
                        </nav>
                    </div>
                </aside>

                {/* Main content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {/* Overlay for mobile */}
                    {sidebarOpen && isMobile && (
                        <div 
                            className="fixed inset-0 bg-gray-600 bg-opacity-50 z-10"
                            onClick={toggleSidebar}
                        ></div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
}
