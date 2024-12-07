import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import GameStats from '@/Components/Games/GameStats';
import FeaturedGames from '@/Components/Games/FeaturedGames';

export default function Dashboard() {
    return (
        <AuthenticatedLayout

        >
            <Head title="Dashboard" />

            <div className="py-6 sm:py-12">
                <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
                    {/* Game Stats Section */}
                    <div className="overflow-hidden sm:rounded-lg">
                        <GameStats />
                    </div>

                    {/* Featured Games Section */}
                    <div className="overflow-hidden bg-gray-50 dark:bg-gray-900 shadow-sm sm:rounded-lg p-3 sm:p-6">
                        <FeaturedGames />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
