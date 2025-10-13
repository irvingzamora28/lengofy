import React, { useEffect, useMemo, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { router } from '@inertiajs/react';
import GameArea from '@/Components/VerbConjugationSlotGame/GameArea';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { PageProps } from '@/types';

interface Player {
  id: number;
  user_id: number;
  player_name: string;
  score: number;
  is_ready?: boolean;
  is_guest?: boolean;
}

interface LanguageInfo { id: number; code: string; name: string; flag: string; special_characters?: string[] }

interface VCSPrompt {
  pronoun: { id: number; code: string; display: string };
  verb: { id: number; infinitive: string; translation?: string | null };
  tense: { id: number; code: string; name: string };
  expected: string;
  normalized_expected: string;
}

interface GameProps {
  id: number;
  status: 'waiting' | 'in_progress' | 'completed';
  players: Player[];
  max_players: number;
  total_rounds: number;
  difficulty: 'easy' | 'medium' | 'hard';
  language_name: string;
  source_language: LanguageInfo;
  target_language: LanguageInfo;
  prompts: VCSPrompt[];
  hostId: number;
  category: any;
}

interface Props extends PageProps {
  auth: any;
  justCreated: boolean;
  game: GameProps;
  wsEndpoint: string;
}

export default function Show({ auth, justCreated, game, wsEndpoint }: Props) {
  const [players, setPlayers] = useState<Player[]>(game.players);
  const [status, setStatus] = useState<GameProps['status']>(game.status);
  const [currentRound, setCurrentRound] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState<VCSPrompt | null>(game.prompts?.[0] ?? null);
  const [lastAnswer, setLastAnswer] = useState<any>(null);
  const [prompts, setPrompts] = useState<VCSPrompt[]>(game.prompts);
  const [answer, setAnswer] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const initWsRef = useRef(false);
  const broadcastCreatedRef = useRef(false);
  const spinTriggeredRoundRef = useRef<number | null>(null);

  const me = useMemo(() => {
    const userId = auth?.user?.id;
    const found = players.find(p => p.user_id === userId) || null;
    if (found) console.log('[VCS Show] me resolved:', found);
    else console.log('[VCS Show] me not found for userId', userId, 'players:', players);
    return found;
  }, [players, auth?.user?.id]);

  // Post final score once when game completes
  const postedRef = useRef(false);
  useEffect(() => {
    if (status === 'completed' && me && !postedRef.current) {
      postedRef.current = true;
      try {
        const currentScore = me.score || 0;
        const prevRaw = localStorage.getItem(`verbConjugationSlotScores_${auth?.user?.id}`) || '{"highestScore":0,"totalPoints":0,"winningStreak":0}';
        const prev = JSON.parse(prevRaw);
        const highest_score = Math.max(prev.highestScore || 0, currentScore);
        const total_points = (prev.totalPoints || 0) + currentScore;
        const winning_streak = 0;

        console.log('[VCS Show] Posting final score to scores.update', { user_id: me.user_id, game_id: 4, currentScore, highest_score, total_points, winning_streak });
        axios.post(route('scores.update'), {
          user_id: me.user_id,
          game_id: 4,
          highest_score,
          total_points,
          winning_streak,
        }).then(() => {
          console.log('[VCS Show] Score posted successfully');
          localStorage.setItem(`verbConjugationSlotScores_${auth?.user?.id}` , JSON.stringify({ highestScore: highest_score, totalPoints: total_points, winningStreak: winning_streak }));
        }).catch((e) => console.error('[VCS Show] Failed to post multiplayer score', e));
      } catch (e) {
        console.error('[VCS Show] Error computing score update', e);
      }
    }
  }, [status, me]);

  useEffect(() => {
    console.log('[VCS Show] WS effect run', { wsEndpoint, gameId: game.id, userId: auth?.user?.id, alreadyInitialized: initWsRef.current });
    if (initWsRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.warn('[VCS Show] WS effect re-ran while already initialized. Skipping re-init.');
      return;
    }
    const ws = new WebSocket(wsEndpoint);
    wsRef.current = ws;
    ws.onopen = () => {
      console.log('[VCS Show] WS open. Joining lobby and game room...', { wsEndpoint, gameId: game.id });
      const user = auth?.user;
      const playerPayload: Player = {
        id: user?.id ?? 0,
        user_id: user?.id ?? 0,
        player_name: user?.name ?? 'You',
        score: 0,
        is_ready: false,
      };

      // Join lobby (optional broadcast)
      console.log('[VCS Show] Sending join_lobby');
      ws.send(JSON.stringify({
        type: 'join_lobby',
        gameType: 'verb_conjugation_slot',
        userId: user?.id,
      }));

      // Join game room and ensure current player is in state
      console.log('[VCS Show] Sending verb_conjugation_slot_join_game with payload:', { playerPayload, prompts: game.prompts?.length, max_players: game.max_players, total_rounds: game.total_rounds, hostId: game.hostId });
      ws.send(JSON.stringify({
        type: 'verb_conjugation_slot_join_game',
        gameType: 'verb_conjugation_slot',
        gameId: String(game.id),
        userId: user?.id,
        data: {
          players: [playerPayload],
          prompts: game.prompts,
          max_players: game.max_players,
          total_rounds: game.total_rounds,
          hostId: game.hostId,
        },
      }));

      // If this is a newly created game, broadcast it to the lobby (only once)
      if (justCreated && !broadcastCreatedRef.current) {
        broadcastCreatedRef.current = true;
        console.log('[VCS Show] Broadcasting game_created to lobby');
        ws.send(JSON.stringify({
          type: 'verb_conjugation_slot_game_created',
          gameId: String(game.id),
          game: game,
        }));
      }

      // Auto-ready for single-player rooms
      if (game.max_players === 1) {
        console.log('[VCS Show] Single-player room: auto-ready');
        ws.send(JSON.stringify({
          type: 'verb_conjugation_slot_player_ready',
          gameId: String(game.id),
          gameType: 'verb_conjugation_slot',
          userId: user?.id,
          data: { player_id: playerPayload.id, user_id: user?.id }
        }));
      }
    };

    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      console.log('[VCS Show] WS message:', msg.type, msg.data);
      if (msg.type === 'answer_submitted') {
        console.log('[VCS Show] answer_submitted', msg.data);
        setLastAnswer(msg.data);
      }
      if (msg.type === 'spin_result') {
        console.log('[VCS Show] spin_result prompt:', msg.data?.prompt);
        const p = msg.data?.prompt ?? null;
        setCurrentPrompt(p);
        if (p) {
          setPrompts(prev => {
            const hasPronoun = prev.some(x => x.pronoun.code === p.pronoun.code);
            const hasVerb = prev.some(x => x.verb.infinitive === p.verb.infinitive);
            const hasTense = prev.some(x => x.tense.code === p.tense.code);
            if (hasPronoun && hasVerb && hasTense) return prev;
            // If any piece is missing, add this prompt to stabilize pools
            return [...prev, p];
          });
        }
      }
      if (msg.type === 'verb_conjugation_slot_game_state_updated') {
        console.log('[VCS Show] game_state_updated', msg.data);
        if (msg.data?.players) {
          setPlayers(prev => {
            const incoming: Player[] = msg.data.players;
            const merged = incoming.map(ip => {
              const prevMatch = prev.find(p => p.user_id === ip.user_id || p.id === ip.id);
              const is_ready = typeof (ip as any).is_ready === 'boolean' ? (ip as any).is_ready : (prevMatch?.is_ready ?? false);
              return { ...ip, is_ready } as Player;
            });
            return merged;
          });
        }
        if (Array.isArray(msg.data?.prompts)) {
          setPrompts(msg.data.prompts);
        }
        if (typeof msg.data?.current_round === 'number') setCurrentRound(msg.data.current_round);
        if (msg.data?.current_prompt) setCurrentPrompt(msg.data.current_prompt);
        if (msg.data?.status) setStatus(msg.data.status);
        // Auto-start the spin when game switches to in_progress and no prompt has been selected yet (host only)
        const isHostNow = auth?.user?.id === game.hostId;
        if (
          msg.data?.status === 'in_progress' &&
          !msg.data?.current_prompt &&
          typeof msg.data?.current_round === 'number' &&
          isHostNow &&
          spinTriggeredRoundRef.current !== msg.data.current_round
        ) {
          console.log('[VCS Show] Auto-starting spin for round', msg.data.current_round);
          spinTriggeredRoundRef.current = msg.data.current_round;
          startSpin();
        }
        if (Array.isArray(msg.data?.players) && msg.data.players.length === 0) {
          console.log('[VCS Show] players empty, navigating back to lobby');
          router.visit(route('games.verb-conjugation-slot.lobby'));
          return;
        }
      }
      if (msg.type === 'player_ready' || msg.type === 'verb_conjugation_slot_player_ready') {
        const readyUserId = msg.data?.user_id ?? msg.data?.userId;
        const readyPlayerId = msg.data?.player_id;
        console.log('[VCS Show] player_ready received', { readyUserId, readyPlayerId });
        setPlayers(prev => prev.map(p => (p.user_id === readyUserId || p.id === readyPlayerId) ? { ...p, is_ready: true } : p));
      }
    };

    return () => { try { ws.close(); } catch {} };
  }, [wsEndpoint, game.id, auth?.user?.id]);

  const send = (payload: any) => {
    const ws = wsRef.current; if (!ws || ws.readyState !== WebSocket.OPEN) return;
    console.log('[VCS Show] WS send:', payload);
    ws.send(JSON.stringify(payload));
  };

  const markReady = () => {
    const userId = auth?.user?.id;
    console.log('[VCS Show] markReady called', { userId, me });
    send({ type: 'verb_conjugation_slot_player_ready', gameType: 'verb_conjugation_slot', gameId: String(game.id), userId, data: { player_id: me?.id, user_id: userId } });
  };

  const startSpin = () => {
    const userId = auth?.user?.id;
    console.log('[VCS Show] startSpin called by', userId);
    send({ type: 'verb_conjugation_slot_start_spin', gameType: 'verb_conjugation_slot', gameId: String(game.id), userId });
  };

  const submit = (val?: string) => {
    const userId = auth?.user?.id;
    const toSend = val ?? answer;
    const expectedRaw = currentPrompt?.normalized_expected ?? currentPrompt?.expected ?? '';
    const expectedNorm = (expectedRaw ?? '').toString().normalize('NFKC').trim().toLowerCase();
    const submittedNorm = (toSend ?? '').toString().normalize('NFKC').trim().toLowerCase();
    console.log('[VCS Show] submit called', { userId, player_id: me?.id, answer: toSend, expectedNorm, submittedNorm, equal: expectedNorm === submittedNorm });
    send({ type: 'verb_conjugation_slot_submit_conjugation', gameType: 'verb_conjugation_slot', gameId: String(game.id), userId, data: { userId, player_id: me?.id, answer: toSend } });
    setAnswer('');
  };

  const leave = () => {
    const userId = auth?.user?.id;
    console.log('[VCS Show] leave called', { userId });
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'verb_conjugation_slot_leave_game',
        gameId: String(game.id),
        userId,
      }));
    }
    router.delete(route('games.verb-conjugation-slot.leave', { verbConjugationSlotGame: game.id }));
  };

  const isHost = auth?.user?.id === game.hostId;
  const { t: trans } = useTranslation();
  const onRoundTimerEnd = () => {
    const userId = auth?.user?.id;
    console.log('[VCS Show] onRoundTimerEnd -> notifying server');
    send({ type: 'verb_conjugation_slot_round_timeout', gameType: 'verb_conjugation_slot', gameId: String(game.id), userId });
  };

  return (
    <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">{trans('verb_conjugation_slot.game_room_title')}</h2>}>
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">{game.language_name}</div>
            <div className="text-xs text-gray-500">{trans('verb_conjugation_slot.round')} {currentRound + 1} / {game.total_rounds}</div>
          </div>
          <button onClick={leave} className="text-sm text-red-600 hover:text-red-700">{trans('verb_conjugation_slot.leave')}</button>
        </div>
        <div className="mb-6">
          <GameArea
            status={status}
            currentRound={currentRound}
            totalRounds={game.total_rounds}
            prompt={currentPrompt}
            promptsForReels={prompts}
            me={me}
            isHost={isHost}
            timerSeconds={15}
            onTimerEnd={onRoundTimerEnd}
            onReady={markReady}
            onStartSpin={startSpin}
            onSubmitAnswer={(ans) => submit(ans)}
            lastAnswer={lastAnswer}
            specialCharacters={game.target_language.special_characters}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-600 dark:text-gray-200 rounded p-4">
          <div className="font-semibold mb-2">{trans('generals.games.players')}</div>
          <ul className="space-y-1">
            {players.map(p => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span>{p.player_name} {p.is_ready ? '✅' : ''}</span>
                <span className="text-gray-600 dark:text-gray-400">{p.score}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
