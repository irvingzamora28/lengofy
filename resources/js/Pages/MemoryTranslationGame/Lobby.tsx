import { useEffect, useState, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
  FaGlobe,
  FaUsers,
  FaPlay,
  FaBook,
  FaMemory,
  FaDumbbell,
} from 'react-icons/fa';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { MemoryTranslationGame, User } from '@/types';
import DifficultyModal from '@/Components/Games/DifficultyModal';
import { useTranslation } from 'react-i18next';

interface Props {
  auth: {
    user: User;
  };
  activeGames: MemoryTranslationGame[];
  wsEndpoint: string;
}

export default function MemoryTranslationLobby({ auth, activeGames, wsEndpoint }: Props) {
  const [games, setGames] = useState<MemoryTranslationGame[]>(activeGames);
  const [selectedLanguagePair, setSelectedLanguagePair] = useState(null);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [isSinglePlayer, setIsSinglePlayer] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    auth.user.memory_translation_difficulty || 'medium'
  );
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const { t: trans } = useTranslation();
  const wsRef = useRef<WebSocket | null>(null);

  // Subscribe to game events using WebSocket
  useEffect(() => {
    const ws = new WebSocket(wsEndpoint);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to lobby WebSocket');
      ws.send(JSON.stringify({
        type: 'join_lobby',
        userId: auth.user.id
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);

      if (data.type === 'memory_translation_game_created') {
        console.log('New game created:', data.game);
        setGames(prevGames => [...prevGames, data.game]);
      } else if (data.type === 'memory_translation_game_ended') {
        console.log('Game ended:', data);
        setGames(prevGames => prevGames.filter(game => game.id !== data.gameId));
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from lobby WebSocket');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [wsEndpoint, auth.user.id]);

  const startCreateRoom = () => {
    router.post(
      route('profile.game-settings.update', { redirectRoute: 'games.memory-translation.lobby' }),
      {
        memory_translation_difficulty: selectedDifficulty,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          router.post(route('games.memory-translation.create'), {
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
      route('profile.game-settings.update', { redirectRoute: 'games.memory-translation.lobby' }),
      {
        memory_translation_difficulty: selectedDifficulty,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          router.visit(route('games.memory-translation.practice'), {
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
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-100 leading-tight">{trans('memory_translation.lobby')}</h2>}
    >
    <Head title={trans('memory_translation.lobby')} />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-3 sm:p-6">
              {/* Game Lobby Section */}
              <div className="bg-white dark:bg-gray-700 shadow-xl rounded-xl overflow-hidden">
                <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-600">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <FaMemory className="mr-2 sm:mr-3 text-indigo-600 dark:text-indigo-400" />
                        <span className="hidden sm:inline">{trans('memory_translation.active_games_plural')}</span>
                        <span className="sm:hidden">{trans('memory_translation.active_games')}</span>
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 sm:mt-2">{trans('memory_translation.connect_learn_challenge')}</p>
                    </div>
                    <div className="flex space-x-3 w-full sm:w-auto">
                      <button
                        onClick={handleCreateRoom}
                        className="w-full sm:w-auto bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <FaPlay className="mr-2" />
                        <span className="hidden sm:inline">{trans('memory_translation.btn_create_new_room')}</span>
                        <span className="sm:hidden">{trans('memory_translation.btn_sm_create_new_room')}</span>
                      </button>
                      <button
                        onClick={handlePracticeAlone}
                        className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <FaDumbbell className="mr-2" />
                        <span className="hidden sm:inline">{trans('memory_translation.btn_practice_alone')}</span>
                        <span className="sm:hidden">{trans('memory_translation.btn_sm_practice_alone')}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {filteredGames.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 px-4 sm:px-6">
                    <FaBook className="mx-auto w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 mb-3 sm:mb-4" />
                    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-2 sm:mb-4">
                      {trans('memory_translation.no_active_games')}
                    </p>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                      {trans('memory_translation.be_the_first')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:p-6">
                    {filteredGames.map((game) => (
                      <div
                        key={game.id}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <FaUsers className="text-indigo-500 dark:text-indigo-400 mr-2" />
                              <span className="text-gray-600 dark:text-gray-300">
                                {game.players.length}/{game.max_players} {trans('memory_translation.players')}
                              </span>
                            </div>
                            <span className="px-2 py-1 rounded text-xs font-semibold">
                              {trans(`categories.${game.category}`)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <Link
                              href={route('games.memory-translation.join', game.id)}
                              className="bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors w-full text-center"
                            >
                              {trans('memory_translation.join_game')}
                            </Link>
                          </div>
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

      <DifficultyModal
        showDifficultyModal={showDifficultyModal}
        setShowDifficultyModal={setShowDifficultyModal}
        selectedDifficulty={selectedDifficulty}
        setSelectedDifficulty={setSelectedDifficulty}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        startGame={startGame}
        easyText={trans('memory_translation.modal_difficulty.easy_text')}
        mediumText={trans('memory_translation.modal_difficulty.medium_text')}
        hardText={trans('memory_translation.modal_difficulty.hard_text')}
        gameType={isSinglePlayer ? 'singlePlayer' : 'multiPlayer'} />

    </AuthenticatedLayout>
  );
}
