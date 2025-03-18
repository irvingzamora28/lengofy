import { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface Player {
    id: number;
    name: string;
    score: number;
    is_ready: boolean;
}

interface PlayerListProps {
    players: Player[];
    currentPlayerId: number;
    onReady: () => void;
    gameStatus: string;
}

const PlayerList: FC<PlayerListProps> = ({
    players,
    currentPlayerId,
    onReady,
    gameStatus
}) => {
    const { t } = useTranslation();
    const currentPlayer = players.find(p => p.id === currentPlayerId);

    return (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                {t('games.players')}
            </h3>
            <div className="space-y-3">
                {players.map((player) => (
                    <div
                        key={player.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                    >
                        <div className="flex items-center">
                            <span className="text-gray-900 dark:text-gray-100">
                                {player.name}
                                {player.id === currentPlayerId && ` (${t('games.you')})`}
                            </span>
                            {player.is_ready && (
                                <span className="ml-2 text-green-500">✓</span>
                            )}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {player.score}
                        </span>
                    </div>
                ))}
            </div>

            {gameStatus === 'waiting' && currentPlayer && !currentPlayer.is_ready && (
                <button
                    onClick={onReady}
                    className="w-full mt-4 px-4 py-2 bg-green-500 text-white rounded-lg
                             hover:bg-green-600 transition"
                >
                    {t('games.ready')}
                </button>
            )}
        </div>
    );
};

export default PlayerList;
