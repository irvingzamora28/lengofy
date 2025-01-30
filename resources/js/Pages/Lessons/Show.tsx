import React, { useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import LessonViewer from '@/Components/Lessons/LessonViewer';
import LessonNavigation from '@/Components/Lessons/LessonNavigation';

interface NavigationItem {
    title: string;
    lesson_number: number;
}

interface Props extends PageProps {
    content: string;
    title: string;
    languagePairName: string;
    level: string;
    lesson_number: number;
    progress: {
        completed: boolean;
        completed_at: string | null;
    };
    navigation: {
        previous: NavigationItem | null;
        next: NavigationItem | null;
    };
}

export default function Show({
    content,
    title,
    languagePairName,
    level,
    lesson_number,
    progress,
    navigation
}: Props) {
    const formatLevelName = (name: string) => {
        return name.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    useEffect(() => {
        console.log("Navigation:", navigation);
    }, []);

    const handleComplete = () => {
        router.post(`/lessons/${level}/${lesson_number}/complete`, {}, {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="space-y-1">
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                        {languagePairName} - {formatLevelName(level)}
                    </h2>
                    <h3 className="text-lg text-gray-600 dark:text-gray-400">
                        {title}
                    </h3>
                </div>
            }
        >
            <Head title={`${title} - ${languagePairName}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <LessonViewer content={content} />

                            <LessonNavigation
                                previous={navigation.previous}
                                next={navigation.next}
                                level={level}
                                onComplete={handleComplete}
                                isCompleted={progress.completed}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
