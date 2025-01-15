import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
    FaBrain,
    FaLanguage,
    FaGamepad,
    FaPlay,
    FaGlobe,
} from "react-icons/fa";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head } from "@inertiajs/react";
import { Link } from "@inertiajs/react";

interface CardData {
    word: string;
    translation: string;
    emoji: string;
}

const FlipCard = ({ card, index, isFlipped }: { card: CardData; index: number; isFlipped: boolean }) => {
    return (
        <motion.div
            className="w-full sm:w-48 h-48 sm:h-64 relative cursor-pointer"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: "tween" }}
            style={{
                transformStyle: "preserve-3d",
            }}
        >
            {/* Front of card */}
            <div
                className="absolute inset-0 w-full h-full rounded-xl bg-white dark:bg-gray-800 flex flex-col items-center justify-center gap-4 shadow-lg border-2 border-indigo-100 dark:border-indigo-900"
                style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(0deg)"
                }}
            >
                <FaLanguage className="w-10 h-10 sm:w-16 sm:h-16 text-indigo-500 dark:text-indigo-400" />
            </div>

            {/* Back of card */}
            <div
                className="absolute inset-0 w-full h-full rounded-xl bg-indigo-600 dark:bg-indigo-700 flex flex-col items-center justify-center gap-4 shadow-lg border-2 border-indigo-500"
                style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)"
                }}
            >
                <span className="text-3xl sm:text-5xl mb-2">{card.emoji}</span>
                <span className="text-base sm:text-2xl font-bold text-white text-center px-2">
                    {index === 0 ? card.word : card.translation}
                </span>
            </div>
        </motion.div>
    );
};

const FlipCards = ({ data }: { data: CardData[] }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

    const handleClick = () => {
        setIsFlipped(!isFlipped);
    };

    return (
        <div className="grid grid-cols-2 sm:flex sm:flex-row sm:flex-wrap justify-center gap-4 sm:gap-12 items-center w-full max-w-lg mx-auto px-4">
            {data.map((card, index) => (
                <div
                    key={index}
                    className={`transform first:rotate-[-15deg] last:rotate-[15deg]`}
                    onClick={handleClick}
                >
                    <FlipCard
                        card={card}
                        index={index}
                        isFlipped={isFlipped}
                    />
                </div>
            ))}
        </div>
    );
};



interface FloatingElementProps {
  children: React.ReactNode;
  index: number;
}

const FloatingElement: React.FC<FloatingElementProps> = ({ children, index }) => {
    return (
        <motion.div
            animate={{
                y: [0, -10, 0],
                rotate: [-1, 1, -1],
            }}
            transition={{
                duration: 4,
                repeat: Infinity,
                delay: index * 0.2,
            }}
        >
            {children}
        </motion.div>
    );
};

const MemoryGameLanding: React.FC = () => {
    const { scrollY } = useScroll();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [randomCards, setRandomCards] = useState<CardData[]>([]);
    const backgroundY = useTransform(scrollY, [0, 1000], ['0%', '50%']);

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

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * flashcardsData.length);
        const selectedPair = flashcardsData[randomIndex];
        const randomCards = [
            { word: selectedPair.word, translation: selectedPair.word, emoji: selectedPair.emoji },
            { word: selectedPair.translation, translation: selectedPair.translation, emoji: selectedPair.emoji }
        ];
        setRandomCards(randomCards);
    }, []);


    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const moveX = clientX - window.innerWidth / 2;
            const moveY = clientY - window.innerHeight / 2;
            setMousePosition({ x: moveX, y: moveY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const features = [
        {
            icon: <FaBrain className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />,
            title: "Memory Enhancement",
            description: "Train your brain while learning new vocabulary. Our memory game combines cognitive exercise with language learning.",
        },
        {
            icon: <FaLanguage className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />,
            title: "Language Learning",
            description: "Practice vocabulary and translations in an engaging way. Match words and their translations to reinforce your language skills.",
        },
        {
            icon: <FaGamepad className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />,
            title: "Fun Gaming Experience",
            description: "Enjoy an interactive and entertaining way to learn. Challenge yourself with different difficulty levels and track your progress.",
        },
    ];

    return (
        <GuestLayout>
            <Head>
                <title>Memory Translation Game</title>
                <meta name="description" content="Test your language knowledge with fun memory games!" />
            </Head>

            <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-indigo-900 via-purple-900 to-black dark:from-gray-900 dark:via-indigo-950 dark:to-black">
                <div className="relative">
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 mix-blend-overlay"
                        style={{ y: backgroundY }}
                    />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
                        {/* Hero Section */}
                        <motion.div
                className="text-center relative z-10 mb-12 sm:mb-20 px-4"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <FloatingElement index={0}>
                    <div className="inline-block p-4 mb-6 sm:mb-8 rounded-full bg-white/10 backdrop-blur-lg">
                        <FaGlobe className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-400" />
                    </div>
                </FloatingElement>

                <h1 className="text-4xl sm:text-6xl font-black mb-4 sm:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
                >
                    Memory Translation Game
                </h1>

                <p className="text-xl sm:text-2xl text-indigo-100 dark:text-indigo-200 mb-8 sm:mb-12 max-w-3xl mx-auto px-4"
                >
                    Embark on an exciting journey of language mastery through the power of memory and fun!
                </p>

                {/* Interactive Cards Section */}
                <motion.div
                    className="w-full mb-8 sm:mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <FlipCards data={randomCards} />
                    <p className="text-indigo-200 text-center mt-6 sm:mt-8">
                        {typeof window !== 'undefined' && 'ontouchstart' in window
                            ? "Tap the cards to flip them!"
                            : "Click the cards to flip them!"}
                    </p>
                </motion.div>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Link
                                    href="/memory-game/play"
                                    className="inline-flex items-center px-8 py-4 text-xl font-bold rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:shadow-[0_0_50px_rgba(79,70,229,0.6)] transition-all duration-300"
                                >
                                    <FaPlay className="mr-3" />
                                    Begin Your Adventure
                                </Link>
                            </motion.div>
                        </motion.div>

                        {/* Features Section */}
                        <motion.div
                            className="grid md:grid-cols-3 gap-8 relative z-10"
                            initial="hidden"
                            animate="visible"
                            variants={{
                                visible: {
                                    transition: {
                                        staggerChildren: 0.2
                                    }
                                }
                            }}
                        >
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    variants={{
                                        hidden: { opacity: 0, y: 50 },
                                        visible: { opacity: 1, y: 0 }
                                    }}
                                    whileHover={{ y: -10, scale: 1.02 }}
                                    className="p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:border-indigo-500/50 shadow-xl hover:shadow-indigo-500/20 transition-all duration-300"
                                >
                                    <FloatingElement index={index}>
                                        <div className="flex items-center justify-center mb-6 p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full w-24 h-24 mx-auto">
                                            {feature.icon}
                                        </div>
                                    </FloatingElement>
                                    <h3 className="text-2xl font-bold text-center mb-4 text-white">
                                        {feature.title}
                                    </h3>
                                    <p className="text-indigo-200 text-center leading-relaxed">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Call to Action Section */}
                        <motion.div
                            className="mt-20 text-center relative z-10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <div className="p-12 rounded-3xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-lg border border-white/10">
                                <motion.h2
                                    className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-6"
                                    style={{
                                        x: mousePosition.x * 0.02,
                                        y: mousePosition.y * 0.02,
                                    }}
                                >
                                    Ready to Transform Your Learning?
                                </motion.h2>
                                <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                                    Join a community of successful learners who have mastered new languages through our engaging memory games.
                                </p>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Link
                                        href="/memory-game/play"
                                        className="inline-flex items-center px-8 py-4 text-lg font-bold rounded-full bg-white text-indigo-600 hover:bg-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                        Start Playing Now
                                    </Link>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
};

export default MemoryGameLanding;
