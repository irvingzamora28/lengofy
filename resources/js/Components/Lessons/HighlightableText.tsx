import React, { useState } from 'react';
import { Tooltip } from 'react-tooltip';
import { BsInfoCircle } from 'react-icons/bs';

interface HighlightProps {
  word: string;
  info: string;
}

interface HighlightableTextProps {
  children: string; // The full sentence
  highlights: string | HighlightProps[]; // Accepts either a JSON string or an array
}

const HighlightableText: React.FC<HighlightableTextProps> = ({ children, highlights }) => {

  // Safely parse the highlights prop
  let parsedHighlights: HighlightProps[] = [];
  if (typeof highlights === 'string') {
    try {
      parsedHighlights = JSON.parse(highlights);
    } catch (error) {
      console.error('Failed to parse highlights:', error);
      parsedHighlights = []; // Fallback to an empty array
    }
  } else {
    parsedHighlights = highlights;
  }


  const [activeWord, setActiveWord] = useState<string | null>(null);

  const words = children ? children[0].split(' ').map((word, index) => {
    // Clean word, remove spaces, puntuaction, commas, etc.
    word = word.replace(/[\s,\.]/g, '');

    const highlight = parsedHighlights.find((h) => h.word === word);
    if (highlight) {
      return (
        <span
          key={index}
          className="relative cursor-pointer text-blue-600 hover:text-blue-800"
          onClick={() => setActiveWord(highlight.word)}
          data-tooltip-id={`tooltip-${highlight.word}`}
        >
          {word}
          <BsInfoCircle className="ml-1 inline-block text-sm" /> &nbsp;
        </span>
      );
    }
    return <span key={index}>{word} </span>;
  }) : <></>;

  return (
    <div className="text-lg">
      <p>{words}</p>
      {/* Render tooltips for highlighted words */}
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
  );
};

export default HighlightableText;
