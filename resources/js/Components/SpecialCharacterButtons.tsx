import React from 'react';

interface Props {
  specialCharacters: string[];
  onCharacterClick: (char: string) => void;
  className?: string;
}

export default function SpecialCharacterButtons({ specialCharacters, onCharacterClick, className = '' }: Props) {
  if (!specialCharacters || specialCharacters.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {specialCharacters.map((char) => (
        <button
          key={char}
          type="button"
          onClick={() => onCharacterClick(char)}
          className="px-2 py-1 text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-600 transition-colors"
        >
          {char}
        </button>
      ))}
    </div>
  );
}
