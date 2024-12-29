import React, { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import i18n from 'i18next';

const languageData = {
    en: {
        flag: '🇬🇧',
        name: 'English',
        fullName: 'English (United States)'
    },
    es: {
        flag: '🇪🇸',
        name: 'Español',
        fullName: 'Español (España)'
    },
    de: {
        flag: '🇩🇪',
        name: 'Deutsch',
        fullName: 'Deutsch (Deutschland)'
    },
};

interface LanguageSwitcherProps {
    currentLocale: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentLocale }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const switchLanguage = (newLocale: string) => {
        router.post(route('language.switch'), { locale: newLocale }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsOpen(false);
                i18n.changeLanguage(newLocale);
                localStorage.setItem('I18N_LANGUAGE', newLocale); // Save selected language to localStorage
            }
        });
    };

    const availableLocales = Object.keys(languageData).filter(locale => locale !== currentLocale);

    return (
        <div
            ref={dropdownRef}
            className="relative inline-block text-left w-full sm:w-auto"
        >
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`inline-flex justify-center items-center w-full bg-white/0 dark:bg-white/0 sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-lg`}
                >
                    <span className="text-2xl mr-2">{languageData[currentLocale].flag}</span>
                    <span className="hidden sm:inline">{languageData[currentLocale].name}</span>
                    <svg
                        className="-mr-1 ml-2 h-5 w-5 transform transition-transform"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.1 }}
                        className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                    >
                        <div className="py-1" role="menu" aria-orientation="vertical">
                            {availableLocales.map((locale) => (
                                <button
                                    key={locale}
                                    onClick={() => switchLanguage(locale)}
                                    className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none first:rounded-t-xl last:rounded-b-xl"
                                    role="menuitem"
                                >
                                    <span className="text-2xl mr-3">{languageData[locale].flag}</span>
                                    <div className="flex flex-col items-start">
                                        <span>{languageData[locale].name}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {languageData[locale].fullName}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LanguageSwitcher;
