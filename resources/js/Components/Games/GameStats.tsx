import React from 'react';
import { FaTrophy, FaGamepad, FaFire } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    description?: string;
    isMobile?: boolean;
}

const StatCard = ({
    icon,
    title,
    value,
    description,
    isMobile = false
}: StatCardProps) => {
    if (isMobile) {
        return (
            <div className="flex flex-col items-center justify-center text-center space-y-1">
                <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-full mb-1">
                    <div className="w-4 h-4 text-primary-500">
                        {icon}
                    </div>
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{title}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex items-center space-x-4">
            <div className="p-2.5 bg-primary-100 dark:bg-primary-900 rounded-full">
                <div className="w-5 h-5 text-primary-500">
                    {icon}
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{title}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{value}</p>
                {description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{description}</p>
                )}
            </div>
        </div>
    );
};

export default function GameStats() {
    // Sample data - this would come from your backend
    const stats = {
        gamesPlayed: 42,
        currentStreak: 7,
        totalScore: 1250
    };
    const { t: trans } = useTranslation();

    return (
        <>
            {/* Mobile Layout - Hidden on larger screens */}
            <div className="sm:hidden bg-gray-50 dark:bg-gray-900 rounded-lg shadow-sm py-3">
                <div className="grid grid-cols-3 gap-2 px-2">
                    <StatCard
                        isMobile
                        icon={<FaGamepad className="w-full h-full" />}
                        title={trans('dashboard.game_stats.games')}
                        value={stats.gamesPlayed}
                    />
                    <StatCard
                        isMobile
                        icon={<FaFire className="w-full h-full" />}
                        title={trans('dashboard.streak')}
                        value={`${stats.currentStreak}d`}
                    />
                    <StatCard
                        isMobile
                        icon={<FaTrophy className="w-full h-full" />}
                        title={trans('dashboard.game_stats.score')}
                        value={stats.totalScore}
                    />
                </div>
            </div>

            {/* Desktop Layout - Hidden on mobile */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-3">
                <StatCard
                    icon={<FaGamepad className="w-full h-full" />}
                    title={trans('dashboard.game_stats.games')}
                    value={stats.gamesPlayed}
                    description={trans('dashboard.game_stats.games_description')}
                />
                <StatCard
                    icon={<FaFire className="w-full h-full" />}
                    title={trans('dashboard.streak')}
                    value={`${stats.currentStreak} days`}
                    description={trans('dashboard.game_stats.streak_description')}
                />
                <StatCard
                    icon={<FaTrophy className="w-full h-full" />}
                    title={trans('dashboard.game_stats.score')}
                    value={stats.totalScore}
                    description={trans('dashboard.game_stats.score_description')}
                />
            </div>
        </>
    );
}
