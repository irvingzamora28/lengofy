import { MemoryTranslationGame } from "@/types";
import { useTranslation } from "react-i18next";
import Card from "./Card";
import { FaHourglassHalf } from "react-icons/fa";
import PrimaryButton from "../PrimaryButton";
import { useEffect } from "react";

interface MemoryTranslationGameAreaProps {
    game: MemoryTranslationGame;
    selectedCards: number[];
    matchedPairs: number[];
    isCurrentPlayerReady: boolean;
    onCardClick: (index: number) => void;
    onReady: () => void;
    currentUserId: number;
}

export default function GameArea({
    game,
    selectedCards,
    matchedPairs,
    isCurrentPlayerReady,
    onCardClick,
    onReady,
    currentUserId,
}: MemoryTranslationGameAreaProps) {
    const { t: trans } = useTranslation();

    useEffect(() => {
        console.log("isCurrentPlayerReady", isCurrentPlayerReady);
    }, []);

    if (game.status === "waiting") {
        return (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-2xl p-4 shadow-2xl transition-all duration-300 h-auto flex flex-col">
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                    <FaHourglassHalf className="text-5xl text-indigo-500 dark:text-indigo-400 animate-pulse" />
                    <div className="text-xl text-gray-700 dark:text-gray-300 font-medium">
                        {trans("gender_duel.waiting_for_players")}
                    </div>
                    {!isCurrentPlayerReady && (
                        <PrimaryButton
                            onClick={onReady}
                            className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 px-6 py-3 text-lg font-bold rounded-full transition-all duration-300 transform hover:scale-105"
                        >
                            {trans("gender_duel.i_am_ready")}
                        </PrimaryButton>
                    )}
                </div>
            </div>
        );
    }

    if (game.status === "completed") {
        const winner = game.players.reduce((prev, current) =>
            prev.score > current.score ? prev : current
        );

        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <h3 className="text-xl font-semibold">
                    {trans("memory_translation.game_completed")}
                </h3>
                <p className="text-lg">
                    {trans("memory_translation.winner_announcement", {
                        name: winner.player_name,
                    })}
                </p>
                <div className="text-gray-600">
                    {trans("memory_translation.final_score")}: {winner.score}
                </div>
            </div>
        );
    }

    // In progress game state
    const currentTurnPlayer = game.players.find(player => player.user_id === game.current_turn);
    const isMyTurn = game.current_turn === currentUserId;

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-2xl p-4 shadow-2xl transition-all duration-300 h-auto">
            {game.status === "in_progress" && (
                <div className="bg-indigo-100 dark:bg-indigo-900 p-4 rounded-lg text-center mb-4">
                    <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        {isMyTurn
                            ? trans("memory_translation.your_turn")
                            : trans("memory_translation.players_turn", { name: currentTurnPlayer?.player_name || "" })}
                    </span>
                </div>
            )}
            <div className="grid grid-cols-4 gap-4 p-4">
                {game.words.map((word, index) => (
                    <Card
                        key={index}
                        index={index}
                        word={word}
                        isFlipped={
                            selectedCards.includes(index) ||
                            matchedPairs.includes(index)
                        }
                        isMatched={matchedPairs.includes(index)}
                        onClick={() => onCardClick(index)}
                    />
                ))}
            </div>
        </div>
    );
}
