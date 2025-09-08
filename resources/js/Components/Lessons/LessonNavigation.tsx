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
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between gap-2 overflow-hidden px-1">
                {/* Previous */}
                <div className="min-w-0 flex-1 basis-0">
                    {previous && (
                        <Link
                            href={`/lessons/${level}/${previous.lesson_number}`}
                            aria-label={`Go to previous lesson: ${previous.title}`}
                            className="group inline-flex max-w-full items-center text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                        >
                            <svg
                                className="mr-2 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400"
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
                            <span className="truncate block w-full">{previous.title}</span>
                        </Link>
                    )}
                </div>

                {/* Complete button */}
                <div className="shrink-0">
                    <button
                        onClick={onComplete}
                        disabled={isCompleted}
                        aria-label={isCompleted ? 'Lesson completed' : 'Mark lesson as complete'}
                        className={`inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
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

                {/* Next */}
                <div className="min-w-0 flex-1 basis-0 text-right">
                    {next && (
                        <Link
                            href={`/lessons/${level}/${next.lesson_number}`}
                            aria-label={`Go to next lesson: ${next.title}`}
                            className="group inline-flex max-w-full items-center justify-end text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                        >
                            <span className="truncate block w-full text-right">{next.title}</span>
                            <svg
                                className="ml-2 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400"
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
