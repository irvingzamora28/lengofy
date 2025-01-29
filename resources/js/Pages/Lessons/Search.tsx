import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
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
    languagePair: {
        code: string;
        source: string;
        target: string;
    };
}

export default function Search({ auth, query, results, languagePair }: Props) {
    const { data, setData, get } = useForm({
        query: query || '',
    });

    // Ref to track the latest get function
    const getRef = React.useRef(get);
    getRef.current = get;

    // Stable debounced search function using refs
    const debouncedSearchRef = React.useRef(
        debounce((query: string) => {
            console.log('Executing debounced search with query:', query);
            getRef.current(route('lessons.search', { query }), {
                preserveState: true,
                preserveScroll: true,
            });
        }, 300)
    );

    React.useEffect(() => {
        return () => {
            debouncedSearchRef.current.cancel();
        };
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        console.log('Search input value:', value);
        setData('query', value);
        debouncedSearchRef.current(value); // Use the stable debounced function
    };

    const formatLevelName = (name: string) => {
        return name.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                        Search Lessons
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {languagePair.source} → {languagePair.target}
                    </p>
                </div>
            }
        >
            <Head title="Search Lessons" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Search Input */}
                            <div className="mb-6">
                                <input
                                    type="text"
                                    value={data.query}
                                    onChange={handleSearch}
                                    placeholder="Search lessons..."
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-transparent dark:bg-gray-900 dark:text-gray-100"
                                />
                            </div>

                            {/* Search Results */}
                            {results.length > 0 ? (
                                <div className="space-y-4">
                                    {results.map((result, index) => (
                                        <Link
                                            key={index}
                                            href={route('lessons.show', {
                                                languagePair: result.language_pair,
                                                level: result.level,
                                                lesson: result.lesson,
                                            })}
                                            className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                                {result.title}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {formatLevelName(result.level)}
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
                            ) : data.query ? (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    No lessons found matching your search.
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    Enter a search term to find lessons.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
