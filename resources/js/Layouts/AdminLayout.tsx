import { PropsWithChildren } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

export default function AdminLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<PageProps>().props;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="shrink-0 flex items-center">
                                <Link href={route('admin.feature-analytics')}>
                                    <span className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                        Lengofy Admin
                                    </span>
                                </Link>
                            </div>

                            <div className="hidden space-x-8 sm:-my-px sm:ml-10 sm:flex">
                                <Link
                                    href={route('admin.feature-analytics')}
                                    className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none"
                                >
                                    Analytics
                                </Link>
                            </div>
                        </div>

                        <div className="hidden sm:flex sm:items-center sm:ml-6">
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

            <main className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
