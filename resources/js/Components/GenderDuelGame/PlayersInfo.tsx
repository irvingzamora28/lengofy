import { FaUser, FaCheckCircle } from 'react-icons/fa';

interface Player {
    id: number;
    player_name: string;
    score: number;
    is_ready: boolean;
}

interface PlayersInfoProps {
    players: Player[];
    currentPlayerId?: number;
}

export default function PlayersInfo({ players, currentPlayerId }: PlayersInfoProps) {
    if (players.length === 0) return null;

    return (
        <div className="mt-6 text-sm text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-800/70 rounded-lg p-4">
            <h3 className="text-gray-800 dark:text-gray-200 font-semibold flex items-center gap-2 mb-2 text-base">
                <FaUser /> Players
            </h3>
            <div className="space-y-2">
                {players.map((player) => (
                    <div
                        key={player.id}
                        className={`flex items-center justify-between rounded px-3 py-2
                            ${player.is_ready ? 'bg-green-50 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'}`}
                    >
                        <span className={`
                            ${currentPlayerId === player.id ? 'underline font-bold' : 'font-medium'}
                            text-gray-800 dark:text-gray-100`
                        }>
                            {player.player_name}
                        </span>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
                            <span>Score: {player.score}</span>
                            {player.is_ready && (
                                <span className="flex items-center gap-1 text-green-600 dark:text-green-300 font-semibold">
                                    <FaCheckCircle/>
                                    Ready
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
