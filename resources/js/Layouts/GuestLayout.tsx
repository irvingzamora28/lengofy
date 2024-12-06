import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { FaMoon, FaSun } from 'react-icons/fa';

export default function Guest({ children }: PropsWithChildren) {
    const { locale = 'en' } = usePage<PageProps>().props;

    const [darkMode, setDarkMode] = useState(() => {
        // Check localStorage first
        const savedDarkMode = localStorage.getItem('darkMode');

        // If explicitly set in localStorage, use that value
        if (savedDarkMode !== null) {
            return savedDarkMode === 'true';
        }

        // Otherwise, use system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        // Apply dark mode class to html element
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
        }
    }, [darkMode]);

    const toggleDarkMode = () => {
        setDarkMode(prevMode => !prevMode);
    };

    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-100 pt-6 sm:justify-center sm:pt-0 dark:bg-gray-900">
            <div>
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
                            <button
                                onClick={toggleDarkMode}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
                                aria-label="Toggle Dark Mode"
                            >
                                {darkMode ? (
                                    <FaMoon className="w-6 h-6" />
                                ) : (
                                    <FaSun className="w-6 h-6" />
                                )}
                            </button>
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
            </div>

            <div className="w-full">
                {children}
            </div>
        </div>
    );
}
