import React, { ReactNode } from 'react';
import { TabConfig } from '@/Components/Layout/TabLayout';
import GameStats from '@/Components/Games/GameStats';
import FeaturedGames from '@/Components/Games/FeaturedGames';
import Leaderboard from '@/Components/Games/Leaderboard';
import RecentLessons from '@/Components/Lessons/RecentLessons';
import { Game, Lesson, Score } from '@/types';

interface TabsConfigProps {
  games: Game[];
  lessons: Lesson[];
  scores: Score[];
  trans: (key: string) => string;
}

/**
 * Get shared tab configurations for the application
 * This eliminates duplication between Dashboard and Lobby components
 */
export const getSharedTabs = ({ games, lessons, scores, trans }: TabsConfigProps): TabConfig[] => {
  return [
    {
      key: 'home',
      content: (
        <>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white px-1 mb-2">
            {trans("auth_layout.dashboard")}
          </h2>
          <div className="overflow-hidden sm:rounded-lg">
            <GameStats />
          </div>
          <div className="overflow-hidden sm:rounded-lg">
            <RecentLessons lessons={lessons} />
          </div>
        </>
      )
    },
    {
      key: 'games',
      content: (
        <div className="overflow-hidden bg-gray-50 dark:bg-gray-900 shadow-sm sm:rounded-lg p-2 sm:p-4">
          <FeaturedGames games={games} />
        </div>
      )
    },
    {
      key: 'stats',
      content: (
        <div className="overflow-hidden sm:rounded-lg">
          <GameStats />
        </div>
      )
    },
    {
      key: 'leaderboard',
      content: (
        <div>
          <Leaderboard scores={scores} />
        </div>
      )
    },
    {
      key: 'lessons',
      content: (
        <div className="overflow-hidden sm:rounded-lg">
          <RecentLessons lessons={lessons} />
        </div>
      )
    }
  ];
};

/**
 * Get shared desktop content for the application
 * This eliminates duplication between Dashboard and Lobby components
 */
export const getSharedDesktopContent = ({ games, lessons, scores }: TabsConfigProps): ReactNode => {
  return (
    <>
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

      {/* Recent Lessons */}
      <div className="overflow-hidden sm:rounded-lg mt-3 sm:mt-4">
        <RecentLessons lessons={lessons} />
      </div>
    </>
  );
};
