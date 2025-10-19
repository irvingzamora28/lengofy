import { useEffect, useState } from 'react';
import { FaHorse } from 'react-icons/fa';

interface Player {
  id: number;
  user_id: number;
  player_name: string;
  progress: number;
  score: number;
}

interface TrackProps {
  players: Player[];
  currentUserId: number;
  status: 'waiting' | 'in_progress' | 'completed';
}

const PLAYER_COLORS = [
  'bg-blue-500',
  'bg-red-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
];

export default function Track({ players, currentUserId, status }: TrackProps) {
  const [visualProgress, setVisualProgress] = useState<Record<number, number>>({});

  // Initialize visual progress
  useEffect(() => {
    const initial: Record<number, number> = {};
    players.forEach(p => {
      initial[p.id] = p.progress;
    });
    setVisualProgress(initial);
  }, []);

  // Smooth progress interpolation
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];

    players.forEach(player => {
      const target = player.progress;
      const current = visualProgress[player.id] || 0;

      if (Math.abs(target - current) > 0.001) {
        const interval = setInterval(() => {
          setVisualProgress(prev => {
            const currentVal = prev[player.id] || 0;
            const diff = target - currentVal;
            
            if (Math.abs(diff) < 0.001) {
              clearInterval(interval);
              return { ...prev, [player.id]: target };
            }

            // Lerp with easing
            const newVal = currentVal + diff * 0.15;
            return { ...prev, [player.id]: newVal };
          });
        }, 16); // ~60fps

        intervals.push(interval);
      }
    });

    return () => {
      intervals.forEach(clearInterval);
    };
  }, [players.map(p => p.progress).join(',')]);

  return (
    <div className="bg-gradient-to-b from-green-100 to-green-200 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 sm:p-6 relative overflow-hidden">
      {/* Finish line */}
      <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-b from-yellow-400 via-white to-yellow-400 opacity-50" />
      
      <div className="space-y-4">
        {players.map((player, index) => {
          const progress = visualProgress[player.id] || 0;
          const isCurrentUser = player.user_id === currentUserId;
          const colorClass = PLAYER_COLORS[index % PLAYER_COLORS.length];

          return (
            <div key={player.id} className="relative">
              {/* Lane */}
              <div className="h-16 bg-white dark:bg-gray-600 rounded-lg relative overflow-hidden shadow-inner">
                {/* Progress bar background */}
                <div 
                  className={`absolute inset-y-0 left-0 ${colorClass} opacity-20 transition-all duration-300`}
                  style={{ width: `${progress * 100}%` }}
                />

                {/* Horse */}
                <div
                  className={`absolute inset-y-0 flex items-center transition-all duration-300 ease-out ${
                    isCurrentUser ? 'z-10' : 'z-0'
                  }`}
                  style={{ 
                    left: `${Math.min(progress * 100, 95)}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className={`${colorClass} rounded-full p-2 shadow-lg ${
                    status === 'in_progress' ? 'animate-bounce' : ''
                  }`}>
                    <FaHorse className="text-white w-6 h-6" />
                  </div>
                </div>

                {/* Player name and progress */}
                <div className="absolute inset-0 flex items-center justify-between px-4">
                  <span className={`font-bold text-sm ${isCurrentUser ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {player.player_name}
                    {isCurrentUser && ' (You)'}
                  </span>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {Math.round(progress * 100)}%
                  </span>
                </div>
              </div>

              {/* Dust particles on movement */}
              {status === 'in_progress' && progress > 0.01 && (
                <div 
                  className="absolute bottom-0 opacity-30"
                  style={{ 
                    left: `${Math.min(progress * 100, 95)}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="text-gray-400 text-xs">💨</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Parallax background decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-blue-300 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-green-600 to-transparent" />
      </div>
    </div>
  );
}
