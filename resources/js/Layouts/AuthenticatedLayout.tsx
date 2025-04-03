import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useEffect } from 'react';
import DarkModeToggle from '@/Components/UI/DarkModeToggle';
import { useDarkMode } from '@/Hooks/useDarkMode';
import { useTranslation } from 'react-i18next';
import { User } from '@/types';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import FeedbackButton from '@/Components/Feedback/FeedbackButton';

interface PageProps {
    auth: {
        user: User;
    };
    flash: {
        error?: string | null;
        success?: string | null;
    };
    [key: string]: any;
}

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth, flash } = usePage<PageProps>().props;
    const user = auth.user;
    const { t: trans } = useTranslation();

    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const { darkMode, setDarkMode } = useDarkMode();

    useEffect(() => {
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.success) {
            // Check if the success message is a feedback submission
            const successMessage = flash.success === 'feedback_submitted'
                ? trans('feedback.success')
                : flash.success;

            toast.success(successMessage, {
                duration: 4000, // Show toast for 4 seconds
                position: 'top-center',
                style: {
                    background: '#10B981',
                    color: '#fff',
                    fontWeight: 'bold',
                },
            });
        }
    }, [flash]);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <nav className="border-b border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href="/">
                                    <ApplicationLogo className="h-10 w-10 fill-current text-primary-500" />
                                </Link>
                            </div>

                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                >
                                    {trans('auth_layout.dashboard')}
                                </NavLink>
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center space-x-4">
                            <FeedbackButton user={user} />
                            <div className="relative ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                                            >
                                                {user.name}

                                                <svg
                                                    className="-me-0.5 ms-2 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link href={route('profile.edit')}>
                                            {trans('auth_layout.profile')}
                                        </Dropdown.Link>
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();

                                                const darkModeToggle = document.querySelector('[aria-label="Toggle Dark Mode"]') as HTMLButtonElement;
                                                if (darkModeToggle) {
                                                    darkModeToggle.click();
                                                }
                                            }}
                                            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                            <span>{darkMode ? trans('auth_layout.light_mode') : trans('auth_layout.dark_mode')}</span>
                                            <DarkModeToggle
                                                onToggle={(newMode) => {
                                                    setDarkMode(newMode);
                                                }}
                                            />
                                        </div>
                                        <Dropdown.Link
                                            href={user?.is_guest ? route('guest.logout') : route('logout')}
                                            method={user?.is_guest ? 'delete' : 'post'}
                                            as="button"
                                        >
                                            {user?.is_guest ? trans('auth_layout.logout_guest') : trans('auth_layout.logout')}
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <div className="mr-2">
                                <FeedbackButton user={user} isMobile={true} />
                            </div>
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none dark:text-gray-500 dark:hover:bg-gray-900 dark:hover:text-gray-400 dark:focus:bg-gray-900 dark:focus:text-gray-400"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        (showingNavigationDropdown ? 'block' : 'hidden') +
                        ' sm:hidden'
                    }
                >
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                        >
                            {trans('auth_layout.dashboard')}
                        </ResponsiveNavLink>
                    </div>

                    <div className="border-t border-gray-200 pb-1 pt-4 dark:border-gray-600">
                        <div className="px-4">
                            <div className="text-base font-medium text-gray-500 dark:text-gray-200">
                                {user.name}
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>
                                {trans('auth_layout.profile')}
                            </ResponsiveNavLink>
                            <div
                                            onClick={(e) => {
                                                e.stopPropagation();

                                                const darkModeToggle = document.querySelector('[aria-label="Toggle Dark Mode"]') as HTMLButtonElement;
                                                if (darkModeToggle) {
                                                    darkModeToggle.click();
                                                }
                                            }}
                                            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                            <span>{darkMode ? trans('auth_layout.light_mode') : trans('auth_layout.dark_mode')}</span>
                                            <DarkModeToggle
                                                onToggle={(newMode) => {
                                                    setDarkMode(newMode);
                                                }}
                                            />
                                        </div>
                            <ResponsiveNavLink
                                method={user?.is_guest ? 'delete' : 'post'}
                                href={user?.is_guest ? route('guest.logout') : route('logout')}
                                as="button"
                            >
                                {user?.is_guest ? trans('auth_layout.logout_guest') : trans('auth_layout.logout')}
                            </ResponsiveNavLink>

                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-white shadow dark:bg-gray-800">
                    <div className="mx-auto max-w-7xl px-2 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>
            <Toaster position="top-right" />
        </div>
    );
}
