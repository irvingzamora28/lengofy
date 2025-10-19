import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { MdClose } from 'react-icons/md';
import Track from '@/Components/DerbyGame/Track';
import PromptPanel from '@/Components/DerbyGame/PromptPanel';
import { useTranslation } from 'react-i18next';

interface Prompt {
  id: number;
  mode: 'article_gender' | 'translation' | 'verb_conjugation';
  word: string;
  options: string[];
  correct_answer: string;
  translation?: string;
  tense?: string;
  person?: string;
  gender?: string;
}

interface Props extends PageProps {
  prompts: Prompt[];
  difficulty: 'easy' | 'medium' | 'hard';
  race_duration_s: number;
  total_segments: number;
  language_name: string;
}

const DIFFICULTY_CONFIG = {
  easy: { answer_window_ms: 6000, points_correct: 10, points_incorrect: 0 },
  medium: { answer_window_ms: 4000, points_correct: 15, points_incorrect: 0 },
  hard: { answer_window_ms: 2500, points_correct: 20, points_incorrect: 0 },
};

export default function Practice({ auth, prompts, difficulty, race_duration_s, total_segments, language_name }: Props) {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState(0);
  const [lastAnswer, setLastAnswer] = useState<any>(null);
  const [gameStatus, setGameStatus] = useState<'playing' | 'completed'>('playing');
  const [startTime, setStartTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(race_duration_s);
  const { t: trans } = useTranslation();

  const currentPrompt = prompts[currentPromptIndex];
  const config = DIFFICULTY_CONFIG[difficulty];

  // Timer countdown
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, race_duration_s - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setGameStatus('completed');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameStatus, startTime, race_duration_s]);

  const handleAnswer = (answer: string, elapsedMs: number) => {
    if (!currentPrompt) return;

    const isCorrect = answer === currentPrompt.correct_answer;
    
    setLastAnswer({
      correct: isCorrect,
      answer: answer,
      user_id: auth.user.id,
      player_name: auth.user.name,
    });

    if (isCorrect) {
      const newScore = score + config.points_correct;
      const newProgress = Math.min(1, progress + (1 / total_segments));
      
      setScore(newScore);
      setProgress(newProgress);

      // Check if race is complete
      if (newProgress >= 1) {
        setGameStatus('completed');
        return;
      }
    }

    // Move to next prompt after a short delay
    setTimeout(() => {
      setLastAnswer(null);
      if (currentPromptIndex < prompts.length - 1) {
        setCurrentPromptIndex(currentPromptIndex + 1);
      } else {
        // Loop back to start if we run out of prompts
        setCurrentPromptIndex(0);
      }
    }, 1500);
  };

  const handleExit = () => {
    router.visit('/games/derby');
  };

  const handleRestart = () => {
    setCurrentPromptIndex(0);
    setScore(0);
    setProgress(0);
    setLastAnswer(null);
    // Reset timers
    setStartTime(Date.now());
    setTimeRemaining(race_duration_s);
    // Resume game
    setGameStatus('playing');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const player = {
    id: 1,
    user_id: auth.user.id,
    player_name: auth.user.name,
    score: score,
    progress: progress,
    is_ready: true,
    is_guest: false,
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-100 leading-tight">
            Derby Practice - {language_name}
          </h2>
          <button
            onClick={handleExit}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            <MdClose size={24} />
          </button>
        </div>
      }
    >
      <Head title="Derby Practice" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
              {/* Game Info */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 shadow-md mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {difficulty.toUpperCase()}
                    </div>
                    <div className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      PRACTICE
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Time</div>
                      <div className={`font-mono text-lg font-bold ${timeRemaining < 30 ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}`}>
                        {formatTime(timeRemaining)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
                      <div className="font-bold text-lg text-gray-800 dark:text-gray-200">{score}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
                      <div className="font-bold text-lg text-gray-800 dark:text-gray-200">{Math.round(progress * 100)}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {gameStatus === 'playing' ? (
                <>
                  <Track
                    players={[player]}
                    currentUserId={auth.user.id}
                    status="in_progress"
                  />

                  {currentPrompt && (
                    <PromptPanel
                      prompt={{
                        id: currentPrompt.id,
                        mode: currentPrompt.mode,
                        word: currentPrompt.word,
                        options: currentPrompt.options,
                        answerWindowMs: config.answer_window_ms,
                        tense: currentPrompt.tense,
                        person: currentPrompt.person,
                        translation: currentPrompt.translation,
                      }}
                      difficulty={difficulty}
                      onAnswer={handleAnswer}
                      lastAnswer={lastAnswer}
                      currentUserId={auth.user.id}
                    />
                  )}
                </>
              ) : (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-8 text-center">
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                    🏁 Practice Complete!
                  </h3>
                  <div className="space-y-2 mb-6">
                    <div className="text-xl">
                      <span className="font-bold">Final Score:</span> {score} points
                    </div>
                    <div className="text-xl">
                      <span className="font-bold">Progress:</span> {Math.round(progress * 100)}%
                    </div>
                    {progress >= 1 && (
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-4">
                        🎉 You finished the race!
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={handleRestart}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                    >
                      Practice Again
                    </button>
                    <button
                      onClick={handleExit}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                    >
                      Exit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
