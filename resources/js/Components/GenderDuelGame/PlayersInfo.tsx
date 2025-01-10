import { FaUser, FaCheckCircle, FaTrophy } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface Player {
    id: number;
    player_name: string;
    score: number;
    is_ready: boolean;
}

interface PlayersInfoProps {
    status: string;
    players: Player[];
    currentPlayerId?: number;
}

export default function PlayersInfo({ players, currentPlayerId }: PlayersInfoProps) {
    if (players.length === 0) return null;

    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const { t: trans } = useTranslation();

    return (
        <div className="mt-6 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-xl p-6 shadow-lg">
            <h3 className="hidden md:flex text-indigo-800 dark:text-indigo-200 font-bold items-center gap-2 mb-4 text-xl">
                <FaUser className="text-indigo-600 dark:text-indigo-400" /> {trans('gender_duel.players')}
            </h3>
            <div className="space-y-3">
                {sortedPlayers.map((player, index) => (
                    <div
                        key={player.id}
                        className={`flex items-center justify-between rounded-lg px-4 py-3 transition-all duration-300 ease-in-out
                            ${player.is_ready ? 'bg-green-200 dark:bg-green-800' : 'bg-white dark:bg-gray-800'}
                            ${currentPlayerId === player.id ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            {index === 0 && player.score > 0 && <FaTrophy className="text-yellow-500" />}
                            <span className={`
                                ${currentPlayerId === player.id ? 'font-extrabold text-gray-800 dark:text-white' : 'font-semibold text-gray-600 dark:text-gray-300'}
                                text-md md:text-lg`
                            }>
                                {player.player_name}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
                            <span className="bg-indigo-200 dark:bg-indigo-700 px-3 py-1 rounded-full font-bold">
                                {player.score}
                            </span>
                            {player.is_ready && status === 'waiting' && (
                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold animate-pulse">
                                    <FaCheckCircle/>
                                    {trans('gender_duel.ready')}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
