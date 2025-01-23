import React, { useState } from "react";
import { Score } from "@/types";
import {
    FaTrophy,
    FaMedal,
    FaCrown,
    FaStar,
    FaSort,
    FaSortUp,
    FaSortDown,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface LeaderboardProps {
    scores: Score[];
}

type SortField =
    | "user.name"
    | "highest_score"
    | "total_points"
    | "winning_streak";
type SortOrder = "asc" | "desc";

const Leaderboard: React.FC<LeaderboardProps> = ({ scores }) => {
    const [sortField, setSortField] = useState<SortField>("highest_score");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const { t: trans } = useTranslation();

    const getPosition = (index: number) => {
        switch (index) {
            case 0:
                return <FaTrophy className="w-6 h-6 text-yellow-500" />;
            case 1:
                return <FaMedal className="w-6 h-6 text-gray-400" />;
            case 2:
                return <FaCrown className="w-6 h-6 text-amber-600" />;
            default:
                return <FaStar className="w-4 h-4 text-blue-500" />;
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return <FaSort className="w-4 h-4" />;
        return sortOrder === "asc" ? (
            <FaSortUp className="w-4 h-4" />
        ) : (
            <FaSortDown className="w-4 h-4" />
        );
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("desc");
        }
    };

    const sortedScores = [...scores].sort((a, b) => {
        const getValue = (obj: any, path: string) => {
            return path.split(".").reduce((o, i) => o[i], obj);
        };

        const aValue = getValue(a, sortField);
        const bValue = getValue(b, sortField);

        if (typeof aValue === "string") {
            return sortOrder === "asc"
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }

        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });
    return (
        <div className="w-full rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-3 sm:p-4 shadow">
            <h2 className="text-xl font-bold text-center text-indigo-900 dark:text-indigo-200 mb-3 sm:mb-4">
                {trans("dashboard.leaderboard.title")} 🏆
            </h2>

            {/* Desktop Table */}
            <div className="hidden sm:block">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-indigo-200 dark:border-gray-700 text-sm [&>th]:p-2 [&>th]:font-medium">
                            <th className="text-left text-indigo-600 dark:text-indigo-300">
                                {trans("dashboard.leaderboard.rank")}
                            </th>
                            <th className="text-left text-indigo-600 dark:text-indigo-300">
                                {trans("dashboard.leaderboard.game")}
                            </th>
                            <th
                                className="text-left text-indigo-600 dark:text-indigo-300 cursor-pointer hover:bg-indigo-100 dark:hover:bg-gray-700"
                                onClick={() => handleSort("user.name")}
                            >
                                <div className="flex items-center gap-2">
                                    {trans("dashboard.leaderboard.player")}{" "}
                                    {getSortIcon("user.name")}
                                </div>
                            </th>
                            <th
                                className="text-right text-indigo-600 dark:text-indigo-300 cursor-pointer hover:bg-indigo-100 dark:hover:bg-gray-700"
                                onClick={() => handleSort("highest_score")}
                            >
                                <div className="flex items-center justify-end gap-2">
                                    {trans("dashboard.leaderboard.high_score")}{" "}
                                    {getSortIcon("highest_score")}
                                </div>
                            </th>
                            <th
                                className="text-right text-indigo-600 dark:text-indigo-300 cursor-pointer hover:bg-indigo-100 dark:hover:bg-gray-700"
                                onClick={() => handleSort("total_points")}
                            >
                                <div className="flex items-center justify-end gap-2">
                                    {trans("dashboard.total_points")}{" "}
                                    {getSortIcon("total_points")}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedScores.map((score, index) => (
                            <tr
                                key={score.id}
                                className="transition-all hover:bg-white/50 dark:hover:bg-gray-800/50 text-sm [&>td]:p-2"
                            >
                                <td className="flex items-center gap-2">
                                    {getPosition(index)}
                                    <span className="font-semibold dark:text-gray-200">
                                        #{index + 1}
                                    </span>
                                </td>
                                <td className="font-medium text-gray-700 dark:text-gray-300">
                                    {score.game.name}
                                </td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs">
                                            {score.user.name.charAt(0)}
                                        </div>
                                        <span className="font-medium dark:text-gray-200">
                                            {score.user.name}
                                        </span>
                                    </div>
                                </td>
                                <td className="text-right font-semibold text-green-600 dark:text-green-400">
                                    {score.highest_score.toLocaleString()}
                                </td>
                                <td className="text-right font-medium text-gray-700 dark:text-gray-300">
                                    {score.total_points.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile List */}
            <div className="sm:hidden space-y-1">
                {sortedScores.slice(0, 5).map((score, index) => (
                    <div
                        key={score.id}
                        className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-xs"
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-primary-600 dark:text-primary-400">
                                    #{index + 1}
                                </span>
                                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs">
                                    {score.user.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-xs font-medium dark:text-gray-200 line-clamp-1">
                                        {score.user.name}
                                    </p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">
                                        {score.game.name}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-semibold text-green-600 dark:text-green-400">
                                    {score.highest_score.toLocaleString()}
                                </p>
                                <span className="text-[10px] px-1 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                                    {score.winning_streak}🔥
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;
