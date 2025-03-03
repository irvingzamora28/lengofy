import React from 'react';

interface ProgressProps {
    value: number;
    className?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, className = '' }) => {
    return (
        <div className={`bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}>
            <div
                className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-300 ease-in-out"
                style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
            />
        </div>
    );
};
