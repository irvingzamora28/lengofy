import React, { useState, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import { PageProps } from "@/types";
import { MdClose } from "react-icons/md";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import correctSound from '@/assets/audio/correct.mp3';
import incorrectSound from '@/assets/audio/incorrect.mp3';

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
    targetLanguage: 'de' | 'es';
}

const createCardPairs = (flashcards: CardData[]): MemoryCard[] => {
    const cardPairs: MemoryCard[] = [];

    flashcards.forEach((flashcard, index) => {
        const wordCard: MemoryCard = {
            id: `word-${index}`,
            text: flashcard.word,
            pairId: `pair-${index}`,
            isFlipped: false,
        };
        const translationCard: MemoryCard = {
            id: `translation-${index}`,
            text: flashcardsData.find((fc) => fc.word === flashcard.translation)?.word || flashcard.translation,
            pairId: `pair-${index}`,
            isFlipped: false,
        };

        cardPairs.push(wordCard, translationCard);
    });

    return cardPairs;
};

const flashcardsData: CardData[] = [
    { word: "Haus", translation: "House", emoji: "🏠" },
    { word: "Katze", translation: "Cat", emoji: "🐱" },
    { word: "Baum", translation: "Tree", emoji: "🌳" },
    { word: "Buch", translation: "Book", emoji: "📖" },
    { word: "Liebe", translation: "Love", emoji: "❤️" },
    { word: "Wasser", translation: "Water", emoji: "💧" },
    { word: "Feuer", translation: "Fire", emoji: "🔥" },
    { word: "Sonne", translation: "Sun", emoji: "☀️" },
    { word: "Mond", translation: "Moon", emoji: "🌕" },
    { word: "Stern", translation: "Star", emoji: "⭐" },
];

const MemoryTranslationGamePractice: React.FC<MemoryTranslationGamePracticeProps> = ({ auth, targetLanguage = 'de' }) => {

    const [cards, setCards] = useState<MemoryCard[]>([]);
    const [flippedCards, setFlippedCards] = useState<MemoryCard[]>([]);
    const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
    const [score, setScore] = useState(0);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        const initializedCards = createCardPairs(flashcardsData).sort(() => Math.random() - 0.5);
        setCards(initializedCards);
    }, []);

    const flipCard = (cardId: string) => {
        if (isChecking) return;

        const newCards = cards.map((card) => (card.id === cardId ? { ...card, isFlipped: true } : card));
        setCards(newCards);

        const selectedCard = newCards.find((card) => card.id === cardId);

        if (flippedCards.length === 1 && selectedCard) {
            setIsChecking(true);

            const [firstFlippedCard] = flippedCards;
            if (firstFlippedCard.pairId === selectedCard.pairId) {
                setScore((prevScore) => prevScore + 1);
                setMatchedPairs((prevMatchedPairs) => [...prevMatchedPairs, selectedCard.pairId]);
                setFlippedCards([]);
                playSound(correctSound);
                setIsChecking(false);
            } else {
                playSound(incorrectSound);
                setTimeout(() => {
                    setCards((prevCards) => prevCards.map((card) => (card.pairId === firstFlippedCard.pairId || card.pairId === selectedCard.pairId ? { ...card, isFlipped: false } : card)));
                    setFlippedCards([]);
                    setIsChecking(false);
                }, 1000);
            }
        } else {
            setFlippedCards([selectedCard].filter((card): card is MemoryCard => card !== undefined));
        }
    };

    const playSound = (sound: string) => {
        const audio = new Audio(sound);
        audio.play();
    };

    const leaveGame = () => {
        // Redirect to the lobby page using Inertia
        router.visit(route('dashboard'));
    };

    const handleExitClick = () => {
        leaveGame();
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center">
                        <h2 className="ml-3 font-extrabold text-2xl text-indigo-700 dark:text-indigo-300">
                            Memory TranslationGame
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
            <Head title="Practice" />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-black">
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800">
                    <div className="grid grid-cols-4 gap-4 p-4 rounded-lg w-full max-w-2xl mx-auto">
                        {cards.map((card) => (
                            <button
                                key={card.id}
                                className={`flex items-center justify-center rounded-lg shadow-lg p-4 h-24 transition duration-150 ease-in-out transform hover:scale-105 ${
                                    card.isFlipped || matchedPairs.includes(card.pairId) ? "bg-indigo-600 dark:bg-indigo-800" : "bg-indigo-400 dark:bg-indigo-500"
                                } ${matchedPairs.includes(card.pairId) ? "cursor-not-allowed opacity-50" : ""}`}
                                disabled={card.isFlipped || matchedPairs.includes(card.pairId)}
                                onClick={() => flipCard(card.id)}
                            >
                                {card.isFlipped || matchedPairs.includes(card.pairId) ? (
                                    <div className="flex flex-col items-center justify-center text-lg font-semibold text-white">
                                        <span>{card.text}</span>
                                        <span className="text-2xl">{flashcardsData.find((fc) => fc.word === card.text || fc.translation === card.text)?.emoji}</span>
                                    </div>
                                ) : (
                                    <div className="text-gray-200 text-lg font-semibold">Flip</div>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-800 shadow-md">
                        <p className="text-center text-xl text-white">Score: {score}</p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default MemoryTranslationGamePractice;
