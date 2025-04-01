import React from 'react';
import { router } from '@inertiajs/react';
import { FaHome, FaGamepad, FaChartBar, FaTrophy, FaBook } from 'react-icons/fa';
import { MobileTab } from '@/Components/Navigation/MobileNavigation';
import { useTranslation } from 'react-i18next';

interface MobileDashboardLinksProps {
  className?: string;
}

/**
 * A reusable mobile navigation bar that redirects to the Dashboard with the selected tab
 * This component is designed to be used in Lobby pages to provide consistent navigation
 */
const MobileDashboardLinks: React.FC<MobileDashboardLinksProps> = ({ className = '' }) => {
  const { t: trans } = useTranslation();

  const navItems = [
    {
      icon: <FaHome className="w-full h-full" />,
      label: trans('auth_layout.home'),
      tab: 'home' as MobileTab
    },
    {
      icon: <FaGamepad className="w-full h-full" />,
      label: trans('auth_layout.games'),
      tab: 'games' as MobileTab
    },
    {
      icon: <FaChartBar className="w-full h-full" />,
      label: trans('auth_layout.stats'),
      tab: 'stats' as MobileTab
    },
    {
      icon: <FaTrophy className="w-full h-full" />,
      label: trans('auth_layout.leaderboard'),
      tab: 'leaderboard' as MobileTab
    },
    {
      icon: <FaBook className="w-full h-full" />,
      label: trans('auth_layout.lessons'),
      tab: 'lessons' as MobileTab
    }
  ];

  return (
    <div className={`sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 z-50 ${className}`}>
      <div className="flex justify-between items-center px-2 py-2 h-16">
        {navItems.map((item) => (
          <button
            key={item.tab}
            onClick={() => {
              // Redirect to Dashboard with the selected tab
              // Use window.location to ensure the URL parameter is properly set
              window.location.href = `${route('dashboard')}?activeTab=${item.tab}`;
            }}
            className="flex flex-col items-center justify-center px-2 py-1 text-xs text-gray-600 dark:text-gray-400"
          >
            <div className="p-1.5 rounded-full mb-1 bg-transparent">
              <div className="w-5 h-5 text-gray-600 dark:text-gray-400">
                {item.icon}
              </div>
            </div>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileDashboardLinks;
