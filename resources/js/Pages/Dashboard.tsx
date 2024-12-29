import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps, Score } from '@/types';

import GameStats from '@/Components/Games/GameStats';
import FeaturedGames from '@/Components/Games/FeaturedGames';
import Leaderboard from '@/Components/Games/Leaderboard';
import axios from 'axios';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface DashboardProps extends PageProps {
    scores: Score[];
}

export default function Dashboard({ scores }: DashboardProps) {
    const { t: trans } = useTranslation();

    useEffect(() => {
        // Call CSRF cookie endpoint when component mounts
        axios.get('/sanctum/csrf-cookie').then(() => {
            // CSRF cookie is set; now we can make authenticated requests
        });

    }, []);

    return (
        <AuthenticatedLayout

        >
            <Head title={trans('auth_layout.dashboard')} />

            <div className="py-6 sm:py-12">
                <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
                    {/* Game Stats Section */}
                    <div className="overflow-hidden sm:rounded-lg">
                        <GameStats />
                    </div>

                    <Leaderboard scores={scores} />

                    {/* Featured Games Section */}
                    <div className="overflow-hidden bg-gray-50 dark:bg-gray-900 shadow-sm sm:rounded-lg p-3 sm:p-6">
                        <FeaturedGames />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
