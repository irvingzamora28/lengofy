import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { PageProps, Score, Game } from "@/types";

import GameStats from "@/Components/Games/GameStats";
import FeaturedGames from "@/Components/Games/FeaturedGames";
import Leaderboard from "@/Components/Games/Leaderboard";
import axios from "axios";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface DashboardProps extends PageProps {
    scores: Score[];
    games: Game[];
}

export default function Dashboard({ scores, games }: DashboardProps) {
    const { t: trans } = useTranslation();

    useEffect(() => {
        // Call CSRF cookie endpoint when component mounts
        axios.get("/sanctum/csrf-cookie").then(() => {
            // CSRF cookie is set; now we can make authenticated requests
        });
    }, []);

    return (
        <AuthenticatedLayout>
            <Head title={trans("auth_layout.dashboard")} />

            <div className="py-4 sm:py-6 lg:py-8">
                <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6 space-y-3 sm:space-y-4">
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
