import { WordSearchPuzzlePlayer } from '@/types';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

interface Props {
    status: string;
    players: WordSearchPuzzlePlayer[];
    currentUserId: number;
}

export default function PlayersInfo({ status, players, currentUserId }: Props) {
    const { t: trans } = useTranslation();

    return (
        <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                {trans("word_search_puzzle.players")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {players.map((player) => (
                    <div
                        key={player.id}
                        className={`
                            p-4 rounded-lg shadow
                            ${
                                player.user_id === currentUserId
                                    ? "bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700"
                                    : "bg-gray-50 dark:bg-gray-800"
                            }
                            ${player.is_ready ? "border-green-300 dark:border-green-500" : ""}
                        `}
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {player.player_name}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {status === "waiting" && (
                                        player.is_ready ? (
                                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                                                <FaCheckCircle />
                                                {trans("generals.ready")}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold animate-pulse">
                                                <FaTimesCircle />
                                                {trans("generals.not_ready")}
                                            </span>
                                        )
                                    )}
                                </span>
                            </div>
                            <div className="flex space-x-4">
                                <div className="text-center">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {trans("word_search_puzzle.words_found")}
                                    </div>
                                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                                        {Array.from(player.words_found || new Set()).length}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
