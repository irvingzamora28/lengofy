import React from 'react';
import { FaHome, FaGamepad, FaChartBar, FaTrophy, FaBook } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface MobileNavItemProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}

const MobileNavItem: React.FC<MobileNavItemProps> = ({ icon, label, active, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center px-2 py-1 text-xs ${
                active
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400'
            }`}
        >
            <div className={`p-1.5 rounded-full mb-1 ${
                active
                    ? 'bg-primary-600 dark:bg-primary-800'
                    : 'bg-transparent'
            }`}>
                <div className={`w-5 h-5 ${
                    active
                        ? 'text-white dark:text-white'
                        : 'text-gray-600 dark:text-gray-400'
                }`}>
                    {icon}
                </div>
            </div>
            <span className={active ? 'font-semibold' : ''}>{label}</span>
        </button>
    );
};

export type MobileTab = 'home' | 'games' | 'stats' | 'leaderboard' | 'lessons';

interface MobileNavigationProps {
    activeTab: MobileTab;
    onTabChange: (tab: MobileTab) => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ activeTab, onTabChange }) => {
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
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 z-50">
            <div className="flex justify-between items-center px-2 py-2">
                {navItems.map((item) => (
                    <MobileNavItem
                        key={item.tab}
                        icon={item.icon}
                        label={item.label}
                        active={activeTab === item.tab}
                        onClick={() => onTabChange(item.tab)}
                    />
                ))}
            </div>
        </div>
    );
};

export default MobileNavigation;
