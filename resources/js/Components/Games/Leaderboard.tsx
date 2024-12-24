import React, { useState } from 'react';
import { Score } from '@/types';
import { FaTrophy, FaMedal, FaCrown, FaStar, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

interface LeaderboardProps {
    scores: Score[];
}

type SortField = 'user.name' | 'highest_score' | 'total_points' | 'winning_streak';
type SortOrder = 'asc' | 'desc';

const Leaderboard: React.FC<LeaderboardProps> = ({ scores }) => {
    const [sortField, setSortField] = useState<SortField>('highest_score');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const getPosition = (index: number) => {
        switch (index) {
            case 0: return <FaTrophy className="w-6 h-6 text-yellow-500" />;
            case 1: return <FaMedal className="w-6 h-6 text-gray-400" />;
            case 2: return <FaCrown className="w-6 h-6 text-amber-600" />;
            default: return <FaStar className="w-4 h-4 text-blue-500" />;
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return <FaSort className="w-4 h-4" />;
        return sortOrder === 'asc' ? <FaSortUp className="w-4 h-4" /> : <FaSortDown className="w-4 h-4" />;
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const sortedScores = [...scores].sort((a, b) => {
        const getValue = (obj: any, path: string) => {
            return path.split('.').reduce((o, i) => o[i], obj);
        };

        const aValue = getValue(a, sortField);
        const bValue = getValue(b, sortField);

        if (typeof aValue === 'string') {
            return sortOrder === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }

        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return (
        <div className="w-full rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-center text-indigo-900 dark:text-indigo-200 mb-6">
                🏆 Leaderboard Champions 🏆
            </h2>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-indigo-200 dark:border-gray-700">
                            <th className="p-4 text-left text-indigo-600 dark:text-indigo-300">Rank</th>
                            <th className="p-4 text-left text-indigo-600 dark:text-indigo-300">Game</th>
                            <th
                                className="p-4 text-left text-indigo-600 dark:text-indigo-300 cursor-pointer hover:bg-indigo-100 dark:hover:bg-gray-700"
                                onClick={() => handleSort('user.name')}
                            >
                                <div className="flex items-center gap-2">
                                    Player {getSortIcon('user.name')}
                                </div>
                            </th>
                            <th
                                className="p-4 text-right text-indigo-600 dark:text-indigo-300 cursor-pointer hover:bg-indigo-100 dark:hover:bg-gray-700"
                                onClick={() => handleSort('highest_score')}
                            >
                                <div className="flex items-center justify-end gap-2">
                                    High Score {getSortIcon('highest_score')}
                                </div>
                            </th>
                            <th
                                className="p-4 text-right text-indigo-600 dark:text-indigo-300 cursor-pointer hover:bg-indigo-100 dark:hover:bg-gray-700"
                                onClick={() => handleSort('total_points')}
                            >
                                <div className="flex items-center justify-end gap-2">
                                    Total {getSortIcon('total_points')}
                                </div>
                            </th>
                            <th
                                className="p-4 text-right text-indigo-600 dark:text-indigo-300 cursor-pointer hover:bg-indigo-100 dark:hover:bg-gray-700"
                                onClick={() => handleSort('winning_streak')}
                            >
                                <div className="flex items-center justify-end gap-2">
                                    Streak {getSortIcon('winning_streak')}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedScores.map((score, index) => (
                            <tr
                                key={score.id}
                                className="transition-all hover:bg-white/50 dark:hover:bg-gray-800/50 hover:shadow-md"
                            >
                                <td className="p-4 flex items-center gap-2">
                                    {getPosition(index)}
                                    <span className="font-semibold dark:text-gray-200">#{index + 1}</span>
                                </td>
                                <td className="p-4 font-medium text-gray-700 dark:text-gray-300">{score.game.name}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold">
                                            {score.user.name.charAt(0)}
                                        </div>
                                        <span className="font-medium dark:text-gray-200">{score.user.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right font-semibold text-green-600 dark:text-green-400">
                                    {score.highest_score.toLocaleString()}
                                </td>
                                <td className="p-4 text-right font-medium text-gray-700 dark:text-gray-300">
                                    {score.total_points.toLocaleString()}
                                </td>
                                <td className="p-4 text-right">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                                        {score.winning_streak}🔥
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Leaderboard;
