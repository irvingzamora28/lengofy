import React from 'react';
import GameCard from './GameCard';
import { FaArrowRight } from 'react-icons/fa';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import genderDuelDashboardImage from "@/assets/images/gender-duel-dashboard.png";
import memoryTranslationDashboardImage from "@/assets/images/memory-translation-dashboard.png";


const sampleGames = [
    {
        id: 'gender-duel',
        title: 'Gender Duel',
        description: 'Master German noun genders through an exciting dueling game!',
        thumbnail: genderDuelDashboardImage,
        playCount: 150,
        successRate: 75,
        featured: true
    },
    {
        id: 'memory-translation',
        title: 'Memory Translation',
        description: 'Test your German vocabulary with fun memory games! Match cards to find the hidden translations and challenge your memory.',
        thumbnail: memoryTranslationDashboardImage,
        playCount: 120,
        successRate: 68,
        featured: true
    },
];

export default function FeaturedGames() {
    const { t: trans } = useTranslation();
    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{trans('dashboard.featured_games.title')}</h2>
                <Link
                    href={route('welcome')}
                    className="text-sm sm:text-base text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                    {trans('dashboard.featured_games.view_all')} <FaArrowRight className="inline-block w-4 h-4" />
                </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {sampleGames.map((game) => (
                    <GameCard key={game.id} {...game} />
                ))}
            </div>
        </div>
    );
}
