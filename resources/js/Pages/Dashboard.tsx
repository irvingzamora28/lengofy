import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { PageProps, Score, Game, Lesson } from "@/types";

import GameStats from "@/Components/Games/GameStats";
import FeaturedGames from "@/Components/Games/FeaturedGames";
import Leaderboard from "@/Components/Games/Leaderboard";
import RecentLessons from "@/Components/Lessons/RecentLessons";
import axios from "axios";
import { useEffect, useState } from "react";
import { FaGamepad } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import MobileNavigation, { MobileTab } from "@/Components/Navigation/MobileNavigation";

interface DashboardProps extends PageProps {
    scores: Score[];
    games: Game[];
    lessons: Lesson[];
}

export default function Dashboard({ scores, games, lessons }: DashboardProps) {
    const { t: trans } = useTranslation();
    const [activeTab, setActiveTab] = useState<MobileTab>('home');

    useEffect(() => {
        // Call CSRF cookie endpoint when component mounts
        axios.get("/sanctum/csrf-cookie").then(() => {
            // CSRF cookie is set; now we can make authenticated requests
        });
    }, []);

    // Render content based on active tab for mobile
    const renderMobileContent = () => {
        switch (activeTab) {
            case 'home':
                return (
                    <>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white px-1 mb-2">
                            {trans("auth_layout.dashboard")}
                        </h2>
                        <div className="overflow-hidden sm:rounded-lg">
                            <GameStats />
                        </div>
                        <div className="overflow-hidden sm:rounded-lg">
                            <RecentLessons lessons={lessons} />
                        </div>
                    </>
                );
            case 'games':
                return (
                    <div className="overflow-hidden bg-gray-50 dark:bg-gray-900 shadow-sm sm:rounded-lg p-2 sm:p-4">
                        <FeaturedGames games={games} />
                    </div>
                );
            case 'stats':
                return (
                    <div className="overflow-hidden sm:rounded-lg">
                        <GameStats />
                    </div>
                );
            case 'leaderboard':
                return (
                    <div>
                        <Leaderboard scores={scores} />
                    </div>
                );
            case 'lessons':
                return (
                    <div className="overflow-hidden sm:rounded-lg">
                        <RecentLessons lessons={lessons} />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={trans("auth_layout.dashboard")} />

            <div className="py-4 sm:py-6 lg:py-8">
                <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6 space-y-3 sm:space-y-4">
                    {/* Mobile View - Show content based on active tab */}
                    <div className="sm:hidden">
                        {renderMobileContent()}
                    </div>

                    {/* Desktop View - Show all content */}
                    <div className="hidden sm:block space-y-3 sm:space-y-4">
                        {/* Game Stats Section */}
                        <div className="overflow-hidden sm:rounded-lg">
                            <GameStats />
                        </div>

                        {/* Combined Leaderboard & Featured Games */}
                        <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
                            <Leaderboard scores={scores} />

                            <div className="overflow-hidden bg-gray-50 dark:bg-gray-900 shadow-sm sm:rounded-lg p-2 sm:p-4">
                                <FeaturedGames games={games} />
                            </div>
                        </div>

                        {/* Recent Lessons Section */}
                        <div className="overflow-hidden sm:rounded-lg">
                            <RecentLessons lessons={lessons} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className="sm:hidden">
                <MobileNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
        </AuthenticatedLayout>
    );
}
