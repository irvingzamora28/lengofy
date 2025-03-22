import { useEffect, useState, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    FaGlobe,
    FaUsers,
    FaPlay,
    FaBook,
    FaFont,
    FaDumbbell,
} from 'react-icons/fa';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { WordSearchPuzzleGame, User } from '@/types';
import DifficultyModal from '@/Components/Games/DifficultyModal';
import { useTranslation } from 'react-i18next';

interface Props {
    auth: {
        user: User;
    };
    activeGames: WordSearchPuzzleGame[];
    wsEndpoint: string;
}

export default function WordSearchPuzzleLobby({ auth, activeGames, wsEndpoint }: Props) {
    const [games, setGames] = useState<WordSearchPuzzleGame[]>(activeGames);
    const [selectedLanguagePair, setSelectedLanguagePair] = useState(null);
    const [showDifficultyModal, setShowDifficultyModal] = useState(false);
    const [isSinglePlayer, setIsSinglePlayer] = useState(false);
    const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>(
        auth.user.word_search_puzzle_difficulty || 'medium'
    );
    const [selectedCategory, setSelectedCategory] = useState<number>(0);
    const { t: trans } = useTranslation();
    const wsRef = useRef<WebSocket | null>(null);

    // Subscribe to game events using WebSocket
    useEffect(() => {
        const ws = new WebSocket(wsEndpoint);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('Connected to Word Search Puzzle lobby WebSocket');
            ws.send(JSON.stringify({
                type: 'join_lobby',
                gameType: 'word_search_puzzle',
                userId: auth.user.id
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Word Search Puzzle WebSocket message received:', data);

            if (data.type === 'word_search_puzzle_game_created') {
                console.log('New word search puzzle game created:', data.game);
                setGames(prevGames => {
                    // Check if game already exists
                    if (prevGames.some(g => g.id === data.game.id)) {
                        return prevGames;
                    }
                    return [...prevGames, data.game];
                });
            } else if (data.type === 'word_search_puzzle_game_ended') {
                console.log('Word search puzzle game ended:', data);
                setGames(prevGames => prevGames.filter(game => game.id !== data.gameId));
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from Word Puzzle lobby WebSocket');
            setTimeout(() => {
                if (wsRef.current?.readyState === WebSocket.CLOSED) {
                    console.log('Attempting to reconnect to Word Puzzle lobby...');
                    wsRef.current = new WebSocket(wsEndpoint);
                }
            }, 3000);
        };

        ws.onerror = (error) => {
            console.error('Word Puzzle WebSocket error:', error);
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [wsEndpoint, auth.user.id]);

    const startCreateRoom = () => {
        router.post(
            route('profile.game-settings.update', { redirectRoute: 'games.word-search-puzzle.lobby' }),
            {
                word_search_puzzle_difficulty: selectedDifficulty,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.post(route('games.word-search-puzzle.create'), {
                        language_pair_id: auth.user.language_pair_id,
                        max_players: 8,
                        difficulty: selectedDifficulty,
                        category: selectedCategory
                    });
                    setShowDifficultyModal(false);
                },
            }
        );
    };

    const startGame = () => {
        if (isSinglePlayer) {
            startSinglePlayerGame();
        } else {
            startCreateRoom();
        }
    };

    const handleCreateRoom = () => {
        setShowDifficultyModal(true);
        setIsSinglePlayer(false);
    };

    const handlePracticeAlone = () => {
        setShowDifficultyModal(true);
        setIsSinglePlayer(true);
    };

    const startSinglePlayerGame = () => {
        router.post(
            route('profile.game-settings.update', { redirectRoute: 'games.word-search-puzzle.lobby' }),
            {
                word_search_puzzle_difficulty: selectedDifficulty,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.visit(route('games.word-search-puzzle.practice'), {
                        method: 'get',
                        data: {
                            difficulty: selectedDifficulty,
                            category: selectedCategory
                        },
                    });
                    setShowDifficultyModal(false);
                },
            }
        );
    };

    const filteredGames = selectedLanguagePair
        ? games.filter(game =>
            game.source_language.id === selectedLanguagePair ||
            game.target_language.id === selectedLanguagePair
        )
        : games;

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-100 leading-tight">{trans('word_search_puzzle.lobby')}</h2>}
        >
            <Head title={trans('word_search_puzzle.lobby')} />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-3 sm:p-6">
                            {/* Game Lobby Section */}
                            <div className="bg-white dark:bg-gray-700 shadow-xl rounded-xl overflow-hidden">
                                <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-600">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                                        <div>
                                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                                                <FaFont className="mr-2 sm:mr-3 text-orange-600 dark:text-orange-400" />
                                                <span className="hidden sm:inline">{trans('word_search_puzzle.active_games_plural')}</span>
                                                <span className="sm:hidden">{trans('word_search_puzzle.active_games')}</span>
                                            </h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 sm:mt-2">
                                                {trans('word_search_puzzle.connect_learn_challenge')}
                                            </p>
                                        </div>
                                        <div className="flex space-x-3 w-full sm:w-auto">
                                            <button
                                                onClick={handleCreateRoom}
                                                className="w-full sm:w-auto bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg flex items-center justify-center transition-colors"
                                            >
                                                <FaPlay className="mr-2" />
                                                {trans('word_search_puzzle.btn_create_new_room')}
                                            </button>
                                            <button
                                                onClick={handlePracticeAlone}
                                                className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg flex items-center justify-center transition-colors"
                                            >
                                                <FaDumbbell className="mr-2" />
                                                {trans('word_search_puzzle.btn_practice_alone')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {filteredGames.length === 0 ? (
                                    <div className="text-center py-8 sm:py-12 px-4 sm:px-6">
                                        <FaBook className="mx-auto w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 mb-3 sm:mb-4" />
                                        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-2 sm:mb-4">
                                        {trans('word_search_puzzle.no_active_games')}
                                        </p>
                                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                                        {trans('word_search_puzzle.be_the_first')}
                                        </p>
                                    </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 p-3 sm:p-6">
                                            {filteredGames.map((game) => (
                                                <div
                                                    key={game.id}
                                                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700"
                                                >
                                                    <div className="mb-4">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div className="flex items-center">
                                                                <FaUsers className="text-gray-500 dark:text-gray-400 mr-2" />
                                                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                                                    {game.players.length}/{game.max_players}
                                                                </span>
                                                            </div>
                                                            <span className={`px-2 py-1 rounded text-xs ${
                                                                game.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                                game.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                            }`}>
                                                                {trans(`word_search_puzzle.modal_difficulty.${game.difficulty}`)}
                                                            </span>
                                                        </div>

                                                        <div className="flex justify-center space-x-4 mb-4">
                                                            <div className="text-center">
                                                                <span className="text-xl sm:text-2xl">{game.source_language.flag}</span>
                                                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                                                                    {game.source_language.name}
                                                                </p>
                                                            </div>
                                                            <div className="text-center">
                                                                <span className="text-xl sm:text-2xl">{game.target_language.flag}</span>
                                                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                                                                    {game.target_language.name}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <Link
                                                            href={`/games/word-search-puzzle/${game.id}/join`}
                                                            method="post"
                                                            as="button"
                                                            className="w-full bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-bold py-2 sm:py-3 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base"
                                                        >
                                                            <FaPlay className="mr-2 w-4 h-4" /> {trans('word_search_puzzle.btn_join_game')}
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

            {showDifficultyModal && (
                <DifficultyModal
                    showDifficultyModal={showDifficultyModal}
                    setShowDifficultyModal={setShowDifficultyModal}
                    selectedDifficulty={selectedDifficulty}
                    setSelectedDifficulty={setSelectedDifficulty}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    startGame={startGame}
                    easyText={trans('word_search_puzzle.modal_difficulty.easy_text')}
                    mediumText={trans('word_search_puzzle.modal_difficulty.medium_text')}
                    hardText={trans('word_search_puzzle.modal_difficulty.hard_text')}
                    gameType={isSinglePlayer ? 'singlePlayer' : 'multiPlayer'}
                />
            )}
        </AuthenticatedLayout>
    );
}
