import { FaClock, FaTrophy, FaFlag } from 'react-icons/fa';

interface GameInfoProps {
  game: {
    id: number;
    difficulty: 'easy' | 'medium' | 'hard';
    race_mode: 'time' | 'distance';
    race_duration_s: number;
    total_segments: number;
    language_name: string;
    status: 'waiting' | 'in_progress' | 'completed';
  };
  timeRemaining: number;
  isHost: boolean;
}

export default function GameInfo({ game, timeRemaining, isHost }: GameInfoProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FaFlag className="text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {game.language_name}
            </span>
          </div>

          <div className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor(game.difficulty)}`}>
            {game.difficulty.toUpperCase()}
          </div>

          {isHost && (
            <div className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              HOST
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          {game.race_mode === 'time' && game.status === 'in_progress' && (
            <div className="flex items-center gap-2">
              <FaClock className={`${timeRemaining < 30 ? 'text-red-600 animate-pulse' : 'text-gray-600 dark:text-gray-400'}`} />
              <span className={`font-mono text-lg font-bold ${timeRemaining < 30 ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}

          {game.race_mode === 'distance' && (
            <div className="flex items-center gap-2">
              <FaTrophy className="text-yellow-600 dark:text-yellow-400" />
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                First to {game.total_segments} segments
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
