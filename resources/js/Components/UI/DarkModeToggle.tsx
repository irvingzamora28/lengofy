import React from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useDarkMode } from '@/Hooks/useDarkMode';

interface DarkModeToggleProps {
  className?: string;
  onToggle?: (newMode: boolean) => void;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({
  className,
  onToggle,
}) => {
  const { darkMode, toggleDarkMode } = useDarkMode();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up
    toggleDarkMode();

    // Call the onToggle callback if provided
    if (onToggle) {
      onToggle(!darkMode);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg ${className}`}
      aria-label="Toggle Dark Mode"
    >
      {darkMode ? (
        <FaSun className="w-6 h-6" />
    ) : (
        <FaMoon className="w-6 h-6" />
      )}
    </button>
  );
};

export default DarkModeToggle;
