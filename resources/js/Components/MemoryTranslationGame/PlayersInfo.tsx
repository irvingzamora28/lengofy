import { MemoryTranslationGamePlayer } from "@/types";
import { useTranslation } from "react-i18next";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

interface Props {
    status: string;
    players: MemoryTranslationGamePlayer[];
    currentUserId: number;
}

export default function PlayersInfo({ status, players, currentUserId }: Props) {
    const { t: trans } = useTranslation();

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    return (
        <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">
                {trans("memory_translation.players")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {players.map((player) => (
                    <div
                        key={player.id}
                        className={`
                            p-4 rounded-lg shadow
                            ${
                                player.user_id === currentUserId
                                    ? "bg-blue-50 border border-blue-200"
                                    : "bg-gray-50"
                            }
                            ${player.is_ready ? "border-green-300" : ""}
                        `}
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="font-semibold">
                                    {player.player_name}
                                </span>
                                <span className="text-sm text-gray-600">
                                    {/* if status is wating */}
                                    {status === "waiting" &&
                                    (
                                        // If player is ready
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
                                    {status === "playing" && (
                                        <>

                                        </>
                                    )}
                                </span>
                            </div>
                            <div className="flex space-x-4">
                                <div className="text-center">
                                    <div className="text-sm text-gray-600">
                                        {trans("memory_translation.moves")}
                                    </div>
                                    <div className="font-semibold">
                                        {player.moves}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-sm text-gray-600">
                                        {trans("memory_translation.time")}
                                    </div>
                                    <div className="font-semibold">
                                        {formatTime(player.time)}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-sm text-gray-600">
                                        {trans("memory_translation.score")}
                                    </div>
                                    <div className="font-semibold">
                                        {player.score}
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
