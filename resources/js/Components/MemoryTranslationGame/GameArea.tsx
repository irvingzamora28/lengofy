import { MemoryTranslationGame } from "@/types";
import { useTranslation } from "react-i18next";
import { FaHourglassHalf } from "react-icons/fa";
import { useState, useEffect } from "react";
import PrimaryButton from "../PrimaryButton";

interface CardWord {
    id: number;
    word: string;
    emoji?: string;
    isFlipped: boolean;
}

interface CardPreviewProps {
    cards: CardWord[];
    isVisible: boolean;
}


const CardPreview = ({ cards, isVisible }: CardPreviewProps) => {
  if (!isVisible || cards.length === 0) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center items-start pointer-events-none">
      <div className="flex gap-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className="
              bg-white dark:bg-gray-800
              rounded-xl
              border border-gray-200 dark:border-gray-700
              shadow-lg hover:shadow-xl
              p-6
              transform transition-all duration-300 ease-in-out
              animate-fade-in-down
              backdrop-blur-sm
              hover:-translate-y-1
              relative
              overflow-hidden
            "
          >
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 dark:to-gray-900 opacity-50" />

            {/* Card content */}
            <div className="relative text-center space-y-3">
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {card.word}
              </p>
              {card.emoji && (
                <p className="text-4xl transform hover:scale-110 transition-transform duration-200">
                  {card.emoji}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface CardProps {
    index: number;
    cardData: CardWord;
    isFlipped: boolean;
    isMatched: boolean;
    onClick: () => void;
}

const Card = ({ index, cardData, isFlipped, isMatched, onClick }: CardProps) => {
    return (
        <div
            className={`
                aspect-square relative cursor-pointer
                transform transition-all duration-300
                hover:scale-105 active:scale-95
                ${isMatched ? 'opacity-60' : 'opacity-100'}
            `}
            onClick={onClick}
        >
            <div className={`
                absolute inset-0 rounded-lg
                flex items-center justify-center
                ${isFlipped
                    ? 'bg-indigo-500 dark:bg-indigo-600'
                    : 'bg-white dark:bg-gray-700'}
                shadow-md
                transform transition-all duration-300
                ${isFlipped ? 'rotate-y-180' : 'rotate-y-0'}
            `}>
                {isFlipped && (
                    <div className="text-[8px] sm:text-xs text-white text-center p-1 break-words">
                        <p>{cardData.word}</p>
                        {cardData.emoji && <p>{cardData.emoji}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

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
    const [visibleCards, setVisibleCards] = useState<CardWord[]>([]);

    // Update visible cards whenever selected cards change
    useEffect(() => {
        const cards = selectedCards.map(index => game.words[index]);
        setVisibleCards(cards);
    }, [selectedCards, game.words]);

    // Determine grid columns based on number of cards
    const gridCols = game.words.length <= 20
        ? "grid-cols-4 sm:grid-cols-5"
        : game.words.length <= 48
            ? "grid-cols-6 sm:grid-cols-8"
            : "grid-cols-8 sm:grid-cols-10";

    if (game.status === "waiting") {
        return (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-2xl p-4 shadow-2xl transition-all duration-300">
                <div className="flex flex-col items-center justify-center p-4 space-y-4">
                    <FaHourglassHalf className="text-4xl text-indigo-500 dark:text-indigo-400 animate-pulse" />
                    <div className="text-lg text-center text-gray-700 dark:text-gray-300 font-medium">
                        {trans("memory_translation.waiting_for_players")}
                    </div>
                    {!isCurrentPlayerReady && (
                        <PrimaryButton
                            onClick={onReady}
                            className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 px-6 py-3 text-lg font-bold rounded-full transition-all duration-300 transform hover:scale-105"
                        >
                            {trans("memory_translation.i_am_ready")}
                        </PrimaryButton>
                    )}
                </div>
            </div>
        );
    }

    if (game.status === "completed") {
        const playersWithMaxScore = game.players.filter(player => player.score === game.players[0].score);
        const winner = playersWithMaxScore.length === 1 ? playersWithMaxScore[0] : null;

        return (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-2xl p-4 shadow-2xl">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        {trans("generals.games.game_completed")}
                    </h3>
                    <p className="text-lg text-gray-700 dark:text-gray-300">
                        {winner
                            ? trans("generals.games.winner_announcement", { name: winner.player_name })
                            : trans("generals.games.tie")}
                    </p>
                    <div className="text-gray-600 dark:text-gray-400">
                        {trans("generals.games.final_score")}: {playersWithMaxScore[0].score}
                    </div>
                </div>
            </div>
        );
    }

    const currentTurnPlayer = game.players.find(player => player.user_id === game.current_turn);
    const isMyTurn = game.current_turn === currentUserId;

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-2xl p-2 shadow-2xl transition-all duration-300">
            <CardPreview
                cards={visibleCards}
                isVisible={visibleCards.length > 0}
            />

            {game.status === "in_progress" && (
                <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg text-center mb-2">
                    <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                        {isMyTurn
                            ? trans("memory_translation.your_turn")
                            : trans("memory_translation.players_turn", {
                                name: currentTurnPlayer?.player_name || ""
                            })}
                    </span>
                </div>
            )}

            <div className={`grid ${gridCols} gap-1 p-1`}>
                {game.words.map((word, index) => (
                    <Card
                        key={index}
                        index={index}
                        cardData={word}
                        isFlipped={selectedCards.includes(index) || matchedPairs.includes(index)}
                        isMatched={matchedPairs.includes(index)}
                        onClick={() => onCardClick(index)}
                    />
                ))}
            </div>
        </div>
    );
}
