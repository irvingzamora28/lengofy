import React, { useState } from "react";
import {
    FaPlay,
    FaMars,
    FaVenus,
    FaTrophy,
    FaUsers,
    FaBrain,
} from "react-icons/fa";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import genderDuelImage from "@/assets/images/gender-duel-landing.png";
import { AnimatePresence } from "framer-motion";
import GuestLanguageModal from "@/Components/GuestLanguageModal";

interface Feature {
    icon: JSX.Element;
    title: string;
    description: string;
}

interface LandingPageGenderDuelProps {
    languagePairs: Record<string, any>;
}

const LandingPageGenderDuel: React.FC<LandingPageGenderDuelProps> = ({ languagePairs }) => {
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const { t: trans } = useTranslation();
    const features: Feature[] = [
        {
            icon: <FaBrain className="w-8 h-8" />,
            title: trans("gender_duel_landing_page.feature_effortless_learning"),
            description: trans("gender_duel_landing_page.feature_effortless_learning_description"),
        },
        {
            icon: <FaUsers className="w-8 h-8" />,
            title: trans("gender_duel_landing_page.feature_real_time_multiplayer"),
            description: trans("gender_duel_landing_page.feature_real_time_multiplayer_description"),
        },
        {
            icon: <FaTrophy className="w-8 h-8" />,
            title: trans("gender_duel_landing_page.feature_progress_tracking"),
            description: trans("gender_duel_landing_page.feature_progress_tracking_description"),
        },
    ];

    const handleGuestPlay = () => {
        setShowLanguageModal(true);
    };

    return (
        <GuestLayout>
            <Head>
                <title>Gender Duel</title>
                <meta
                    name="description"
                    content={trans("gender_duel_landing_page.meta_description")}
                />
                <meta
                    name="keywords"
                    content={trans("gender_duel_landing_page.meta_keywords")}
                />
                <meta
                    property="og:title"
                    content={trans("gender_duel_landing_page.meta_title")}
                />
                <meta
                    property="og:description"
                    content={trans("gender_duel_landing_page.meta_description")}
                />
                <meta
                    property="og:image"
                    content={genderDuelImage}
                />
            </Head>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-black">
                <section className="pt-24 pb-20 px-4">
                    <div className="max-w-6xl mx-auto text-center">
                        <div className="flex justify-center mb-6 space-x-2">
                            <FaMars className="w-24 h-24 text-blue-500" />
                            <FaVenus className="w-24 h-24 text-purple-500" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                            {trans("gender_duel_landing_page.title")}
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
                            {trans("gender_duel_landing_page.description")}
                        </p>
                        <button onClick={handleGuestPlay} className="px-12 py-6 text-xl md:text-6xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center space-x-3 transform hover:scale-105 transition mx-auto">
                            <FaPlay className="w-6 h-6 md:w-12 md:h-12" /> <span>{trans("gender_duel_landing_page.play_now")}</span>
                        </button>
                    </div>
                </section>

                <section className="py-20 px-4 bg-white/50 dark:bg-gray-800/50">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-3 gap-8">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-lg p-6 hover:scale-105 transition-transform"
                                >
                                    <div className="flex flex-col items-center text-center">
                                        <div className="mb-4 text-blue-500 dark:text-blue-400">
                                            {feature.icon}
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2 dark:text-white">
                                            {feature.title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-20 px-4">
                    <div className="max-w-6xl mx-auto text-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl" />
                            <img
                                src={genderDuelImage}
                                alt="Game Preview"
                                className="rounded-xl shadow-2xl relative z-10 mx-auto"
                            />
                        </div>
                    </div>
                </section>

                <footer className="py-8 px-4 text-center text-gray-600 dark:text-gray-400">
                    <p>{trans('generals.copyright')}</p>
                </footer>
            </div>

            <AnimatePresence>
                {showLanguageModal && (
                    <GuestLanguageModal
                        show={showLanguageModal}
                        redirectRoute="games.gender-duel.practice"
                        onClose={() => setShowLanguageModal(false)}
                        languagePairs={languagePairs}
                    />
                )}
            </AnimatePresence>
        </GuestLayout>
    );
};

export default LandingPageGenderDuel;
