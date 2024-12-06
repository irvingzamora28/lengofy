import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { motion } from 'framer-motion';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import DarkModeToggle from '@/Components/UI/DarkModeToggle';

export default function Guest({ children }: PropsWithChildren) {
    const { locale = 'en' } = usePage<PageProps>().props;

    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-100 pt-6 sm:justify-center sm:pt-0 dark:bg-gray-900">
            <motion.nav
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link href="/" className="flex items-center">
                                <ApplicationLogo className="h-10 w-10 fill-current text-primary-500" />
                                <span className="ml-2 text-2xl font-bold text-primary-500">Lengofy</span>
                            </Link>
                        </div>
                        <div className="flex items-center gap-6">
                            <LanguageSwitcher currentLocale={locale} />
                            <DarkModeToggle />
                            <Link
                                href={route('login')}
                                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-white font-semibold"
                            >
                                Login
                            </Link>
                            <Link
                                href={route('register')}
                                className="inline-flex items-center justify-center rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                            >
                                Sign up
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.nav>

            <div className="w-full">
                {children}
            </div>
        </div>
    );
}
