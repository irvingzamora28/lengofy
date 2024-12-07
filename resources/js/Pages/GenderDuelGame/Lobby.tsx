import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { router } from '@inertiajs/core';
import {
  FaGlobe,
  FaUsers,
  FaPlay,
  FaBook,
  FaFlag,
} from 'react-icons/fa';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { GenderDuelGame } from '@/types';

interface Props {
    auth: {
        user: {
            id: number;
            name: string;
            language_pair_id: string;
            level: string;
            streak: number;
        };
    };
    activeGames: GenderDuelGame[];
}

export default function LanguageLobby({ auth, activeGames }: Props) {
    const [games, setGames] = useState<GenderDuelGame[]>(activeGames);
    const [selectedLanguagePair, setSelectedLanguagePair] = useState(null);

    const handleCreateGame = () => {
        router.post(route('games.gender-duel.create'), {
            language_pair_id: auth.user.language_pair_id,
            max_players: 8,
        });
    };

    const filteredGames = selectedLanguagePair
        ? games.filter(game =>
            game.source_language.id === selectedLanguagePair ||
            game.target_language.id === selectedLanguagePair
        )
        : games;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Language Game Lobby</h2>}
        >
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-3 sm:p-6">

                            {/* Game Lobby Section */}
                            <div className="bg-white shadow-xl rounded-xl overflow-hidden">
                                <div className="p-4 sm:p-6 bg-gray-50 border-b">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                                        <div>
                                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
                                                <FaGlobe className="mr-2 sm:mr-3 text-indigo-600" />
                                                <span className="hidden sm:inline">Active Gender Duel Games</span>
                                                <span className="sm:hidden">Active Games</span>
                                            </h2>
                                            <p className="text-sm text-gray-600 mt-1 sm:mt-2">Connect, Learn, and Challenge Yourself!</p>
                                        </div>
                                        <div className="w-full sm:w-auto">
                                            <button
                                                onClick={handleCreateGame}
                                                className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg flex items-center justify-center transition-colors"
                                            >
                                                <FaPlay className="mr-2" />
                                                <span className="hidden sm:inline">Start New Game</span>
                                                <span className="sm:hidden">New Game</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {filteredGames.length === 0 ? (
                                    <div className="text-center py-8 sm:py-12 px-4 sm:px-6">
                                        <FaBook className="mx-auto w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-3 sm:mb-4" />
                                        <p className="text-lg sm:text-xl text-gray-600 mb-2 sm:mb-4">
                                            No active games right now
                                        </p>
                                        <p className="text-sm sm:text-base text-gray-500">
                                            Be the first to create a game and start learning!
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 p-3 sm:p-6">
                                        {filteredGames.map((game) => (
                                            <div
                                                key={game.id}
                                                className="bg-white border rounded-lg shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 sm:hover:-translate-y-2"
                                            >
                                                <div className="p-3 sm:p-5">
                                                    <div className="flex justify-between items-center mb-3 sm:mb-4">
                                                        <div className="flex items-center space-x-2">
                                                            <FaFlag className="text-blue-500 w-4 h-4" />
                                                            <span className="text-sm sm:text-base font-semibold text-gray-700">
                                                                Game #{game.id}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center text-gray-600 text-sm sm:text-base">
                                                            <FaUsers className="mr-1 sm:mr-2 w-4 h-4" />
                                                            {game.players.length}/{game.max_players}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-center space-x-3 sm:space-x-4 mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                                                        <div className="text-center">
                                                            <span className="text-xl sm:text-2xl">{game.source_language.flag}</span>
                                                            <p className="text-xs sm:text-sm text-gray-600 mt-1">{game.source_language.name}</p>
                                                        </div>
                                                        <span className="text-gray-400 text-lg sm:text-xl">→</span>
                                                        <div className="text-center">
                                                            <span className="text-xl sm:text-2xl">{game.target_language.flag}</span>
                                                            <p className="text-xs sm:text-sm text-gray-600 mt-1">{game.target_language.name}</p>
                                                        </div>
                                                    </div>

                                                    <Link
                                                        href={`/games/gender-duel/${game.id}/join`}
                                                        method="post"
                                                        as="button"
                                                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 sm:py-3 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base"
                                                    >
                                                        <FaPlay className="mr-2 w-4 h-4" /> Join Game
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
