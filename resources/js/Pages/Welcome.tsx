import { Link, Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GuestLanguageModal from '@/Components/GuestLanguageModal';
import GuestLayout from '@/Layouts/GuestLayout';
import { PageProps } from '@/types';
import {
    FaUserFriends,
    FaCheckCircle,
    FaArrowRight
} from 'react-icons/fa';
import { MdGroups, MdOndemandVideo } from 'react-icons/md';

export default function Welcome() {
    const {
        languagePairs,
        translations,
        locale = 'en'
    } = usePage<PageProps>().props;

    const [showLanguageModal, setShowLanguageModal] = useState(false);

    // Define language cycling arrays based on locale
    const languageWords = (() => {
        switch (locale) {
            case 'en':
                return ["Languages", "Spanish", "English", "German"];
            case 'es':
                return ["Idiomas", "Español", "Inglés", "Alemán"];
            case 'de':
                return ["Sprachen", "Spanisch", "Englisch", "Deutsch"];
            default:
                return ["Languages", "Spanish", "English", "German"];
        }
    })();

    // Extract the heroTitle and split "Learn" + last word
    const heroTitle = translations.welcome.heroTitle || 'Learn Languages';
    const [firstPart, ...restParts] = heroTitle.split(' ');
    const staticPart = firstPart; // "Learn"
    // The last part "Languages" will be replaced by the animated words
    // In case heroTitle has more than two words, we handle accordingly:
    const otherStaticParts = restParts.slice(0, restParts.length - 1).join(' ');
    const initialWord = restParts[restParts.length - 1] || '';

    // If there's a middle part, rejoin it so we get "Learn (something) <AnimatedWord>"
    const prefix = otherStaticParts ? `${staticPart} ${otherStaticParts}` : staticPart;

    // State for cycling words
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % languageWords.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [languageWords.length]);

    const handleGuestPlay = () => {
        setShowLanguageModal(true);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    const buttonVariants = {
        hover: {
            scale: 1.05,
            transition: { duration: 0.2 }
        },
        tap: { scale: 0.95 }
    };

    const wordVariants = {
        enter: { opacity: 0, y: 20 },
        center: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
    };

    return (
        <GuestLayout>
            <Head title={translations.welcome.title} />

            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="relative min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
            >
                {/* Hero Section */}
                <section className="relative flex-1 flex flex-col justify-center overflow-hidden
                    dark:bg-gray-900 bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-gray-800
                    pt-32 pb-20 lg:pt-48 lg:pb-48">
                    {/* Decorative animated gradient behind hero */}
                    <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 0.7, scale: 1 }}
                            transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse' }}
                            className="w-[600px] h-[600px] rounded-full bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 blur-3xl"
                        ></motion.div>
                    </div>

                    {/* Floating subtle shapes */}
                    <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 100, opacity: 0.4 }}
                        transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror' }}
                        className="absolute top-10 left-[-50px] w-32 h-32 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 blur-xl opacity-40"
                    ></motion.div>
                    <motion.div
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: -100, opacity: 0.4 }}
                        transition={{ duration: 10, repeat: Infinity, repeatType: 'mirror' }}
                        className="absolute bottom-10 right-[-50px] w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-500 blur-xl opacity-40"
                    ></motion.div>

                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-4xl font-extrabold tracking-tight text-primary-600 dark:text-white sm:text-6xl md:text-9xl font-display"
                        >
                            {prefix}{prefix && ' '}
                            <span className="inline-block relative w-[200px] md:w-[300px]">
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={languageWords[currentIndex]}
                                        variants={wordVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ duration: 0.5 }}
                                        className="absolute left-0 right-0 -bottom-2 md:-bottom-5"
                                    >
                                        {languageWords[currentIndex]}
                                    </motion.span>
                                </AnimatePresence>
                            </span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className="mx-auto mt-6 max-w-2xl text-xl md:text-4xl leading-8 text-gray-600 dark:text-gray-300 font-sans"
                        >
                            {translations.welcome.heroSubtitle}
                        </motion.p>
                        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <motion.button
                                whileHover="hover"
                                whileTap="tap"
                                variants={buttonVariants}
                                onClick={handleGuestPlay}
                                className="group relative inline-flex items-center justify-center rounded-full bg-primary-600 px-8 py-4 md:py-12 text-2xl md:text-3xl font-semibold text-white hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all w-80 md:w-96 sm:w-auto overflow-hidden"
                            >
                                <span className="absolute inset-y-0 -left-1 w-[2px] bg-primary-400 transition-all group-hover:w-full"></span>
                                <span className="relative">{translations.welcome.playNowButton}</span>
                            </motion.button>
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Link
                                    href={route('register')}
                                    className="inline-flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm mt-4 md:mt-0 md:ml-20 px-8 py-4 md:py-12 text-2xl md:text-3xl font-semibold text-primary-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 dark:text-white dark:ring-white/10 dark:hover:ring-white/20 transition-all w-80 md:w-96 sm:w-auto"
                                >
                                    {translations.welcome.learnMoreButton}
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Social Proof */}
                <motion.section
                    variants={itemVariants}
                    className="border-y border-gray-200 dark:border-gray-700
                    bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800
                    text-gray-900 dark:text-gray-100 relative"
                >
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                            <div className="flex flex-col items-center">
                                <div className="text-4xl md:text-6xl font-bold text-primary-500">2000+</div>
                                <div className="mt-2 text-sm md:text-xl">{translations.welcome.stats1}</div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-4xl md:text-6xl font-bold text-primary-500">10</div>
                                <div className="mt-2 text-sm md:text-xl">{translations.welcome.stats2}</div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-4xl md:text-6xl font-bold text-primary-500">100%</div>
                                <div className="mt-2 text-sm md:text-xl">{translations.welcome.stats3}</div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-4xl md:text-6xl font-bold text-primary-500">24/7</div>
                                <div className="mt-2 text-sm md:text-xl">{translations.welcome.stats4}</div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Features Grid */}
                <motion.section
                    variants={itemVariants}
                    className="py-24 sm:py-32 relative overflow-hidden
                    bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800
                    text-gray-900 dark:text-gray-100"
                >
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-primary-600 dark:text-white sm:text-4xl font-display">
                                {translations.welcome.featuresTitle}
                            </h2>
                            <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-300 font-sans">
                                {translations.welcome.featuresDescription}
                            </p>
                        </div>
                        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                                <div className="flex flex-col">
                                    <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-primary-600 dark:text-white">
                                        <div className="rounded-lg bg-primary-500/10 p-2 ring-1 ring-inset ring-primary-500/20">
                                            <FaUserFriends className="h-6 w-6 text-primary-500" />
                                        </div>
                                        {translations.welcome.feature1}
                                    </dt>
                                    <dd className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-200">
                                        {translations.welcome.feature1Description}
                                    </dd>
                                </div>
                                <div className="flex flex-col">
                                    <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-primary-600 dark:text-white">
                                        <div className="rounded-lg bg-primary-500/10 p-2 ring-1 ring-inset ring-primary-500/20">
                                            <MdOndemandVideo className="h-6 w-6 text-primary-500" />
                                        </div>
                                        {translations.welcome.feature2}
                                    </dt>
                                    <dd className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-200">
                                        {translations.welcome.feature2Description}
                                    </dd>
                                </div>
                                <div className="flex flex-col">
                                    <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-primary-600 dark:text-white">
                                        <div className="rounded-lg bg-primary-500/10 p-2 ring-1 ring-inset ring-primary-500/20">
                                            <FaCheckCircle className="h-6 w-6 text-primary-500" />
                                        </div>
                                        {translations.welcome.feature3}
                                    </dt>
                                    <dd className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-200">
                                        {translations.welcome.feature3Description}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </motion.section>

                {/* Featured Game Section */}
                <section className="relative isolate overflow-hidden bg-gray-900 py-24 sm:py-32 text-gray-100">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl lg:mx-0">
                            <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
                                {translations.welcome.featuredGameTitle}
                            </h2>
                            <p className="mt-6 text-lg leading-8 text-gray-300">
                                {translations.welcome.featuredGameDescription}
                            </p>
                        </div>
                        <div className="mx-auto mt-10 max-w-2xl lg:mx-0 lg:max-w-none">
                            <div className="grid grid-cols-1 gap-x-8 gap-y-6 text-base font-semibold leading-7 text-white sm:grid-cols-2 md:flex lg:gap-x-10">
                                <div className="flex items-center">
                                    <FaCheckCircle className="h-5 w-5 flex-none text-primary-500" />
                                    <span className="ml-2">{translations.welcome.featuredGameFeature1}</span>
                                </div>
                                <div className="flex items-center">
                                    <FaCheckCircle className="h-5 w-5 flex-none text-primary-500" />
                                    <span className="ml-2">{translations.welcome.featuredGameFeature2}</span>
                                </div>
                                <div className="flex items-center">
                                    <FaCheckCircle className="h-5 w-5 flex-none text-primary-500" />
                                    <span className="ml-2">{translations.welcome.featuredGameFeature3}</span>
                                </div>
                                <div className="flex items-center">
                                    <FaCheckCircle className="h-5 w-5 flex-none text-primary-500" />
                                    <span className="ml-2">{translations.welcome.featuredGameFeature4}</span>
                                </div>
                            </div>
                            <div className="mt-10 flex items-center gap-x-6">
                                <button
                                    onClick={handleGuestPlay}
                                    className="rounded-md bg-primary-500 px-3 py-2 text-md md:px-6 md:py-3 md:text-lg font-semibold text-white shadow-sm hover:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400 transition"
                                >
                                    {translations.welcome.tryNowButton}
                                </button>
                                <Link
                                    href={route('register')}
                                    className="flex items-center gap-x-2 text-md md:text-lg font-semibold leading-6 text-white hover:underline"
                                >
                                    {translations.welcome.learnMoreButton} <FaArrowRight className="inline-block w-6 h-6" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Community Section */}
                <section className="py-24 sm:py-32 relative overflow-hidden
                    bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900
                    text-gray-900 dark:text-gray-100">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-extrabold tracking-tight text-primary-600 dark:text-primary-400 sm:text-4xl">
                                {translations.welcome.communityTitle}
                            </h2>
                            <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-200">
                                {translations.welcome.communityDescription}
                            </p>
                        </div>
                        <div className="mx-auto mt-12 max-w-2xl sm:mt-16 lg:mt-20">
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {/* Testimonial cards would go here */}
                                <div className="text-gray-800 dark:text-gray-100 col-span-1 flex justify-center md:col-span-3 text-2xl md:text-3xl">Coming Soon...
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="relative isolate overflow-hidden bg-primary-500 text-white">
                    <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                                {translations.welcome.finalCTATitle}
                            </h2>
                            <p className="mx-auto mt-6 max-w-xl text-md md:text-lg leading-8 text-primary-100">
                                {translations.welcome.finalCTADescription}
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <button
                                    onClick={handleGuestPlay}
                                    className="rounded-md bg-white px-3 py-2 text-md md:px-6 md:py-3 md:text-lg font-semibold text-primary-500 shadow-sm hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition"
                                >
                                    {translations.welcome.tryNowButton}
                                </button>
                                <Link
                                    href={route('register')}
                                    className="flex items-center gap-x-2 text-md md:text-lg font-semibold leading-6 hover:underline"
                                >
                                    {translations.welcome.createAccountButton} <FaArrowRight className="inline-block w-6 h-6" />
                                </Link>
                            </div>
                        </div>
                    </div>
                    <svg
                        viewBox="0 0 1024 1024"
                        className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 -translate-y-1/2 opacity-70 [mask-image:radial-gradient(closest-side,white,transparent)]"
                        aria-hidden="true"
                    >
                        <circle cx="512" cy="512" r="512" fill="url(#gradient)" />
                        <defs>
                            <radialGradient id="gradient">
                                <stop stopColor="#7775D6" />
                                <stop offset="1" stopColor="#E935C1" />
                            </radialGradient>
                        </defs>
                    </svg>
                </section>
            </motion.div>

            <AnimatePresence>
                {showLanguageModal && (
                    <GuestLanguageModal
                        show={showLanguageModal}
                        onClose={() => setShowLanguageModal(false)}
                        languagePairs={languagePairs}
                    />
                )}
            </AnimatePresence>
        </GuestLayout>
    );
}
