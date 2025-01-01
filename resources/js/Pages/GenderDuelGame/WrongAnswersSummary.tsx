import { GenderDuelAnswer } from '@/types';
import React from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface WrongAnswersSummaryProps {
    wrongAnswers: GenderDuelAnswer[];
    targetLanguage: 'de' | 'es';
}

const GENDER_COLORS_MAP = {
    de: {
        der: 'bg-blue-200 dark:bg-blue-800',
        die: 'bg-pink-200 dark:bg-pink-800',
        das: 'bg-green-200 dark:bg-green-800',
    },
    es: {
        el: 'bg-blue-200 dark:bg-blue-800',
        la: 'bg-pink-200 dark:bg-pink-800',
    },
} as const;

const WrongAnswersSummary = ({ wrongAnswers, targetLanguage }: WrongAnswersSummaryProps) => {
    const GENDER_COLORS = GENDER_COLORS_MAP[targetLanguage];

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          Words to Practice
        </h3>

        <div className="space-y-4">
          {wrongAnswers.map((answer, index) => (
            <div
              key={index}
              className={`flex items-center ${
                GENDER_COLORS[answer.correctAnswer as keyof typeof GENDER_COLORS]
              } justify-between p-4 rounded-lg transition-colors`}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-xl font-semibold text-gray-800 dark:text-white">
                    {answer.correctAnswer.charAt(0).toUpperCase() + answer.correctAnswer.slice(1)} {answer.word}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {answer.translation}
                  </span>
                </div>

                <div className="mt-2 flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <FaTimesCircle className="text-red-600 dark:text-red-400 w-4 h-4" />
                    <span className="text-sm text-red-600 dark:text-red-400">
                      Your answer: {answer.userAnswer}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaCheckCircle className="text-green-600 dark:text-green-400 w-4 h-4" />
                    <span className="text-sm text-green-600 dark:text-green-400">
                      Correct: {answer.correctAnswer}
                    </span>
                  </div>
                </div>
              </div>

              {/* <button
                className="ml-4 px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors text-sm font-medium"
                onClick={() => answer.onAddToStudyList?.(answer)}
              >
                Add to Study List
              </button> */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WrongAnswersSummary;
