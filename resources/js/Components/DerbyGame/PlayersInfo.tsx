import { FaCrown, FaUser, FaCheck } from 'react-icons/fa';

interface Player {
  id: number;
  user_id: number;
  player_name: string;
  score: number;
  progress: number;
  is_ready: boolean;
  is_guest: boolean;
}

interface PlayersInfoProps {
  players: Player[];
  currentUserId: number;
  hostId: number;
  status: 'waiting' | 'in_progress' | 'completed';
}

export default function PlayersInfo({ players, currentUserId, hostId, status }: PlayersInfoProps) {
  const sortedPlayers = [...players].sort((a, b) => {
    if (status === 'completed' || status === 'in_progress') {
      return b.progress - a.progress;
    }
    return 0;
  });

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-md">
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
        <FaUser />
        Players ({players.length})
      </h3>

      <div className="space-y-3">
        {sortedPlayers.map((player, index) => {
          const isCurrentUser = player.user_id === currentUserId;
          const isHost = player.user_id === hostId;
          const isLeader = index === 0 && (status === 'in_progress' || status === 'completed');

          return (
            <div
              key={player.id}
              className={`p-3 rounded-lg transition-all ${
                isCurrentUser
                  ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  {isLeader && status === 'in_progress' && (
                    <FaCrown className="text-yellow-500 w-4 h-4" />
                  )}
                  {status === 'completed' && index === 0 && (
                    <span className="text-2xl">🥇</span>
                  )}
                  {status === 'completed' && index === 1 && (
                    <span className="text-2xl">🥈</span>
                  )}
                  {status === 'completed' && index === 2 && (
                    <span className="text-2xl">🥉</span>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-sm ${
                        isCurrentUser ? 'text-blue-900 dark:text-blue-100' : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {player.player_name}
                        {isCurrentUser && ' (You)'}
                      </span>
                      {isHost && (
                        <FaCrown className="text-purple-500 w-3 h-3" title="Host" />
                      )}
                      {player.is_guest && (
                        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">
                          Guest
                        </span>
                      )}
                    </div>

                    {status === 'waiting' && (
                      <div className="flex items-center gap-1 mt-1">
                        {player.is_ready ? (
                          <>
                            <FaCheck className="text-green-500 w-3 h-3" />
                            <span className="text-xs text-green-600 dark:text-green-400">Ready</span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">Not ready</span>
                        )}
                      </div>
                    )}

                    {(status === 'in_progress' || status === 'completed') && (
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {Math.round(player.progress * 100)}%
                        </span>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {player.score} pts
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress bar for in-progress/completed */}
              {(status === 'in_progress' || status === 'completed') && (
                <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${player.progress * 100}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
