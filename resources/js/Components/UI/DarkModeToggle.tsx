import React, { useState, useEffect } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';

interface DarkModeToggleProps {
  className?: string;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ className }) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first
    const savedDarkMode = localStorage.getItem('darkMode');

    // If explicitly set in localStorage, use that value
    if (savedDarkMode !== null) {
      return savedDarkMode === 'true';
    }

    // Otherwise, use system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Apply dark mode class to html element
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  return (
    <button
      onClick={toggleDarkMode}
      className={`p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg ${className}`}
      aria-label="Toggle Dark Mode"
    >
      {darkMode ? (
        <FaMoon className="w-6 h-6" />
      ) : (
        <FaSun className="w-6 h-6" />
      )}
    </button>
  );
};

export default DarkModeToggle;
