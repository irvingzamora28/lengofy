import React, { useEffect, useState } from "react";
import { FaTrophy, FaCrown } from "react-icons/fa";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { MdClose } from "react-icons/md";
import CircularTimer from "@/Components/Games/CircularTimer";
import { Noun } from "@/types";
import correctSound from '@/assets/audio/correct.mp3';
import incorrectSound from '@/assets/audio/incorrect.mp3';

interface GenderDuelPracticeProps extends PageProps {
    auth: any;
    nouns: Noun[];
    difficulty: 'easy' | 'medium' | 'hard';
}

const leaveGame = () => {};

const handleExitClick = () => {
    // if (genderDuelGameState.status === 'in_progress') {
    //     setShowExitConfirmation(true);
    // } else {
    //     leaveGame();
    // }
};

const DIFFICULTY_TIMES = {
    easy: 5,
    medium: 3,
    hard: 1
};

const GenderDuelPractice: React.FC<GenderDuelPracticeProps> = ({ auth, nouns, difficulty = 'medium' }: GenderDuelPracticeProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(DIFFICULTY_TIMES[difficulty]);
    const [shake, setShake] = useState(false);

    useEffect(() => {
        console.log("GenderDuelPractice nouns: ", nouns);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Move to the next noun when time expires
                    setCurrentIndex((prevIndex) => (prevIndex + 1) % nouns.length);
                    return DIFFICULTY_TIMES[difficulty];
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [difficulty]);

    useEffect(() => {
        if (timeLeft === 0) {
            // Handle time expired logic (e.g., move to next word)
            setCurrentIndex((prevIndex) => (prevIndex + 1) % nouns.length);
            setTimeLeft(DIFFICULTY_TIMES[difficulty]);
        }
    }, [timeLeft]);

    const handleAnswer = (isCorrect: boolean) => {
        if (isCorrect) {
            setScore((prevScore) => prevScore + 1);
            // Play the correct sound
            const audio = new Audio(correctSound);
            audio.play();
            // Move to the next noun only if the answer is correct
            setCurrentIndex((prevIndex) => (prevIndex + 1) % nouns.length);
            setTimeLeft(DIFFICULTY_TIMES[difficulty]);
        } else {
            // Play the incorrect sound
            const audio = new Audio(incorrectSound);
            audio.play();
            // Trigger shake animation
            setShake(true);
            setTimeout(() => setShake(false), 500); // Remove shake after 500ms
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center">
                    <button
                        onClick={handleExitClick}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition"
                    >
                        <MdClose size={24} />
                    </button>
                    <h2 className="ml-3 font-extrabold text-2xl text-indigo-700 dark:text-indigo-300 leading-tight">
                        Gender Duel
                    </h2>
                </div>
            }
        >
            <Head title="Practice" />
            <div className="h-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-black flex flex-col">
                {/* Top Stats Bar */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-md p-4">
                    <div className="max-w-6xl mx-auto flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <FaCrown className="text-yellow-500 w-6 h-6" />
                            <span className="text-lg font-semibold dark:text-white">
                                Score: {score}
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <CircularTimer timeLeft={timeLeft} totalTime={DIFFICULTY_TIMES[difficulty]} />
                        </div>
                    </div>
                </div>

                {/* Main Game Area */}
                <div
                    className="flex-grow flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800"
                    style={{ minHeight: "calc(100vh - 250px)" }}
                >
                    <div className="text-4xl md:text-8xl font-bold mb-8 text-gray-800 dark:text-slate-200">
                        {nouns[currentIndex].word}
                    </div>
                    <div className="text-lg md:text-2xl text-gray-600 dark:text-gray-300 mb-4">
                        {nouns[currentIndex].translation || 'N/A'}
                    </div>

                    <div className={`grid grid-cols-3 gap-4 w-full max-w-lg md:max-w-3xl ${shake ? 'animate-shake' : ''}`}>
                        <button className="bg-blue-500 hover:bg-blue-600 text-white text-xl md:text-6xl font-bold py-6 px-8 rounded-xl shadow-lg transform hover:scale-105 transition"
                            onClick={() => handleAnswer(nouns[currentIndex].gender === 'der')}>
                            Der
                        </button>
                        <button className="bg-pink-500 hover:bg-pink-600 text-white text-xl md:text-6xl font-bold py-6 px-8 rounded-xl shadow-lg transform hover:scale-105 transition"
                            onClick={() => handleAnswer(nouns[currentIndex].gender === 'die')}>
                            Die
                        </button>
                        <button className="bg-green-500 hover:bg-green-600 text-white text-xl md:text-6xl font-bold py-6 px-8 rounded-xl shadow-lg transform hover:scale-105 transition"
                            onClick={() => handleAnswer(nouns[currentIndex].gender === 'das')}>
                            Das
                        </button>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default GenderDuelPractice;
