import { useEffect, useState, useRef } from 'react';
import { Link, router } from '@inertiajs/react';
import {
  FaGlobe,
  FaUsers,
  FaPlay,
  FaBook,
  FaFlag,
  FaHorse,
} from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { User } from '@/types';
import DifficultyModal from '@/Components/Games/DifficultyModal';
import { useTranslation } from 'react-i18next';
import MobileDashboardLinks from '@/Components/Navigation/MobileDashboardLinks';
import ConfirmationExitModal from '@/Components/Games/ConfirmationExitModal';

interface DerbyGame {
  id: number;
  hostId: number;
  players: any[];
  max_players: number;
  difficulty: 'easy' | 'medium' | 'hard';
  race_mode: 'time' | 'distance';
  language_name: string;
  source_language: {
    id: number;
    code: string;
    name: string;
    flag: string;
  };
  target_language: {
    id: number;
    code: string;
    name: string;
    flag: string;
  };
}

interface Props {
  auth: {
    user: User;
  };
  activeGames: DerbyGame[];
  wsEndpoint: string;
}

export default function DerbyLobby({ auth, activeGames, wsEndpoint }: Props) {
  const [games, setGames] = useState<DerbyGame[]>(activeGames);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [isSinglePlayer, setIsSinglePlayer] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [selectedVerbList, setSelectedVerbList] = useState<number | null>(null);
  const [selectedTenses, setSelectedTenses] = useState<number[]>([2, 3, 4, 5]); // All tenses by default
  const [taskTypes, setTaskTypes] = useState({
    article_gender: true,
    translation: true,
    verb_conjugation: true,
  });
  const { t: trans } = useTranslation();
  const wsRef = useRef<WebSocket | null>(null);
  const [showConfirmEndModal, setShowConfirmEndModal] = useState(false);
  const [pendingEndGameId, setPendingEndGameId] = useState<number | null>(null);

  // Subscribe to game events using WebSocket
  useEffect(() => {
    const ws = new WebSocket(wsEndpoint);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to Derby lobby WebSocket');
      ws.send(JSON.stringify({
        type: 'join_lobby',
        gameType: 'derby',
        userId: auth.user.id
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Derby WebSocket message received:', data);

      if (data.type === 'derby_game_created') {
        console.log('New derby game created:', data.game);
        setGames(prevGames => {
          if (prevGames.some(g => g.id === data.game.id)) {
            return prevGames;
          }
          return [...prevGames, data.game];
        });
      } else if (data.type === 'derby_game_ended') {
        console.log('Derby game ended:', data);
        setGames(prevGames => prevGames.filter(game => game.id !== data.gameId));
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from Derby lobby WebSocket');
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          console.log('Attempting to reconnect to Derby lobby...');
          wsRef.current = new WebSocket(wsEndpoint);
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('Derby WebSocket error:', error);
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
        type: 'derby_game_end',
        gameId,
        gameType: 'derby',
        userId: auth.user.id,
      }));
    }

    router.post(route('games.derby.end', `${gameId}`), {}, {
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
    router.post(route('games.derby.create'), {
      language_pair_id: auth.user.language_pair_id,
      max_players: 4,
      difficulty: selectedDifficulty,
      race_mode: 'time',
      race_duration_s: 120,
      noun_list_ids: [],
      verb_list_ids: [],
      lesson_ids: [],
    });
    setShowDifficultyModal(false);
  };

  const startPracticeGame = () => {
    const enabledTaskTypes = Object.entries(taskTypes)
      .filter(([_, enabled]) => enabled)
      .map(([type, _]) => type);
    
    router.get(route('games.derby.practice', { 
      difficulty: selectedDifficulty,
      category: selectedCategory,
      verb_list: selectedVerbList,
      tenses: selectedTenses.join(','),
      task_types: enabledTaskTypes.join(',')
    }));
    setShowDifficultyModal(false);
  };

  const startGame = () => {
    if (isSinglePlayer) {
      startPracticeGame();
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

  return (
    <AuthenticatedLayout
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-100 leading-tight">Derby Race Lobby</h2>}
    >
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-800 dark:to-gray-900 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-3 sm:p-6">
              <div className="bg-white dark:bg-gray-700 shadow-xl rounded-xl overflow-hidden">
                <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-600">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <FaHorse className="mr-2 sm:mr-3 text-green-600 dark:text-green-400" />
                        <span>Active Derby Races</span>
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 sm:mt-2">Race to the finish by answering correctly!</p>
                    </div>
                    <div className="flex space-x-3 w-full sm:w-auto">
                      <button
                        onClick={handleCreateRoom}
                        className="w-full sm:w-auto bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <FaPlay className="mr-2" />
                        <span>Create Race</span>
                      </button>
                      <button
                        onClick={handlePracticeAlone}
                        className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <FaHorse className="mr-2" />
                        <span>Practice</span>
                      </button>
                    </div>
                  </div>
                </div>

                {games.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 px-4 sm:px-6">
                    <FaBook className="mx-auto w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 mb-3 sm:mb-4" />
                    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-2 sm:mb-4">
                      No active races
                    </p>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                      Be the first to start a race!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 p-3 sm:p-6">
                    {games.map((game) => (
                      <div
                        key={game.id}
                        className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-md hover:shadow-xl dark:hover:shadow-2xl transition-all transform hover:-translate-y-1 sm:hover:-translate-y-2"
                      >
                        <div className="p-3 sm:p-5">
                          <div className="flex justify-between items-center mb-3 sm:mb-4">
                            <div className="flex items-center space-x-2">
                              <FaHorse className="text-green-500 dark:text-green-400 w-4 h-4" />
                              <span className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200">
                                Race #{game.id}
                              </span>
                            </div>
                            <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                              <FaUsers className="mr-1 sm:mr-2 w-4 h-4" />
                              {game.players.length}/{game.max_players}
                            </div>
                          </div>

                          <div className="mb-3">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              game.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              game.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {game.difficulty.toUpperCase()}
                            </span>
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
                              href={`/games/derby/${game.id}/join`}
                              method="post"
                              as="button"
                              className="w-full bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-bold py-2 sm:py-3 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base"
                            >
                              <FaPlay className="mr-2 w-4 h-4" /> Join Race
                            </Link>
                            {game.hostId === auth.user.id && (
                              <button
                                onClick={() => openConfirmEnd(game.id)}
                                aria-label="End Game"
                                title="End Game"
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

      <MobileDashboardLinks />

      {showDifficultyModal && (
        <DifficultyModal
          showDifficultyModal={showDifficultyModal}
          setShowDifficultyModal={setShowDifficultyModal}
          selectedDifficulty={selectedDifficulty}
          setSelectedDifficulty={setSelectedDifficulty}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedVerbList={selectedVerbList}
          setSelectedVerbList={setSelectedVerbList}
          selectedTenses={selectedTenses}
          setSelectedTenses={setSelectedTenses}
          taskTypes={taskTypes}
          setTaskTypes={setTaskTypes}
          showVerbLists={true}
          startGame={startGame}
          easyText="10s per question, forgiving"
          mediumText="6s per question, balanced"
          hardText="4s per question, challenging"
          gameType={isSinglePlayer ? 'singlePlayer' : 'multiPlayer'}
        />
      )}

      {showConfirmEndModal && (
        <ConfirmationExitModal
          title="End Race?"
          message="Are you sure you want to end this race? All players will be removed."
          onLeave={confirmEndGame}
          onCancel={cancelEndGame}
        />
      )}
    </AuthenticatedLayout>
  );
}
