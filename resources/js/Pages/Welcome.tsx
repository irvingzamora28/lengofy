import { Link, Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import GuestLanguageModal from '@/Components/GuestLanguageModal';

export default function Welcome() {
    const { languagePairs } = usePage<PageProps>().props;
    const [showLanguageModal, setShowLanguageModal] = useState(false);

    const handleGuestPlay = () => {
        setShowLanguageModal(true);
    };

    return (
        <>
            <Head title="Welcome to Lengofy" />
            <div className="relative min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                {/* Hero Section */}
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                        <div className="pt-20 pb-16 text-center lg:pt-32">
                            <div className="mx-auto max-w-7xl">
                                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl md:text-7xl">
                                    Learn Languages
                                    <span className="block text-red-600">Through Social Gaming</span>
                                </h1>
                                <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
                                    Join a community of language learners who master new languages by playing interactive games together. 
                                    Challenge friends, track progress, and make learning fun!
                                </p>
                                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                                    <button
                                        onClick={handleGuestPlay}
                                        className="group relative inline-flex items-center justify-center rounded-full bg-red-600 px-8 py-4 text-lg font-semibold text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all w-64 sm:w-auto overflow-hidden"
                                    >
                                        <span className="absolute inset-y-0 left-0 w-[2px] bg-red-400 transition-all group-hover:w-full"></span>
                                        <span className="relative">Try Gender Duel Now</span>
                                    </button>
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm px-8 py-4 text-lg font-semibold text-gray-900 ring-1 ring-gray-900/10 hover:ring-gray-900/20 dark:text-white dark:ring-white/10 dark:hover:ring-white/20 transition-all w-64 sm:w-auto"
                                    >
                                        Join Our Community
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Proof */}
                <div className="border-y border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                            <div className="flex flex-col items-center">
                                <div className="text-4xl font-bold text-red-600">10k+</div>
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">Active Learners</div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-4xl font-bold text-red-600">50k+</div>
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">Games Played</div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-4xl font-bold text-red-600">15+</div>
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">Language Games</div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-4xl font-bold text-red-600">4.9/5</div>
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">User Rating</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="py-24 sm:py-32">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                                Why Learn with Lengofy?
                            </h2>
                            <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-300">
                                Experience a new way of language learning that's social, interactive, and actually fun
                            </p>
                        </div>
                        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                                <div className="flex flex-col">
                                    <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900 dark:text-white">
                                        <div className="rounded-lg bg-red-600/10 p-2 ring-1 ring-inset ring-red-600/20">
                                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        Social Learning
                                    </dt>
                                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                                        <p className="flex-auto">Learn together with friends or meet new language partners. Challenge each other and grow together.</p>
                                    </dd>
                                </div>
                                <div className="flex flex-col">
                                    <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900 dark:text-white">
                                        <div className="rounded-lg bg-red-600/10 p-2 ring-1 ring-inset ring-red-600/20">
                                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        Interactive Games
                                    </dt>
                                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                                        <p className="flex-auto">Engage in fun, competitive games designed to reinforce language concepts naturally.</p>
                                    </dd>
                                </div>
                                <div className="flex flex-col">
                                    <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900 dark:text-white">
                                        <div className="rounded-lg bg-red-600/10 p-2 ring-1 ring-inset ring-red-600/20">
                                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path fillRule="evenodd" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                            </svg>
                                        </div>
                                        Track Progress
                                    </dt>
                                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                                        <p className="flex-auto">Monitor your improvement, earn achievements, and compete on leaderboards.</p>
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Featured Game Section */}
                <div className="relative isolate overflow-hidden bg-gray-900 py-24 sm:py-32">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl lg:mx-0">
                            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">Gender Duel</h2>
                            <p className="mt-6 text-lg leading-8 text-gray-300">
                                Master German noun genders through an exciting multiplayer game. Challenge friends to a duel and see who can master der, die, das the fastest!
                            </p>
                        </div>
                        <div className="mx-auto mt-10 max-w-2xl lg:mx-0 lg:max-w-none">
                            <div className="grid grid-cols-1 gap-x-8 gap-y-6 text-base font-semibold leading-7 text-white sm:grid-cols-2 md:flex lg:gap-x-10">
                                <div className="flex items-center">
                                    <svg className="h-5 w-5 flex-none text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="ml-2">Real-time battles</span>
                                </div>
                                <div className="flex items-center">
                                    <svg className="h-5 w-5 flex-none text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="ml-2">Instant feedback</span>
                                </div>
                                <div className="flex items-center">
                                    <svg className="h-5 w-5 flex-none text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="ml-2">Competitive scoring</span>
                                </div>
                                <div className="flex items-center">
                                    <svg className="h-5 w-5 flex-none text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="ml-2">Daily challenges</span>
                                </div>
                            </div>
                            <div className="mt-10 flex items-center gap-x-6">
                                <button
                                    onClick={handleGuestPlay}
                                    className="rounded-md bg-red-500 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
                                >
                                    Try it Now
                                </button>
                                <Link
                                    href={route('register')}
                                    className="text-lg font-semibold leading-6 text-white"
                                >
                                    Learn more <span aria-hidden="true">→</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Community Section */}
                <div className="py-24 sm:py-32">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                                Join Our Growing Community
                            </h2>
                            <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-300">
                                Connect with language learners from around the world
                            </p>
                        </div>
                        <div className="mx-auto mt-12 max-w-2xl sm:mt-16 lg:mt-20">
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {/* Testimonial cards would go here */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final CTA */}
                <div className="relative isolate overflow-hidden bg-red-500">
                    <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                Ready to Start Learning?
                            </h2>
                            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-red-100">
                                Join thousands of learners who are already mastering languages through play.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <button
                                    onClick={handleGuestPlay}
                                    className="rounded-md bg-white px-6 py-3 text-lg font-semibold text-red-600 shadow-sm hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                >
                                    Try Gender Duel
                                </button>
                                <Link
                                    href={route('register')}
                                    className="text-lg font-semibold leading-6 text-white"
                                >
                                    Create Free Account <span aria-hidden="true">→</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                    <svg
                        viewBox="0 0 1024 1024"
                        className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]"
                        aria-hidden="true"
                    >
                        <circle cx="512" cy="512" r="512" fill="url(#gradient)" fillOpacity="0.7" />
                        <defs>
                            <radialGradient id="gradient">
                                <stop stopColor="#7775D6" />
                                <stop offset="1" stopColor="#E935C1" />
                            </radialGradient>
                        </defs>
                    </svg>
                </div>
            </div>

            <GuestLanguageModal
                show={showLanguageModal}
                onClose={() => setShowLanguageModal(false)}
                languagePairs={languagePairs}
            />
        </>
    );
}
