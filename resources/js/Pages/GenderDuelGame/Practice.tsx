import React from "react";
import { FaHome, FaUser, FaCog, FaCrown, FaHeart } from "react-icons/fa";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { MdClose } from "react-icons/md";
import CircularTimer from "@/Components/Games/CircularTimer";

const leaveGame = () => {};

const handleExitClick = () => {
    // if (genderDuelGameState.status === 'in_progress') {
    //     setShowExitConfirmation(true);
    // } else {
    //     leaveGame();
    // }
};

const GamePage: React.FC = (auth: any) => {
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
                                Score: 2450
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <CircularTimer timeLeft={10} totalTime={10} />
                        </div>
                    </div>
                </div>

                {/* Main Game Area */}
                <div
                    className="flex-grow flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800"
                    style={{ minHeight: "calc(100vh - 250px)" }}
                >
                    <div className="text-4xl md:text-8xl font-bold mb-8 text-gray-800 dark:text-slate-200">
                        Mädchen
                    </div>

                    <div className="grid grid-cols-3 gap-4 w-full max-w-lg md:max-w-3xl">
                        <button className="bg-blue-500 hover:bg-blue-600 text-white text-xl md:text-6xl font-bold py-6 px-8 rounded-xl shadow-lg transform hover:scale-105 transition">
                            Der
                        </button>
                        <button className="bg-pink-500 hover:bg-pink-600 text-white text-xl md:text-6xl font-bold py-6 px-8 rounded-xl shadow-lg transform hover:scale-105 transition">
                            Die
                        </button>
                        <button className="bg-green-500 hover:bg-green-600 text-white text-xl md:text-6xl font-bold py-6 px-8 rounded-xl shadow-lg transform hover:scale-105 transition">
                            Das
                        </button>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default GamePage;
