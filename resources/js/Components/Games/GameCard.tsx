import React from 'react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface GameCardProps {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    playCount?: number;
    successRate?: number;
    featured?: boolean;
}

export default function GameCard({
    id,
    title,
    description,
    thumbnail,
    playCount = 0,
    successRate = 0,
    featured = false
}: GameCardProps) {
    const { t: trans } = useTranslation();
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 ${featured ? 'border-2 border-primary-500' : ''}`}>
            <div className="relative h-32 sm:h-48">
                <img
                    src={thumbnail}
                    alt={title}
                    className="w-full h-full object-cover"
                />
                {featured && (
                    <div className="absolute top-2 right-2 bg-primary-500 text-white px-2 py-0.5 sm:py-1 rounded-full text-xs">
                        {trans('dashboard.game_card.featured')}
                    </div>
                )}
            </div>
            <div className="p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">{title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 sm:mb-4 line-clamp-2">{description}</p>
                <div className="flex justify-between items-center mb-2 sm:mb-4">
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {trans('dashboard.game_card.play_count')} {playCount}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {trans('dashboard.game_card.success_rate')} {successRate}%
                    </div>
                </div>
                <Link
                    href={`/games/${id}`}
                    className="block w-full text-center bg-primary-500 hover:bg-primary-600 text-white font-semibold py-1.5 sm:py-2 px-3 sm:px-4 rounded-md transition-colors duration-300 text-sm sm:text-base"
                >
                    {trans('dashboard.game_card.play_now')}
                </Link>
            </div>
        </div>
    );
}
