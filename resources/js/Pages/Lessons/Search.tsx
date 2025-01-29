import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { debounce } from 'lodash';

interface SearchResult {
    language_pair: string;
    level: string;
    lesson: string;
    title: string;
    topics: string[];
}

interface Props extends PageProps {
    query: string;
    results: SearchResult[];
}

export default function Search({ auth, query, results }: Props) {
    const formatLanguagePair = (pair: string) => {
        const [source, target] = pair.split('-');
        return `${source.toUpperCase()} → ${target.toUpperCase()}`;
    };

    const formatLevelName = (name: string) => {
        return name.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const handleSearch = debounce((searchQuery: string) => {
        router.get('/lessons/search', { query: searchQuery }, {
            preserveState: true,
            preserveScroll: true,
        });
    }, 300);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Search Lessons</h2>}
        >
            <Head title="Search Lessons" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="mb-6">
                                <input
                                    type="text"
                                    placeholder="Search lessons..."
                                    defaultValue={query}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>

                            {results.length > 0 ? (
                                <div className="space-y-4">
                                    {results.map((result, index) => (
                                        <Link
                                            key={index}
                                            href={`/lessons/${result.language_pair}/${result.level}/${result.lesson}`}
                                            className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                                        {result.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        {formatLanguagePair(result.language_pair)} - {formatLevelName(result.level)}
                                                    </p>
                                                </div>
                                            </div>
                                            {result.topics && result.topics.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {result.topics.map((topic, topicIndex) => (
                                                        <span
                                                            key={topicIndex}
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
                            ) : query ? (
                                <div className="text-center text-gray-600 dark:text-gray-400 py-8">
                                    No lessons found matching your search.
                                </div>
                            ) : (
                                <div className="text-center text-gray-600 dark:text-gray-400 py-8">
                                    Start typing to search for lessons.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
