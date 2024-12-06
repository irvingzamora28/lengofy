import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import DarkModeToggle from '@/Components/UI/DarkModeToggle';
import { FaBars, FaTimes } from 'react-icons/fa';

export default function Guest({ children }: PropsWithChildren) {
    const { locale = 'en' } = usePage<PageProps>().props;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <div className="flex min-h-screen flex-col bg-gray-100 pt-16 dark:bg-gray-900">
            <motion.nav
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Link href="/" className="flex items-center">
                                <ApplicationLogo className="h-10 w-10 fill-current text-primary-500" />
                                <span className="ml-2 text-2xl font-bold text-primary-500 hidden sm:block">Lengofy</span>
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden sm:flex items-center gap-6">
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

                        {/* Mobile Navigation */}
                        <div className="flex items-center gap-2">
                            {/* Always visible Login button on mobile */}
                            <Link
                                href={route('login')}
                                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-white font-semibold sm:hidden mr-2"
                            >
                                Login
                            </Link>

                            {/* Mobile Menu Toggle */}
                            <div className="sm:hidden flex items-center">
                                <button
                                    onClick={toggleMobileMenu}
                                    className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-white focus:outline-none"
                                    aria-label="Toggle mobile menu"
                                >
                                    {isMobileMenuOpen ? (
                                        <FaTimes className="w-6 h-6" />
                                    ) : (
                                        <FaBars className="w-6 h-6" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="sm:hidden fixed top-16 left-0 right-0 z-40 bg-white dark:bg-gray-800 shadow-lg"
                    >
                        <div className="px-4 pt-2 pb-3 space-y-1">
                            <div className="flex flex-col items-center gap-4 py-4">
                                <LanguageSwitcher currentLocale={locale} />
                                <DarkModeToggle />
                                <Link
                                    href={route('register')}
                                    className="w-full text-center rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Sign up
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full">
                {children}
            </div>
        </div>
    );
}
