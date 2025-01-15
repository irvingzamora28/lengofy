import React, { useState, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import { Noun, PageProps } from "@/types";
import { MdClose } from "react-icons/md";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import correctSound from "@/assets/audio/correct.mp3";
import incorrectSound from "@/assets/audio/incorrect.mp3";
import DifficultyModal from "@/Components/Games/DifficultyModal";
import { useTranslation } from "react-i18next";

interface CardData {
    word: string;
    translation: string;
    emoji: string;
}

interface MemoryCard {
    id: string;
    text: string;
    pairId: string;
    isFlipped: boolean;
}

interface MemoryTranslationGamePracticeProps extends PageProps {
    auth: any;
    nouns: Noun[];
    difficulty: "easy" | "medium" | "hard";
    category: number;
    targetLanguage: "de" | "es";
}

const createCardPairs = (nouns: Noun[]): MemoryCard[] => {
    const cardPairs: MemoryCard[] = [];

    nouns.forEach((noun, index) => {
        const wordCard: MemoryCard = {
            id: `word-${index}`,
            text: noun.word,
            pairId: `pair-${index}`,
            isFlipped: false,
        };
        const translationCard: MemoryCard = {
            id: `translation-${index}`,
            text: (nouns.find((noun) => noun.word === noun.translation)?.word ||
                noun.translation) as string,
            pairId: `pair-${index}`,
            isFlipped: false,
        };

        cardPairs.push(wordCard, translationCard);
    });

    return cardPairs;
};

const MemoryTranslationGamePractice: React.FC<
    MemoryTranslationGamePracticeProps
> = ({
    auth,
    nouns,
    difficulty = "medium",
    category = 0,
    targetLanguage = "de",
}) => {
    const [cards, setCards] = useState<MemoryCard[]>([]);
    const [flippedCards, setFlippedCards] = useState<MemoryCard[]>([]);
    const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
    const [score, setScore] = useState(0);
    const [isChecking, setIsChecking] = useState(false);
    const [moves, setMoves] = useState(0);
    const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard">(difficulty);
    const [selectedCategory, setSelectedCategory] = useState<number>(category);
    const [showDifficultyModal, setShowDifficultyModal] = useState(false);
    const [gameStartTime] = useState(Date.now());
    const [gameEndTime, setGameEndTime] = useState<number | null>(null);
    const [isGameOver, setIsGameOver] = useState(false);
    const [cardsToFlipDown, setCardsToFlipDown] = useState<string[]>([]);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const { t: trans } = useTranslation();

    useEffect(() => {
        const initializedCards = createCardPairs(nouns).sort(
            () => Math.random() - 0.5
        );
        setCards(initializedCards);
    }, []);

    const flipCardsDown = (cardIds: string[]) => {
        setCards((prevCards) =>
            prevCards.map((card) =>
                cardIds.includes(card.id) ? { ...card, isFlipped: false } : card
            )
        );
        setCardsToFlipDown([]);
        setFlippedCards([]);
        setIsChecking(false);
    };

    const flipCard = (cardId: string) => {
        // If the card is already matched or the same card is clicked again, do nothing
        if (matchedPairs.includes(cards.find(card => card.id === cardId)?.pairId || '') ||
            flippedCards.some(card => card.id === cardId)) {
            return;
        }

        const newCards = cards.map((card) =>
            card.id === cardId ? { ...card, isFlipped: true } : card
        );
        setCards(newCards);

        const selectedCard = newCards.find((card) => card.id === cardId);
        if (!selectedCard) return;

        if (flippedCards.length === 1) {
            setMoves((prev) => prev + 1);
            const [firstFlippedCard] = flippedCards;

            // If there's a pending timeout for previous cards, clear it
            if (timeoutId) {
                clearTimeout(timeoutId);
                setTimeoutId(null);
            }

            // If there are cards marked to be flipped down, flip them now
            if (cardsToFlipDown.length > 0) {
                setCards(prevCards =>
                    prevCards.map(card =>
                        cardsToFlipDown.includes(card.id) ? { ...card, isFlipped: false } : card
                    )
                );
                setCardsToFlipDown([]);
                // Reset flippedCards since we're starting fresh with the new card
                setFlippedCards([selectedCard]);
                return;
            }

            if (firstFlippedCard.pairId === selectedCard.pairId) {
                // Match found
                setScore((prevScore) => prevScore + 1);
                setMatchedPairs((prevPairs) => [...prevPairs, selectedCard.pairId]);
                setFlippedCards([]);
                playSound(correctSound);

                // Check if game is complete
                if (matchedPairs.length + 1 === nouns.length) {
                    setGameEndTime(Date.now());
                    setIsGameOver(true);
                }
            } else {
                // No match
                playSound(incorrectSound);
                setCardsToFlipDown([firstFlippedCard.id, selectedCard.id]);
                setFlippedCards([]);
                const newTimeoutId = setTimeout(() => {
                    setCards(prevCards =>
                        prevCards.map(card =>
                            card.id === firstFlippedCard.id || card.id === selectedCard.id
                                ? { ...card, isFlipped: false }
                                : card
                        )
                    );
                    setCardsToFlipDown([]);
                }, 1000);
                setTimeoutId(newTimeoutId);
            }
        } else {
            setFlippedCards([selectedCard]);
        }
    };

    const playSound = (sound: string) => {
        const audio = new Audio(sound);
        audio.play();
    };

    const leaveGame = () => {
        // Redirect to the lobby page using Inertia
        router.visit(route("dashboard"));
    };

    const handleExitClick = () => {
        leaveGame();
    };

    const restartGame = (fetchNewWords: boolean = false) => {
        setGameEndTime(null);
        setScore(0);
        setMatchedPairs([]);
        setCards(createCardPairs(nouns).sort(() => Math.random() - 0.5));
        if (fetchNewWords) {
            fetchWords();
        }
        setIsGameOver(false);
        setMoves(0);
    };

    const fetchWords = async () => {
        try {
            const response = await axios.get(route('games.memory-translation.get-words'), {
                params: {
                    category: selectedCategory,
                },
            });
            const initializedCards = createCardPairs(response.data).sort(
                () => Math.random() - 0.5
            );
            setCards(initializedCards);
        } catch (error) {
            console.error('Error fetching words:', error);
        }
    }

    const formatTime = (ms: number): string => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    if (isGameOver) {
        return (
            <AuthenticatedLayout
                header={
                    <div className="flex items-center">
                        <button
                            onClick={handleExitClick}
                            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition"
                        >
                            <MdClose size={24} />
                        </button>
                        <h2 className="ml-3 font-extrabold text-2xl text-indigo-700 dark:text-indigo-300">
                            Memory Translation - {trans('memory_translation.results')}
                        </h2>
                    </div>
                }
            >
                <Head title="Game Over" />
                <div className="w-full mt-10 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-black">
                    <div className="w-11/12 md:w-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                            {trans('memory_translation.game_completed')}
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                            {trans('memory_translation.score')}: <span className="font-bold">{score}</span>
                        </p>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                            {trans('memory_translation.moves')}: <span className="font-bold">{moves}</span>
                        </p>
                        {gameEndTime && (
                            <p className="text-lg text-gray-600 dark:text-gray-300">
                                {trans('memory_translation.time')}: <span className="font-bold">{formatTime(gameEndTime - gameStartTime)}</span>
                            </p>
                        )}
                        <div className="my-4 flex flex-col space-y-4">
                            <button
                                onClick={() => restartGame(false)}
                                className="bg-blue-500 dark:bg-blue-700 text-white py-2 px-4 self-center rounded-lg mb-2 sm:mb-0 w-full sm:w-1/2"
                            >
                                {trans('memory_translation.btn_restart')}
                            </button>
                            <button
                                onClick={() => setShowDifficultyModal(true)}
                                className="bg-green-500 dark:bg-green-700 text-white py-2 px-4 self-center rounded-lg w-full sm:w-1/2"
                            >
                                {trans('memory_translation.btn_change_difficulty')}
                            </button>
                        </div>

                        {/* Word List */}
                        <div className="mt-8">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                                {trans('memory_translation.words_in_this_game')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {nouns.map((noun, index) => (
                                    <div
                                        key={index}
                                        className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex items-center justify-between"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <span className="text-lg font-medium text-gray-700 dark:text-gray-200">
                                                {noun.word}
                                            </span>
                                            <span className="text-gray-400 dark:text-gray-400">→</span>
                                            <span className="text-lg font-medium text-gray-700 dark:text-gray-200">
                                                {noun.translation}
                                            </span>
                                        </div>
                                        {noun.emoji && (
                                            <span className="text-2xl">{noun.emoji}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                {showDifficultyModal && (
                    <DifficultyModal
                        showDifficultyModal={showDifficultyModal}
                        setShowDifficultyModal={setShowDifficultyModal}
                        selectedDifficulty={selectedDifficulty}
                        setSelectedDifficulty={setSelectedDifficulty}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        easyText={trans('memory_translation.modal_difficulty.easy_text')}
                        mediumText={trans('memory_translation.modal_difficulty.medium_text')}
                        hardText={trans('memory_translation.modal_difficulty.hard_text')}
                        startGame={() => {
                            router.visit(
                                route("games.memory-translation.practice", {
                                    difficulty: selectedDifficulty,
                                    category: selectedCategory,
                                })
                            );
                            setShowDifficultyModal(false);
                        }}
                        gameType="singlePlayer"
                        showCategories={true}
                    />
                )}
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center">
                        <h2 className="ml-3 font-extrabold text-2xl text-indigo-700 dark:text-indigo-300">
                            Memory Translation Game
                        </h2>
                    </div>
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button
                            onClick={handleExitClick}
                            className="flex items-center justify-center p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200"
                            title="Exit"
                        >
                            <MdClose className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Memory Translation Game Practice" />
            <div className="hidden grid-cols-5"></div>
            <div className="hidden grid-cols-6"></div>
            <div className="hidden md:grid-cols-8"></div>
            <div className="hidden md:grid-cols-5"></div>
            <div className="hidden grid-cols-4"></div>
            <div className=" flex w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-black">
                <div className="flex w-full pb-10 flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800">
                    <div
                        className={`grid grid-cols-${
                            difficulty === "hard"
                                ? 5
                                : difficulty === "medium"
                                ? 5
                                : 4
                        } md:grid-cols-${
                            difficulty === "hard"
                                ? 8
                                : difficulty === "medium"
                                ? 5
                                : 4
                        } gap-4 p-4 rounded-lg w-full max-w-4xl mx-auto mb-10`}
                    >
                        {cards.map((card) => (
                            <button
                                key={card.id}
                                className={`flex items-center justify-center rounded-lg shadow-lg p-4 h-16 md:h-24 transition duration-150 ease-in-out transform hover:scale-105 ${
                                    card.isFlipped ||
                                    matchedPairs.includes(card.pairId)
                                        ? "bg-indigo-600 dark:bg-indigo-800"
                                        : "bg-indigo-400 dark:bg-indigo-500"
                                } ${
                                    matchedPairs.includes(card.pairId)
                                        ? "cursor-not-allowed opacity-50"
                                        : ""
                                }`}
                                disabled={
                                    card.isFlipped ||
                                    matchedPairs.includes(card.pairId)
                                }
                                onClick={() => flipCard(card.id)}
                            >
                                {card.isFlipped ||
                                matchedPairs.includes(card.pairId) ? (
                                    <div className="flex flex-col items-center justify-center text-lg font-semibold text-white">
                                        <span className="text-lg md:text-2xl">
                                            {card.text}
                                        </span>
                                        <span className="text-lg md:text-2xl">
                                            {
                                                nouns.find(
                                                    (fc) =>
                                                        fc.word === card.text ||
                                                        fc.translation ===
                                                            card.text
                                                )?.emoji
                                            }
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-gray-200 text-lg font-semibold">
                                        {trans('memory_translation.flip')}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-800 shadow-md">
                        <p className="text-center text-xl text-white">
                            {trans('memory_translation.score')}: {score}
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default MemoryTranslationGamePractice;
