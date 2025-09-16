import { useEffect, useState, useRef } from 'react';
import { Link, router } from '@inertiajs/react';
import {
  FaGlobe,
  FaUsers,
  FaPlay,
  FaBook,
  FaFlag,
  FaDumbbell,
} from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { GenderDuelGame, User } from '@/types';
import DifficultyModal from '@/Components/Games/DifficultyModal';
import { useTranslation } from 'react-i18next';
import MobileDashboardLinks from '@/Components/Navigation/MobileDashboardLinks';
import ConfirmationExitModal from '@/Components/Games/ConfirmationExitModal';

interface Props {
  auth: {
    user: User;
  };
  activeGames: GenderDuelGame[];
  wsEndpoint: string;
}

export default function LanguageLobby({ auth, activeGames, wsEndpoint }: Props) {
  const [games, setGames] = useState<GenderDuelGame[]>(activeGames);
  const [selectedLanguagePair, setSelectedLanguagePair] = useState(null);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [isSinglePlayer, setIsSinglePlayer] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    auth.user.gender_duel_difficulty || 'medium'
  );
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const { t: trans } = useTranslation();
  const wsRef = useRef<WebSocket | null>(null);
  const [showConfirmEndModal, setShowConfirmEndModal] = useState(false);
  const [pendingEndGameId, setPendingEndGameId] = useState<number | null>(null);

  // Subscribe to game events using WebSocket
  useEffect(() => {
    const ws = new WebSocket(wsEndpoint);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to Gender Duel lobby WebSocket');
      ws.send(JSON.stringify({
        type: 'join_lobby',
        gameType: 'gender_duel',
        userId: auth.user.id
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Gender Duel WebSocket message received:', data);

      // Only handle messages for gender duel game
      if (data.type === 'gender_duel_game_created') {
        console.log('New gender duel game created:', data.game);
        setGames(prevGames => {
          // Check if game already exists
          if (prevGames.some(g => g.id === data.game.id)) {
            return prevGames;
          }
          return [...prevGames, data.game];
        });
      } else if (data.type === 'gender_duel_game_ended') {
        console.log('Gender duel game ended:', data);
        setGames(prevGames => prevGames.filter(game => game.id !== data.gameId));
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from Gender Duel lobby WebSocket');
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          console.log('Attempting to reconnect to Gender Duel lobby...');
          wsRef.current = new WebSocket(wsEndpoint);
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('Gender Duel WebSocket error:', error);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [wsEndpoint, auth.user.id]);

  const handleEndGame = (gameId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'gender_duel_game_end',
        gameId,
        gameType: 'gender_duel',
        userId: auth.user.id,
      }));
    }

    router.post(route('games.gender-duel.end', `${gameId}`), {}, {
      preserveScroll: true,
      onFinish: () => {
        setGames(prev => prev.filter(g => g.id !== gameId));
      }
    });
  };

  const openConfirmEnd = (gameId: number) => {
    setPendingEndGameId(gameId);
    setShowConfirmEndModal(true);
  };

  const confirmEndGame = () => {
    if (pendingEndGameId !== null) {
      handleEndGame(pendingEndGameId);
    }
    setShowConfirmEndModal(false);
    setPendingEndGameId(null);
  };

  const cancelEndGame = () => {
    setShowConfirmEndModal(false);
    setPendingEndGameId(null);
  };

  const startCreateRoom = () => {
    router.post(
      route('profile.game-settings.update', { redirectRoute: 'games.gender-duel.lobby' }),
      {
        gender_duel_difficulty: selectedDifficulty,
      },
      {
        preserveScroll: true, // Ensure scroll position is preserved
        onSuccess: () => {
          router.post(route('games.gender-duel.create'), {
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
    // Save the selected difficulty to user settings
    router.post(
      route('profile.game-settings.update', { redirectRoute: 'games.gender-duel.lobby' }),
      {
        gender_duel_difficulty: selectedDifficulty,
      },
      {
        preserveScroll: true, // Ensure scroll position is preserved
        onSuccess: () => {
          // Navigate to single-player game
          router.visit(route('games.gender-duel.practice'), {
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
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-100 leading-tight">{trans('gender_duel.lobby')}</h2>}
    >
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
                        <FaGlobe className="mr-2 sm:mr-3 text-indigo-600 dark:text-indigo-400" />
                        <span className="hidden sm:inline">{trans('gender_duel.active_games_plural')}</span>
                        <span className="sm:hidden">{trans('gender_duel.active_games')}</span>
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 sm:mt-2">{trans('gender_duel.connect_learn_challenge')}</p>
                    </div>
                    <div className="flex space-x-3 w-full sm:w-auto">
                      <button
                        onClick={handleCreateRoom}
                        className="w-full sm:w-auto bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <FaPlay className="mr-2" />
                        <span className="hidden sm:inline">{trans('gender_duel.btn_create_new_room')}</span>
                        <span className="sm:hidden">{trans('gender_duel.btn_sm_create_new_room')}</span>
                      </button>
                      <button
                        onClick={handlePracticeAlone}
                        className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <FaDumbbell className="mr-2" />
                        <span className="hidden sm:inline">{trans('gender_duel.btn_practice_alone')}</span>
                        <span className="sm:hidden">{trans('gender_duel.btn_sm_practice_alone')}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {filteredGames.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 px-4 sm:px-6">
                    <FaBook className="mx-auto w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 mb-3 sm:mb-4" />
                    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-2 sm:mb-4">
                      {trans('gender_duel.no_active_games')}
                    </p>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                      {trans('gender_duel.be_the_first')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 p-3 sm:p-6">
                    {filteredGames.map((game) => (
                      <div
                        key={game.id}
                        className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-md hover:shadow-xl dark:hover:shadow-2xl transition-all transform hover:-translate-y-1 sm:hover:-translate-y-2"
                      >
                        <div className="p-3 sm:p-5">
                          <div className="flex justify-between items-center mb-3 sm:mb-4">
                            <div className="flex items-center space-x-2">
                              <FaFlag className="text-blue-500 dark:text-blue-400 w-4 h-4" />
                              <span className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200">
                                {trans('gender_duel.game')} #{game.id}
                              </span>
                            </div>
                            <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                              <FaUsers className="mr-1 sm:mr-2 w-4 h-4" />
                              {game.players.length}/{game.max_players}
                            </div>
                          </div>

                          <div className="flex items-center justify-center space-x-3 sm:space-x-4 mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="text-center">
                              <span className="text-xl sm:text-2xl">{game.source_language.flag}</span>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">{game.source_language.name}</p>
                            </div>
                            <span className="text-gray-400 dark:text-gray-500 text-lg sm:text-xl">→</span>
                            <div className="text-center">
                              <span className="text-xl sm:text-2xl">{game.target_language.flag}</span>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">{game.target_language.name}</p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">

                          <Link
                            href={`/games/gender-duel/${game.id}/join`}
                            method="post"
                            as="button"
                            className="w-full bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold py-2 sm:py-3 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base"
                          >
                            <FaPlay className="mr-2 w-4 h-4" /> {trans('gender_duel.btn_join_game')}
                          </Link>
                          {game.hostId === auth.user.id && (
                            <button
                              onClick={() => openConfirmEnd(game.id)}
                              aria-label={trans('generals.games.btn_end_game')}
                        title={trans('generals.games.btn_end_game')}
                              className="flex items-center justify-center w-full sm:w-auto px-3 py-2 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <MdClose size={18} />
                            </button>
                          )}
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

      {/* Add Mobile Dashboard Links */}
      <MobileDashboardLinks />

      {/* Difficulty Selection Modal */}
      {showDifficultyModal && (
        <DifficultyModal
          showDifficultyModal={showDifficultyModal}
          setShowDifficultyModal={setShowDifficultyModal}
          selectedDifficulty={selectedDifficulty}
          setSelectedDifficulty={setSelectedDifficulty}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          startGame={startGame}
          easyText={trans('gender_duel.modal_difficulty.easy_text')}
          mediumText={trans('gender_duel.modal_difficulty.medium_text')}
          hardText={trans('gender_duel.modal_difficulty.hard_text')}
          gameType={isSinglePlayer ? 'singlePlayer' : 'multiPlayer'} />
      )}

      {showConfirmEndModal && (
        <ConfirmationExitModal
          title={trans('generals.modal_game_exit.title')}
          message={trans('generals.modal_game_exit.message')}
          onLeave={confirmEndGame}
          onCancel={cancelEndGame}
        />
      )}
    </AuthenticatedLayout>
  );
}
