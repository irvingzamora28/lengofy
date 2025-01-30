import React from 'react';
import { Link } from '@inertiajs/react';

interface NavigationItem {
    title: string;
    lesson_number: number;
}

interface LessonNavigationProps {
    previous: NavigationItem | null;
    next: NavigationItem | null;
    level: string;
    onComplete: () => void;
    isCompleted: boolean;
}

const LessonNavigation: React.FC<LessonNavigationProps> = ({
    previous,
    next,
    level,
    onComplete,
    isCompleted
}) => {
    return (
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    {previous && (
                        <Link
                            href={`/lessons/${level}/${previous.lesson_number}`}
                            className="group flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <svg
                                className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            {previous.title}
                        </Link>
                    )}
                </div>

                <div className="flex-1 text-center">
                    <button
                        onClick={onComplete}
                        disabled={isCompleted}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                            isCompleted
                                ? 'bg-green-600 text-white cursor-default'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        {isCompleted ? (
                            <>
                                <svg
                                    className="h-5 w-5 mr-2"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                Completed
                            </>
                        ) : (
                            'Mark as Complete'
                        )}
                    </button>
                </div>

                <div className="flex-1 text-right">
                    {next && (
                        <Link
                            href={`/lessons/${level}/${next.lesson_number}`}
                            className="group flex items-center justify-end text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            {next.title}
                            <svg
                                className="ml-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LessonNavigation;
