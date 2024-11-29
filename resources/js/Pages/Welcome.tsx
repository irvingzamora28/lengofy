import { Link, Head, useForm } from '@inertiajs/react';

export default function Welcome() {
    const { post, processing } = useForm({});

    const handleGuestPlay = () => {
        post(route('guest.create'));
    };

    return (
        <>
            <Head title="Welcome to Lengofy" />
            <div className="relative min-h-screen bg-dots-darker bg-center bg-gray-100 dark:bg-dots-lighter dark:bg-gray-900 selection:bg-red-500 selection:text-white">
                <div className="max-w-7xl mx-auto p-6 lg:p-8">
                    <div className="flex flex-col items-center justify-center pt-16">
                        <h1 className="text-6xl font-bold text-gray-900 dark:text-white">
                            Lengofy
                        </h1>
                        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
                            Master languages through multiplayer games
                        </p>
                    </div>

                    <div className="mt-16 flex flex-col items-center gap-6">
                        <button
                            onClick={handleGuestPlay}
                            disabled={processing}
                            className="px-8 py-4 bg-red-500 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-red-600 transition-colors w-64 text-center disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Creating Guest Account...' : 'Play as Guest'}
                        </button>

                        <Link
                            href={route('register')}
                            className="px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-lg shadow-lg hover:bg-gray-50 transition-colors w-64 text-center border-2 border-gray-200"
                        >
                            Create Account
                        </Link>

                        <Link
                            href={route('login')}
                            className="px-8 py-4 text-gray-600 text-lg font-semibold hover:text-gray-900 transition-colors w-64 text-center"
                        >
                            Already have an account? Log in
                        </Link>
                    </div>

                    <div className="mt-16">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                            <div className="scale-100 p-6 bg-white dark:bg-gray-800/50 dark:bg-gradient-to-bl from-gray-700/50 via-transparent dark:ring-1 dark:ring-inset dark:ring-white/5 rounded-lg shadow-2xl shadow-gray-500/20 dark:shadow-none flex motion-safe:hover:scale-[1.01] transition-all duration-250">
                                <div>
                                    <h2 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
                                        Learn German
                                    </h2>
                                    <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                                        Master German noun genders through fun and interactive games.
                                        Play with friends and compete to see who can learn the fastest!
                                    </p>
                                </div>
                            </div>

                            <div className="scale-100 p-6 bg-white dark:bg-gray-800/50 dark:bg-gradient-to-bl from-gray-700/50 via-transparent dark:ring-1 dark:ring-inset dark:ring-white/5 rounded-lg shadow-2xl shadow-gray-500/20 dark:shadow-none flex motion-safe:hover:scale-[1.01] transition-all duration-250">
                                <div>
                                    <h2 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
                                        Real-time Multiplayer
                                    </h2>
                                    <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                                        Join a game room and play with friends in real-time.
                                        Challenge each other and track your progress as you learn.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
