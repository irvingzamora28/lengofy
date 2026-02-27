import React from "react";
import { Link } from "@inertiajs/react";
import { FiBook, FiChevronRight } from "react-icons/fi";
import { Lesson } from "@/types";


interface RecentLessonsProps {
    lessons: Lesson[];
}

export default function RecentLessons({ lessons }: RecentLessonsProps) {
    const firstFewLessons = (lessons ?? []).slice(0, 3);

    return (
        <div className="bg-gray-50 dark:bg-gray-900 shadow-sm sm:rounded-lg p-2 sm:p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FiBook className="w-5 h-5" />
                    Recent Lessons
                </h3>
                <Link
                    href="/lessons"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 text-sm"
                >
                    View All
                    <FiChevronRight className="w-4 h-4" />
                </Link>
            </div>
            <div className="space-y-2">
                {firstFewLessons.map((lesson, index) => (
                    <Link
                        key={index}
                        href={route("lessons.show", {
                            level: lesson.level,
                            lesson_number:
                                lesson.lesson_number,
                        })}
                        className="block p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                    {lesson.title}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Level: {lesson.level}
                                </p>
                            </div>
                            <FiChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
