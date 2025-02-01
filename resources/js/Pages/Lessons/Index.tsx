import React, { useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import { PageProps } from "@/types";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    FiBook,
    FiCheck,
    FiChevronRight,
    FiAward,
    FiBookOpen,
} from "react-icons/fi";

interface Lesson {
    filename: string;
    path: string;
    title: string;
    lesson_number: number;
    level: string;
    topics: string[];
    completed: boolean;
}

interface Props extends PageProps {
    lessons: Lesson[];
}

export default function Index({ lessons }: Props) {
    // Group lessons by level
    const lessonsByLevel = lessons.reduce((acc, lesson) => {
        if (!acc[lesson.level]) {
            acc[lesson.level] = [];
        }
        acc[lesson.level].push(lesson);
        return acc;
    }, {} as Record<string, Lesson[]>);

    useEffect(() => {
        console.log("Lessons:", lessons);
    }, []);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2">
                    <FiBook className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                        Course Lessons
                    </h2>
                </div>
            }
        >
            <Head title="Lessons" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Levels stacked vertically */}
                    {Object.entries(lessonsByLevel).map(
                        ([level, levelLessons]) => (
                            <div key={level} className="mb-8">
                                {/* Level Header */}
                                <div className="flex items-center gap-2 mb-4">
                                    <FiAward className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                        {level}
                                    </h3>
                                </div>

                                {/* Lessons displayed in rows */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {levelLessons.map((lesson, index) => (
                                        <Link
                                            key={index}
                                            href={route("lessons.show", {
                                                level: lesson.level,
                                                lesson_number:
                                                    lesson.lesson_number,
                                            })}
                                            className="group block"
                                        >
                                            <div className="relative p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-200 hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-400">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                                                lesson.completed
                                                                    ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300" // Completed styles
                                                                    : "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300" // Incomplete styles
                                                            }`}
                                                        >
                                                            {lesson.completed ? (
                                                                <FiCheck className="w-4 h-4" />
                                                            ) : (
                                                                <FiBookOpen className="w-4 h-4" />
                                                            )}
                                                        </div>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                                            Lesson{" "}
                                                            {
                                                                lesson.lesson_number
                                                            }
                                                        </span>
                                                    </div>
                                                    <FiChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                                                </div>
                                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {lesson.title}
                                                </h4>
                                                {lesson.topics &&
                                                    lesson.topics.length >
                                                        0 && (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {lesson.topics.map(
                                                                (
                                                                    topic,
                                                                    topicIndex
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            topicIndex
                                                                        }
                                                                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                                                    >
                                                                        {topic}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
