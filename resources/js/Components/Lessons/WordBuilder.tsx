import React, { useState, useEffect } from 'react';

interface WordBuilderProps {
  targetWord: string;
}

const WordBuilder: React.FC<WordBuilderProps> = ({ targetWord }) => {
  const [letters, setLetters] = useState<string[]>([]);
  const [answer, setAnswer] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>('');

  // Function to scramble the target word
  const scrambleWord = (word: string): string[] => {
    const array = word.split('');
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
  };

  // Initialize scrambled letters on component mount
  useEffect(() => {
    setLetters(scrambleWord(targetWord));
  }, [targetWord]);

  // Add a letter to the answer (used for both drag-and-drop and click-to-select)
  const addLetterToAnswer = (letter: string) => {
    const index = letters.indexOf(letter);
    if (index !== -1) {
      setAnswer((prev) => [...prev, letter]);
      setLetters((prev) => prev.filter((_, i) => i !== index)); // Remove only one instance
    }
  };

  const handleSubmit = () => {
    const constructedWord = answer.join('');
    if (constructedWord === targetWord) {
      setFeedback('Correct! Great job!');
    } else {
      setFeedback(`Incorrect. The correct word is "${targetWord}".`);
    }
  };

  const resetGame = () => {
    setAnswer([]);
    setLetters(scrambleWord(targetWord));
    setFeedback('');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Build the Word</h3>
      <p className="text-gray-700 dark:text-gray-300">
        Rearrange the letters to spell: <strong>{targetWord}</strong>
      </p>

      {/* Scrambled Letters */}
      <div className="flex flex-wrap gap-2">
        {letters.map((letter, index) => (
          <div
            key={index}
            draggable
            onClick={() => addLetterToAnswer(letter)} // Click-to-select
            onDragStart={(e) => e.dataTransfer.setData('text/plain', letter)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded cursor-pointer border border-gray-300 dark:border-gray-700"
          >
            {letter}
          </div>
        ))}
      </div>

      {/* Drop Zone */}
      <div
        className="flex flex-wrap gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900 min-h-[50px]"
        onDrop={(e) => {
          const droppedLetter = e.dataTransfer.getData('text/plain');
          addLetterToAnswer(droppedLetter);
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        {answer.map((letter, index) => (
          <span
            key={index}
            className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
        >
          Submit
        </button>
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 w-full sm:w-auto"
        >
          Reset
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <p
          className={`text-lg font-medium ${
            feedback.includes('Correct') ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {feedback}
        </p>
      )}
    </div>
  );
};

export default WordBuilder;
