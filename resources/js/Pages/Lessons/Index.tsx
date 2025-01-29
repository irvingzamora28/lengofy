import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface LessonMetadata {
    title: string;
    lessonNumber: number;
    level: string;
    topics: string[];
}

interface Lesson {
    filename: string;
    path: string;
    metadata: LessonMetadata;
}

interface Level {
    name: string;
    lessons: Lesson[];
}

interface LanguagePair {
    pair: string;
    levels: Level[];
}

interface Props extends PageProps {
    languagePairs: LanguagePair[];
}

export default function Index({ auth, languagePairs }: Props) {
    const formatLanguagePair = (pair: string) => {
        const [source, target] = pair.split('-');
        return `${source.toUpperCase()} → ${target.toUpperCase()}`;
    };

    const formatLevelName = (name: string) => {
        return name.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Lessons</h2>}
        >
            <Head title="Lessons" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {languagePairs.map((languagePair) => (
                        <div key={languagePair.pair} className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                            <div className="p-6">
                                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                                    {formatLanguagePair(languagePair.pair)}
                                </h2>
                                
                                <div className="space-y-6">
                                    {languagePair.levels.map((level) => (
                                        <div key={level.name} className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                                                {formatLevelName(level.name)}
                                            </h3>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {level.lessons.map((lesson) => (
                                                    <Link
                                                        key={lesson.path}
                                                        href={`/lessons/${languagePair.pair}/${level.name}/${lesson.path}`}
                                                        className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                    >
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                                            {lesson.metadata.title}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                            Lesson {lesson.metadata.lessonNumber}
                                                        </div>
                                                        {lesson.metadata.topics && (
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {lesson.metadata.topics.map((topic, index) => (
                                                                    <span
                                                                        key={index}
                                                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                                                                    >
                                                                        {topic}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
