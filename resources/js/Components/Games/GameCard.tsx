import React from "react";
import { Link } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import { FaPlay, FaTrophy, FaChartLine } from "react-icons/fa";

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
    featured = false,
}: GameCardProps) {
    const { t: trans } = useTranslation();

    return (
        <div
            className={`group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col ${
                featured ? "ring-1 ring-primary-500" : ""
            }`}
        >
            {/* Image Container */}
            <div className="relative h-20 sm:h-32 overflow-hidden rounded-t-lg flex-shrink-0">
                <img
                    src={thumbnail}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent" />
            </div>

            {/* Content Area - fills remaining space */}
            <div className="p-2 sm:p-3 flex flex-col flex-grow">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 my-2">
                    {title}
                </h3>

                {/* Description with flexible space */}
                <p className="hidden sm:line-clamp-3 text-xs text-gray-600 dark:text-gray-300">
                    {description}
                </p>

                {/* Bottom-aligned elements */}
                <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <FaPlay className="w-3 h-3" />
                        <span>{playCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <span className="inline-block w-10 text-right">
                            {successRate}%
                        </span>
                        <div className="h-1.5 w-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500"
                                style={{ width: `${successRate}%` }}
                            />
                        </div>
                    </div>
                </div>
                {/* Play button - consistently bottom-aligned */}
                <Link
                    href={`/games/${id}`}
                    className="block w-full text-center bg-primary-500 hover:bg-primary-600 text-white text-xs sm:text-sm font-medium py-1.5 mt-2 rounded-md transition-colors"
                >
                    {trans("dashboard.game_card.play_now")}
                </Link>
            </div>
        </div>
    );
}
