import React, { useEffect, useMemo, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { router } from '@inertiajs/react';
import GameArea from '@/Components/VerbConjugationSlotGame/GameArea';
import { useTranslation } from 'react-i18next';

interface Player {
  id: number;
  user_id: number;
  player_name: string;
  score: number;
  is_ready?: boolean;
  is_guest?: boolean;
}

interface LanguageInfo { id: number; code: string; name: string; flag: string }

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

interface Props {
  justCreated: boolean;
  game: GameProps;
  wsEndpoint: string;
}

export default function Show({ justCreated, game, wsEndpoint }: Props) {
  const [players, setPlayers] = useState<Player[]>(game.players);
  const [status, setStatus] = useState<GameProps['status']>(game.status);
  const [currentRound, setCurrentRound] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState<VCSPrompt | null>(game.prompts?.[0] ?? null);
  const [lastAnswer, setLastAnswer] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  const me = useMemo(() => {
    // Inertia shares auth.user globally; fall back to first matching player if needed
    // @ts-ignore
    const authUser = (window as any).ziggy?.props?.auth?.user;
    return players.find(p => p.user_id === authUser?.id) || null;
  }, [players]);

  useEffect(() => {
    const ws = new WebSocket(wsEndpoint);
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join_lobby',
        gameType: 'verb_conjugation_slot',
        userId: me?.user_id,
      }));
      ws.send(JSON.stringify({
        type: 'verb_conjugation_slot_join_game',
        gameType: 'verb_conjugation_slot',
        gameId: String(game.id),
        userId: me?.user_id,
        data: {
          players: me ? [me] : [],
          prompts: game.prompts,
          max_players: game.max_players,
          total_rounds: game.total_rounds,
          hostId: game.hostId,
        },
      }));
    };

    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'answer_submitted') {
        setLastAnswer(msg.data);
      }
      if (msg.type === 'spin_result') {
        setCurrentPrompt(msg.data?.prompt ?? null);
      }
      if (msg.type === 'verb_conjugation_slot_game_state_updated') {
        if (msg.data?.players) setPlayers(msg.data.players);
        if (typeof msg.data?.current_round === 'number') setCurrentRound(msg.data.current_round);
        if (msg.data?.current_prompt) setCurrentPrompt(msg.data.current_prompt);
        if (msg.data?.status) setStatus(msg.data.status);
      }
    };

    return () => { try { ws.close(); } catch {} };
  }, [wsEndpoint, game.id]);

  const send = (payload: any) => {
    const ws = wsRef.current; if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(payload));
  };

  const markReady = () => {
    if (!me) return;
    send({ type: 'verb_conjugation_slot_player_ready', gameType: 'verb_conjugation_slot', gameId: String(game.id), userId: me.user_id, data: { player_id: me.id } });
  };

  const startSpin = () => {
    if (!me) return;
    send({ type: 'verb_conjugation_slot_start_spin', gameType: 'verb_conjugation_slot', gameId: String(game.id), userId: me.user_id });
  };

  const submit = (val?: string) => {
    if (!me) return;
    const toSend = val ?? answer;
    send({ type: 'verb_conjugation_slot_submit_conjugation', gameType: 'verb_conjugation_slot', gameId: String(game.id), userId: me.user_id, data: { userId: me.user_id, player_id: me.id, answer: toSend } });
    setAnswer('');
  };

  const leave = () => {
    router.delete(route('games.verb-conjugation-slot.leave', { verbConjugationSlotGame: game.id }));
  };

  const isHost = me?.user_id === game.hostId;
  const { t: trans } = useTranslation();

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
            promptsForReels={game.prompts}
            me={me}
            isHost={isHost}
            timerSeconds={15}
            onTimerEnd={() => { /* no-op for now */ }}
            onReady={markReady}
            onStartSpin={startSpin}
            onSubmitAnswer={(ans) => submit(ans)}
            lastAnswer={lastAnswer}
          />
        </div>

        <div className="bg-white border rounded p-4">
          <div className="font-semibold mb-2">Players</div>
          <ul className="space-y-1">
            {players.map(p => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span>{p.player_name} {p.is_ready ? '✅' : ''}</span>
                <span className="text-gray-600">{p.score}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
