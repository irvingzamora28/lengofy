import { MemoryTranslationGame } from "@/types";
import { useTranslation } from "react-i18next";
import { FaHourglassHalf } from "react-icons/fa";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PrimaryButton from "../PrimaryButton";
import { throttle } from "lodash";

interface CardWord {
    id: number;
    word: string;
    gender: string;
    emoji?: string;
    isFlipped: boolean;
}

interface PreviewCardsProps {
    cards: Array<{
        id: number;
        word: string;
        emoji?: string;
    }>;
    cardPositions: Map<number, DOMRect>;
}

const PreviewCards = ({ cards, cardPositions }: PreviewCardsProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const CARD_HEIGHT = 80;
    const CARD_SPACING = 24;

    return (
        <div ref={containerRef} className="fixed inset-x-0 top-4 z-50 flex justify-center items-start pointer-events-none">
            <div className="relative w-full max-w-[90vw]" style={{ minHeight: `${CARD_HEIGHT}px` }}>
                <AnimatePresence>
                    {cards.map((card, index) => {
                        const containerRect = containerRef.current?.getBoundingClientRect();
                        const position = cardPositions.get(card.id);

                        if (!position || !containerRect) return null;

                        // Calculate positions relative to viewport
                        const containerCenterX = containerRect.left + (containerRect.width / 2);
                        const cardCenterX = position.left + (position.width / 2);
                        const initialX = cardCenterX - containerCenterX;
                        const initialY = position.top - containerRect.top;

                        // Calculate final card width based on container size
                        const finalWidth = Math.min(containerRect.width * 0.9, position.width * 2);

                        return (
                            <motion.div
                                key={card.id}
                                initial={{
                                    x: initialX,
                                    y: initialY,
                                    width: position.width,
                                    height: position.height,
                                    scale: 1,
                                    opacity: 1
                                }}
                                animate={{
                                    x: -finalWidth / 2, // Center the card by offsetting half its width
                                    y: index * (CARD_HEIGHT + CARD_SPACING),
                                    width: finalWidth,
                                    height: CARD_HEIGHT,
                                    scale: 1.2
                                }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 200,
                                    damping: 20,
                                    restDelta: 0.1
                                }}
                                className="absolute left-1/2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-2 backdrop-blur-sm"
                            >
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <p className="text-lg sm:text-xl font-semibold dark:text-gray-100 truncate">
                                            {card.word}
                                        </p>
                                        {card.emoji && <p className="text-2xl sm:text-3xl">{card.emoji}</p>}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

interface CardProps {
    cardData: CardWord;
    isFlipped: boolean;
    isMatched: boolean;
    onClick: () => void;
}

const Card = ({ cardData, isFlipped, isMatched, onClick }: CardProps) => {
    return (
        <div
            data-card-id={cardData.id}
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
                ${isFlipped ? 'bg-indigo-500 dark:bg-indigo-600' : 'bg-white dark:bg-gray-700'}
                shadow-md transition-all duration-300
                ${isFlipped ? 'rotate-y-180' : 'rotate-y-0'}
            `}>
                {isFlipped && (
                    <div className="text-[8px] sm:text-xs text-white text-center p-1 break-words">
                        <p>{cardData.gender} {cardData.word}</p>
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
    onRestart?: () => void;
}

export default function GameArea({
    game,
    selectedCards,
    matchedPairs,
    isCurrentPlayerReady,
    onCardClick,
    onReady,
    currentUserId,
    onRestart,
}: MemoryTranslationGameAreaProps) {
    const { t: trans } = useTranslation();
    const [cardPositions, setCardPositions] = useState<Map<number, DOMRect>>(new Map());

    // Update all card positions on mount and resize
    const updateCardPositions = useCallback(throttle(() => {
        const newPositions = new Map<number, DOMRect>();
        game.words.forEach(word => {
            const element = document.querySelector(`[data-card-id="${word.id}"]`);
            if (element) {
                newPositions.set(word.id, element.getBoundingClientRect());
            }
        });
        setCardPositions(newPositions);
    }, 200), [game.words]);

    useEffect(() => {
        updateCardPositions();
        window.addEventListener('resize', updateCardPositions);
        return () => window.removeEventListener('resize', updateCardPositions);
    }, [updateCardPositions]);

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
        const maxScore = Math.max(...game.players.map(player => player.score));
        const playersWithMaxScore = game.players.filter(player => player.score === maxScore);
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
                    {onRestart && currentUserId === game.hostId && (
                        <PrimaryButton
                            onClick={onRestart}
                            className="mt-4 bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 px-6 py-2 text-lg font-bold rounded-full transition-all duration-300 transform hover:scale-105"
                        >
                            {trans("memory_translation.restart_game")}
                        </PrimaryButton>
                    )}
                </div>
            </div>
        );
    }

    const currentTurnPlayer = game.players.find(player => player.user_id === game.current_turn);
    const isMyTurn = game.current_turn === currentUserId;

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-2xl p-2 shadow-2xl transition-all duration-300">
            <PreviewCards
                cards={selectedCards.map(index => ({
                    id: game.words[index].id,
                    word: `${game.words[index].gender} ${game.words[index].word}`,
                    emoji: game.words[index].emoji
                }))}
                cardPositions={cardPositions}
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
                        key={word.id}
                        cardData={{
                            ...word,
                            isFlipped: selectedCards.includes(index) || matchedPairs.includes(index)
                        }}
                        isFlipped={selectedCards.includes(index) || matchedPairs.includes(index)}
                        isMatched={matchedPairs.includes(index)}
                        onClick={() => onCardClick(index)}
                    />
                ))}
            </div>
        </div>
    );
}
