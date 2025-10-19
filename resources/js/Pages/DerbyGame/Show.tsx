import { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { MdClose } from 'react-icons/md';
import GameInfo from '@/Components/DerbyGame/GameInfo';
import Track from '@/Components/DerbyGame/Track';
import PromptPanel from '@/Components/DerbyGame/PromptPanel';
import PlayersInfo from '@/Components/DerbyGame/PlayersInfo';
import { useTranslation } from 'react-i18next';
import ConfirmationExitModal from '@/Components/Games/ConfirmationExitModal';

interface DerbyPlayer {
  id: number;
  user_id: number;
  player_name: string;
  score: number;
  progress: number;
  is_ready: boolean;
  is_guest: boolean;
}

interface DerbyPrompt {
  id: number;
  mode: 'article_gender' | 'translation' | 'verb_conjugation';
  word: string;
  options: string[];
  answerWindowMs?: number;
  deadlineMs?: number;
  correctAnswer?: string;
  tense?: string;
  person?: string;
  translation?: string;
  gender?: string;
}

interface DerbyGame {
  id: number;
  status: 'waiting' | 'in_progress' | 'completed';
  players: DerbyPlayer[];
  max_players: number;
  race_mode: 'time' | 'distance';
  race_duration_s: number;
  total_segments: number;
  difficulty: 'easy' | 'medium' | 'hard';
  language_name: string;
  source_language: any;
  target_language: any;
  prompts: DerbyPrompt[];
  hostId: number;
  filters: any;
}

interface Props extends PageProps {
  auth: any;
  derby_game: DerbyGame;
  wsEndpoint: string;
  justCreated: boolean;
}

export default function Show({ auth, derby_game, wsEndpoint, justCreated }: Props) {
  const [derbyGameState, setDerbyGameState] = useState(derby_game);
  const [currentPrompt, setCurrentPrompt] = useState<DerbyPrompt | null>(null);
  const [lastAnswer, setLastAnswer] = useState<any>(null); // winner/most recent (remote) view
  const [myLastAnswer, setMyLastAnswer] = useState<any>(null); // strictly the local user's last answer for current prompt
  const [lockCorrect, setLockCorrect] = useState<boolean>(false); // any player answered correctly
  const [revealCorrect, setRevealCorrect] = useState<boolean>(false); // show correct answer after timeout
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [raceStartTime, setRaceStartTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(derby_game.race_duration_s);
  const wsRef = useRef<WebSocket | null>(null);
  const { t: trans } = useTranslation();

  const hostId = derbyGameState.hostId;
  const currentPlayer = derbyGameState.players.find(p => p.user_id === auth.user.id);
  const isHost = hostId === auth.user.id;

  useEffect(() => {
    const ws = new WebSocket(wsEndpoint);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to Derby WebSocket');
      // Join the game room
      ws.send(JSON.stringify({
        type: 'join_derby_game',
        gameId: derby_game.id,
        derbyGameId: derby_game.id,
        userId: auth.user.id,
        data: {
          players: derby_game.players,
          prompts: derby_game.prompts,
          difficulty: derby_game.difficulty,
          race_mode: derby_game.race_mode,
          race_duration_s: derby_game.race_duration_s,
          total_segments: derby_game.total_segments,
          max_players: derby_game.max_players,
          language_name: derby_game.language_name,
          filters: derby_game.filters,
        }
      }));

      // If this is a newly created game, broadcast it to the lobby
      if (justCreated) {
        ws.send(JSON.stringify({
          type: 'derby_game_created',
          gameId: derby_game.id,
          game: derby_game
        }));
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received Derby message:', data.type, data);

      switch (data.type) {
        case 'player_ready':
          setDerbyGameState(prev => ({
            ...prev,
            players: prev.players.map(player =>
              player.id === data.data.player_id || player.user_id === data.data.user_id
                ? { ...player, is_ready: true }
                : player
            )
          }));
          break;

        case 'round_timeout':
          if (currentPrompt && data.data?.prompt_id === currentPrompt.id) {
            setRevealCorrect(true);
          }
          break;

        case 'derby_game_state_updated':
          console.log('Derby state updated:', data.data);
          setDerbyGameState(prev => ({
            ...prev,
            ...data.data,
            players: data.data.players || prev.players,
          }));

          if (data.data.status === 'in_progress' && !raceStartTime) {
            setRaceStartTime(Date.now());
          }

          if (data.data.status === 'completed') {
            console.log('Race completed:', data.data);
            setCurrentPrompt(null);
          }

          if (data.data.players && data.data.players.length === 0) {
            router.visit('/games/derby');
            return;
          }
          break;

        case 'prompt_spawned':
          console.log('New prompt spawned:', data.data);
          setCurrentPrompt({
            id: data.data.prompt_id,
            mode: data.data.mode,
            word: data.data.word,
            options: data.data.options,
            answerWindowMs: data.data.answerWindowMs,
            deadlineMs: data.data.deadlineMs,
            correctAnswer: data.data.correct_answer,
            tense: data.data.tense,
            person: data.data.person,
            translation: data.data.translation,
            gender: data.data.gender,
          });
          setLastAnswer(null);
          setMyLastAnswer(null);
          setLockCorrect(false);
          setRevealCorrect(false);
          break;

        case 'answer_submitted':
          // Guard: ignore stale or malformed events (missing or mismatched prompt_id)
          if (!data.data?.prompt_id || (currentPrompt && data.data.prompt_id !== currentPrompt.id)) {
            break;
          }
          setLastAnswer((prev: any) => {
            const incoming = data.data;
            const incomingUserId = incoming.userId ?? incoming.user_id;
            // If we already stored a correct answer for this prompt, keep it
            if (prev && prev.correct && prev.prompt_id === currentPrompt?.id) {
              return prev;
            }
            // Always keep my own answer if present (so my UI reflects my pressed button)
            if (incomingUserId === auth.user.id) {
              return incoming;
            }
            if (prev && (prev.userId === auth.user.id || prev.user_id === auth.user.id)) {
              return prev;
            }
            // Always accept a correct incoming answer (winner override)
            if (incoming?.correct) {
              return incoming;
            }
            // Otherwise, accept only if we don't have anything yet
            return prev ?? incoming;
          });
          // Also store my own answer separately for local UI purposes
          {
            const incoming = data.data;
            const incomingUserId = incoming.userId ?? incoming.user_id;
            // Do not overwrite myLastAnswer with 'already_answered' for me; keep my actual evaluation
            if (
              (incomingUserId === auth.user.id || (currentPlayer && incoming.playerId === currentPlayer.id)) &&
              incoming.reason !== 'already_answered'
            ) {
              setMyLastAnswer(incoming);
            }
          }
          break;

        case 'progress_updated':
          console.log('Progress updated:', data.data);
          setDerbyGameState(prev => ({
            ...prev,
            players: prev.players.map(p =>
              p.id === data.data.playerId
                ? { ...p, progress: data.data.progress }
                : p
            )
          }));
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('Derby WebSocket error:', error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [derby_game.id]);

  // Timer countdown for time-based races
  useEffect(() => {
    if (derbyGameState.status === 'in_progress' && derbyGameState.race_mode === 'time' && raceStartTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - raceStartTime) / 1000);
        const remaining = Math.max(0, derbyGameState.race_duration_s - elapsed);
        setTimeRemaining(remaining);

        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [derbyGameState.status, derbyGameState.race_mode, raceStartTime, derbyGameState.race_duration_s]);

  const handleReady = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'player_ready',
        gameId: derbyGameState.id,
        derbyGameId: derbyGameState.id,
        gameType: 'derby',
        userId: auth.user.id,
        data: {
          player_id: currentPlayer?.id,
          user_id: auth.user.id
        }
      }));
    }
  };

  const handleAnswer = (answer: string, elapsedMs: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && currentPrompt) {
      const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      console.log('[DERBY][Show] send_submit_answer', {
        promptId: currentPrompt.id,
        answer,
        elapsedMs,
        nonce,
      });
      wsRef.current.send(JSON.stringify({
        type: 'submit_answer',
        gameId: derbyGameState.id,
        derbyGameId: derbyGameState.id,
        gameType: 'derby',
        userId: auth.user.id,
        data: {
          prompt_id: currentPrompt.id,
          answer: answer,
          user_id: auth.user.id,
          elapsed_ms: elapsedMs,
          nonce,
        }
      }));
    }
  };

  const handleLeave = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'player_left',
        gameId: derbyGameState.id,
        derbyGameId: derbyGameState.id,
        gameType: 'derby',
        userId: auth.user.id,
      }));
    }

    router.delete(route('games.derby.leave', derbyGameState.id), {
      onFinish: () => {
        router.visit('/games/derby');
      }
    });
  };

  const handleRestart = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'restart_derby_game',
        gameId: derbyGameState.id,
        derbyGameId: derbyGameState.id,
        gameType: 'derby',
        userId: auth.user.id,
        data: {
          players: derbyGameState.players.map(p => ({ ...p, score: 0, progress: 0, is_ready: false })),
          prompts: derby_game.prompts,
          difficulty: derbyGameState.difficulty,
          race_mode: derbyGameState.race_mode,
          race_duration_s: derbyGameState.race_duration_s,
          total_segments: derbyGameState.total_segments,
          max_players: derbyGameState.max_players,
          language_name: derbyGameState.language_name,
          hostId: derbyGameState.hostId,
          filters: derbyGameState.filters,
        }
      }));
    }
    setRaceStartTime(null);
    setTimeRemaining(derbyGameState.race_duration_s);
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-100 leading-tight">
            Derby Race #{derbyGameState.id}
          </h2>
          <button
            onClick={() => setShowExitConfirmation(true)}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            <MdClose size={24} />
          </button>
        </div>
      }
    >
      <Head title={`Derby Race #${derbyGameState.id}`} />

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
              <GameInfo
                game={derbyGameState}
                timeRemaining={timeRemaining}
                isHost={isHost}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2">
                  {derbyGameState.status === 'waiting' ? (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                        Waiting for Players...
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {derbyGameState.players.filter(p => p.is_ready).length} / {derbyGameState.players.length} players ready
                      </p>
                      {!currentPlayer?.is_ready && (
                        <button
                          onClick={handleReady}
                          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                        >
                          I'm Ready!
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <Track
                        players={derbyGameState.players}
                        currentUserId={auth.user.id}
                        status={derbyGameState.status}
                      />
                      
                      {derbyGameState.status === 'in_progress' && currentPrompt && (
                        <PromptPanel
                          prompt={currentPrompt}
                          difficulty={derbyGameState.difficulty}
                          onAnswer={handleAnswer}
                          lastAnswer={lastAnswer}
                          myLastAnswer={myLastAnswer}
                          currentUserId={auth.user.id}
                          revealCorrect={revealCorrect}
                        />
                      )}

                      {derbyGameState.status === 'completed' && (
                        <div className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-8 text-center mt-6">
                          <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                            🏁 Race Complete!
                          </h3>
                          <div className="space-y-3 mb-6">
                            {derbyGameState.players
                              .sort((a, b) => b.progress - a.progress)
                              .map((player, index) => (
                                <div
                                  key={player.id}
                                  className={`flex justify-between items-center p-4 rounded-lg ${
                                    index === 0 ? 'bg-yellow-200 dark:bg-yellow-900' :
                                    index === 1 ? 'bg-gray-200 dark:bg-gray-700' :
                                    index === 2 ? 'bg-orange-200 dark:bg-orange-900' :
                                    'bg-white dark:bg-gray-800'
                                  }`}
                                >
                                  <span className="font-bold">
                                    {index + 1}. {player.player_name}
                                  </span>
                                  <span className="text-sm">
                                    {Math.round(player.progress * 100)}% • {player.score} pts
                                  </span>
                                </div>
                              ))}
                          </div>
                          {isHost && (
                            <button
                              onClick={handleRestart}
                              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                            >
                              Race Again
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="lg:col-span-1">
                  <PlayersInfo
                    players={derbyGameState.players}
                    currentUserId={auth.user.id}
                    hostId={hostId}
                    status={derbyGameState.status}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showExitConfirmation && (
        <ConfirmationExitModal
          title="Leave Race?"
          message="Are you sure you want to leave this race?"
          onLeave={handleLeave}
          onCancel={() => setShowExitConfirmation(false)}
        />
      )}
    </AuthenticatedLayout>
  );
}
