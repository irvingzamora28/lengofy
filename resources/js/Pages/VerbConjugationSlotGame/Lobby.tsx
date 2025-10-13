import { useEffect, useRef, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import MobileDashboardLinks from '@/Components/Navigation/MobileDashboardLinks';
import DifficultyModal from '@/Components/Games/DifficultyModal';
import { FaFlag, FaGlobe, FaPlay, FaUsers, FaDumbbell } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import ConfirmationExitModal from '@/Components/Games/ConfirmationExitModal';

interface Player {
  id: number;
  user_id: number;
  player_name: string;
  score: number;
  is_ready?: boolean;
}

interface LanguageInfo { id: number; code: string; name: string; flag: string; }

interface GameCard {
  id: number;
  status: string;
  players: Player[];
  max_players: number;
  language_name: string;
  source_language: LanguageInfo;
  target_language: LanguageInfo;
  hostId?: number;
}

interface Props {
  auth: { user: { id: number; language_pair_id: number } };
  activeGames: GameCard[];
  wsEndpoint: string;
}

export default function Lobby({ auth, activeGames, wsEndpoint }: Props) {
  const [games, setGames] = useState<GameCard[]>(activeGames || []);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [isSinglePlayer, setIsSinglePlayer] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [selectedVerbList, setSelectedVerbList] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { t: trans } = useTranslation();
  const [showConfirmEndModal, setShowConfirmEndModal] = useState(false);
  const [pendingEndGameId, setPendingEndGameId] = useState<number | null>(null);

  useEffect(() => {
    const ws = new WebSocket(wsEndpoint);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join_lobby', gameType: 'verb_conjugation_slot', userId: auth.user.id }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'verb_conjugation_slot_game_created') {
        setGames((prev) => (prev.some((g) => g.id === data.game.id) ? prev : [...prev, data.game]));
      }
    };

    return () => { try { ws.close(); } catch {} };
  }, [wsEndpoint, auth.user.id]);

  const handleEndGame = (gameId: number) => {
    // Inform room via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'verb_conjugation_slot_game_end',
        gameId,
        gameType: 'verb_conjugation_slot',
        userId: auth.user.id,
      }));
    }

    // Persist on backend
    router.post(route('games.verb-conjugation-slot.end', { verbConjugationSlotGame: String(gameId) }), {}, {
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

  const openCreateRoom = () => { setIsSinglePlayer(false); setShowDifficultyModal(true); };
  const openPractice = () => { setIsSinglePlayer(true); setShowDifficultyModal(true); };

  const startGame = () => {
    if (isSinglePlayer) {
      router.visit(route('games.verb-conjugation-slot.practice'), {
        method: 'get',
        data: { 
          difficulty: selectedDifficulty, 
          category: selectedCategory,
          verb_list_id: selectedVerbList 
        },
      });
      setShowDifficultyModal(false);
      return;
    }

    router.post(route('games.verb-conjugation-slot.create'), {
      language_pair_id: auth.user.language_pair_id,
      max_players: 8,
      difficulty: selectedDifficulty,
      category: selectedCategory,
      verb_list_id: selectedVerbList,
    });
    setShowDifficultyModal(false);
  };

  return (
    <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">{trans('verb_conjugation_slot.lobby')}</h2>}>
      <div className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 overflow-hidden shadow sm:rounded-lg">
            <div className="p-4">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <FaGlobe className="mr-2 sm:mr-3 text-indigo-600 dark:text-indigo-400" />
                    <span className="hidden sm:inline">{trans('verb_conjugation_slot.active_games')}</span>
                    <span className="sm:hidden">{trans('verb_conjugation_slot.active_games_plural')}</span>
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{trans('verb_conjugation_slot.connect_learn_challenge')}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={openCreateRoom} className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded inline-flex items-center">
                    <FaPlay className="mr-2" /> {trans('verb_conjugation_slot.btn_create_new_room')}
                  </button>
                  <button onClick={openPractice} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded inline-flex items-center">
                    <FaDumbbell className="mr-2" /> {trans('verb_conjugation_slot.btn_practice_alone')}
                  </button>
                </div>
              </div>

              {games.length === 0 ? (
                <div className="text-center py-10 text-gray-600">{trans('verb_conjugation_slot.no_active_games')}</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {games.map((game) => (
                    <div key={game.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded shadow p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <FaFlag className="text-blue-500" />
                          <span className="font-semibold text-gray-800 dark:text-gray-200">Game #{game.id}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                          <FaUsers className="mr-1" /> {game.players.length}/{game.max_players}
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-4 bg-gray-50 dark:bg-gray-700 rounded p-3 mb-3">
                        <div className="text-center">
                          <span className="text-2xl text-gray-600 dark:text-gray-200">{game.source_language.flag}</span>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{game.source_language.name}</p>
                        </div>
                        <span className="text-gray-400 text-lg">→</span>
                        <div className="text-center">
                          <span className="text-2xl text-gray-600 dark:text-gray-200">{game.target_language.flag}</span>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{game.target_language.name}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                        <Link
                          href={route('games.verb-conjugation-slot.join', { verbConjugationSlotGame: game.id })}
                          method="post"
                          as="button"
                          className="w-full bg-indigo-500 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold py-2 rounded inline-flex items-center justify-center"
                        >
                          <FaPlay className="mr-2" /> {trans('verb_conjugation_slot.btn_join_game')}
                        </Link>
                        {game.hostId === auth.user.id && (
                          <button
                            onClick={() => openConfirmEnd(game.id)}
                            aria-label={trans('generals.games.btn_end_game')}
                            title={trans('generals.games.btn_end_game')}
                            className="flex items-center justify-center w-full sm:w-auto px-3 py-2 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-700 transition-colors"
                          >
                            <MdClose size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
          showCategories={false}
          startGame={startGame}
          easyText={trans('verb_conjugation_slot.modal_difficulty.easy_text')}
          mediumText={trans('verb_conjugation_slot.modal_difficulty.medium_text')}
          hardText={trans('verb_conjugation_slot.modal_difficulty.hard_text')}
          gameType={isSinglePlayer ? 'singlePlayer' : 'multiPlayer'}
        />
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
