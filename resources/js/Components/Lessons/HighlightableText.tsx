import React, { useState } from 'react';
import { Tooltip } from 'react-tooltip';
import { FaBook, FaInfoCircle } from 'react-icons/fa';

interface HighlightProps {
  word: string;
  info: string;
}

interface HighlightableTextProps {
  children: string;
  highlights: string | HighlightProps[];
}

const HighlightableText: React.FC<HighlightableTextProps> = ({ children, highlights }) => {
  let parsedHighlights: HighlightProps[] = [];
  if (typeof highlights === 'string') {
    try {
      parsedHighlights = JSON.parse(highlights);
    } catch (error) {
      console.error('Failed to parse highlights:', error);
      parsedHighlights = [];
    }
  } else {
    parsedHighlights = highlights;
  }

  const [activeWord, setActiveWord] = useState<string | null>(null);

  const words = children ? children[0].split(' ').map((word, index) => {
    word = word.replace(/[\s,\.]/g, '');

    const highlight = parsedHighlights.find((h) => h.word === word);
    if (highlight) {
      return (
        <span
          key={index}
          className="relative cursor-pointer text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          onClick={() => setActiveWord(highlight.word)}
          data-tooltip-id={`tooltip-${highlight.word}`}
        >
          {word}
          <FaInfoCircle className="ml-1 inline-block text-sm" /> &nbsp;
        </span>
      );
    }
    return <span key={index}>{word} </span>;
  }) : <></>;

  return (
    <div className="w-full mx-auto p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg overflow-hidden">

      <div className="mb-4 flex items-center border-b border-gray-200 pb-4 dark:border-gray-700">
        <FaBook className="text-blue-600 dark:text-blue-400 text-xl mr-4" />
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">Interactive Text</div>
      </div>

      <div className="text-lg text-gray-700 dark:text-gray-300">
        <span>{words}</span>
        {parsedHighlights.map((highlight) => (
          <Tooltip
            key={highlight.word}
            id={`tooltip-${highlight.word}`}
            content={highlight.info}
            place="top"
            style={{ backgroundColor: '#3b82f6', color: '#fff' }}
          />
        ))}
      </div>
    </div>
  );
};

export default HighlightableText;
