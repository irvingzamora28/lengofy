import React from 'react';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Progress } from '@/Components/Progress';

interface LevelProgress {
    level: string;
    completed_count: number;
    total_count: number;
    last_completed_at: string | null;
}

interface Props extends PageProps {
    progress: {
        overall: {
            completed: number;
            total: number;
            percentage: number;
        };
        byLevel: LevelProgress[];
        languagePair: {
            code: string;
            source: string;
            target: string;
        };
    };
}

export default function LessonProgress({ auth, progress }: Props) {
    const formatLevelName = (name: string) => {
        return name.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div>
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                        Learning Progress
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {progress.languagePair.source} → {progress.languagePair.target}
                    </p>
                </div>
            }
        >
            <Head title="Learning Progress" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Overall Progress */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Overall Progress
                            </h3>
                            <div className="mb-4">
                                <Progress
                                    value={progress.overall.percentage}
                                    className="w-full h-4"
                                />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {progress.overall.completed} of {progress.overall.total} lessons completed ({progress.overall.percentage}%)
                            </p>
                        </div>
                    </div>

                    {/* Progress by Level */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Progress by Level
                            </h3>
                            <div className="space-y-6">
                                {progress.byLevel.map((level) => (
                                    <div key={level.level} className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <h4 className="text-base font-medium text-gray-900 dark:text-gray-100">
                                                {formatLevelName(level.level)}
                                            </h4>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {level.completed_count} / {level.total_count}
                                            </span>
                                        </div>
                                        <Progress
                                            value={(level.completed_count / level.total_count) * 100}
                                            className="w-full h-2"
                                        />
                                        {level.last_completed_at && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                Last completed: {new Date(level.last_completed_at).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
