import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FiArrowLeft, FiUser, FiBook, FiAward } from 'react-icons/fi';

interface Language {
    id: number;
    code: string;
    name: string;
}

interface LanguagePair {
    id: number;
    sourceLanguage: Language;
    targetLanguage: Language;
}

interface LessonProgress {
    id: number;
    user_id: number;
    lesson_id: number;
    progress: number;
    completed: boolean;
    last_accessed_at: string;
    lesson: {
        id: number;
        title: string;
        slug: string;
    };
}

interface Score {
    id: number;
    user_id: number;
    game_id: number;
    highest_score: number;
    total_points: number;
    winning_streak: number;
    created_at: string;
    updated_at: string;
    game: {
        id: number;
        name: string;
    };
}

interface User {
    id: number;
    name: string;
    email: string;
    is_guest: boolean;
    created_at: string;
    updated_at: string;
    language_pair_id: number | null;
    languagePair: LanguagePair | null;
    lessonProgress: LessonProgress[];
    scores: Score[];
}

interface UserDetailProps {
    user: User;
}

export default function UserDetail({ user }: UserDetailProps) {
    return (
        <AdminLayout>
            <Head title={`User: ${user.name}`} />

            <div className="space-y-6">
                <div className="flex items-center">
                    <Link
                        href={route('admin.users')}
                        className="mr-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        <FiArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Details</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* User Info Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-blue-500 rounded-full p-3">
                                    <FiUser className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user.name}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                </div>
                            </div>
                            
                            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                                <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                                    <div className="py-3 flex justify-between">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">User Type</dt>
                                        <dd className="text-sm text-gray-900 dark:text-white">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.is_guest ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                                {user.is_guest ? 'Guest' : 'Registered'}
                                            </span>
                                        </dd>
                                    </div>
                                    <div className="py-3 flex justify-between">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Joined</dt>
                                        <dd className="text-sm text-gray-900 dark:text-white">{new Date(user.created_at).toLocaleDateString()}</dd>
                                    </div>
                                    <div className="py-3 flex justify-between">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
                                        <dd className="text-sm text-gray-900 dark:text-white">{new Date(user.updated_at).toLocaleDateString()}</dd>
                                    </div>
                                    <div className="py-3 flex justify-between">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Language Pair</dt>
                                        <dd className="text-sm text-gray-900 dark:text-white">
                                            {user.languagePair ? (
                                                <span>
                                                    {user.languagePair.sourceLanguage.name} → {user.languagePair.targetLanguage.name}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 dark:text-gray-500">None</span>
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>

                    {/* Lesson Progress Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-green-500 rounded-full p-3">
                                    <FiBook className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lesson Progress</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {user.lessonProgress.length} {user.lessonProgress.length === 1 ? 'lesson' : 'lessons'} accessed
                                    </p>
                                </div>
                            </div>
                            
                            <div className="mt-6">
                                {user.lessonProgress.length > 0 ? (
                                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {user.lessonProgress.slice(0, 5).map((progress) => (
                                            <li key={progress.id} className="py-3">
                                                <div className="flex justify-between">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{progress.lesson.title}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {progress.completed ? 'Completed' : `${Math.round(progress.progress * 100)}%`}
                                                    </p>
                                                </div>
                                                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full ${progress.completed ? 'bg-green-500' : 'bg-blue-500'}`} 
                                                        style={{ width: `${Math.round(progress.progress * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    Last accessed: {new Date(progress.last_accessed_at).toLocaleDateString()}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500 dark:text-gray-400">No lessons accessed yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Game Scores Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-purple-500 rounded-full p-3">
                                    <FiAward className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Game Scores</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {user.scores.length} {user.scores.length === 1 ? 'game' : 'games'} played
                                    </p>
                                </div>
                            </div>
                            
                            <div className="mt-6">
                                {user.scores.length > 0 ? (
                                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {user.scores.map((score) => (
                                            <li key={score.id} className="py-3">
                                                <div className="flex justify-between">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{score.game.name}</p>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{score.highest_score}</p>
                                                </div>
                                                <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                                    <span>Total Points: {score.total_points}</span>
                                                    <span>Winning Streak: {score.winning_streak}</span>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    Last played: {new Date(score.updated_at).toLocaleDateString()}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500 dark:text-gray-400">No games played yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
