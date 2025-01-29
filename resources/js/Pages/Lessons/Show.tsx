import React from 'react';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import LessonViewer from '@/Components/Lessons/LessonViewer';
import LessonNavigation from '@/Components/Lessons/LessonNavigation';

interface NavigationItem {
    path: string;
    title: string;
}

interface Props extends PageProps {
    content: string;
    languagePair: string;
    level: string;
    lesson: string;
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
    auth, 
    content, 
    languagePair, 
    level, 
    lesson,
    progress,
    navigation 
}: Props) {
    const formatLanguagePair = (pair: string) => {
        const [source, target] = pair.split('-');
        return `${source.toUpperCase()} → ${target.toUpperCase()}`;
    };

    const formatLevelName = (name: string) => {
        return name.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    // Extract title from markdown frontmatter
    const titleMatch = content.match(/title:\s*"([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : 'Lesson';

    const handleComplete = () => {
        router.post(`/lessons/${languagePair}/${level}/${lesson}/complete`, {}, {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="space-y-1">
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                        {formatLanguagePair(languagePair)} - {formatLevelName(level)}
                    </h2>
                    <h3 className="text-lg text-gray-600 dark:text-gray-400">
                        {title}
                    </h3>
                </div>
            }
        >
            <Head title={`${title} - ${formatLanguagePair(languagePair)}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <LessonViewer content={content} />
                            
                            <LessonNavigation
                                previous={navigation.previous}
                                next={navigation.next}
                                languagePair={languagePair}
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
