import { useTranslation } from 'react-i18next';

interface PlayersInfoProps {
    players: any[];
    currentUserId: number;
}

export default function PlayersInfo({ players, currentUserId }: PlayersInfoProps) {
    const { t: trans } = useTranslation();
    
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-bold mb-4 border-b pb-2">
                {trans('word_search_puzzle.players')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {players.map((player) => (
                    <div
                        key={player.id}
                        className={`p-3 rounded-lg ${
                            player.user_id === currentUserId
                                ? 'bg-blue-50 dark:bg-blue-900/30'
                                : 'bg-gray-50 dark:bg-gray-700/30'
                        }`}
                    >
                        <div className="flex justify-between items-center">
                            <span className="font-semibold">{player.player_name}</span>
                            <span>
                                {trans('word_search_puzzle.words_found')}: {
                                    Array.from(player.words_found || new Set()).length
                                }
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}