import React from 'react';
import GameCard from './GameCard';
import { FaArrowRight } from 'react-icons/fa';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

const sampleGames = [
    {
        id: 'gender-duel',
        title: 'Gender Duel',
        description: 'Master German noun genders through an exciting dueling game!',
        thumbnail: 'https://picsum.photos/200/300',
        playCount: 150,
        successRate: 75,
        featured: true
    },
    {
        id: 'verb-challenge',
        title: 'Verb Challenge',
        description: 'Practice German verb conjugations in a fun and interactive way.',
        thumbnail: 'https://picsum.photos/200/300',
        playCount: 120,
        successRate: 68,
        featured: true
    },
    {
        id: 'case-master',
        title: 'Case Master',
        description: 'Learn German cases through engaging exercises and challenges.',
        thumbnail: 'https://picsum.photos/200/300',
        playCount: 90,
        successRate: 62,
        featured: true
    }
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
