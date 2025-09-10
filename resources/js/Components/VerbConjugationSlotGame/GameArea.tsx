import React, { useEffect, useMemo, useState } from 'react';
import Reel from './Reel';
import CircularTimer from '@/Components/Games/CircularTimer';

export interface VCSPrompt {
  pronoun: { id: number; code: string; display: string };
  verb: { id: number; infinitive: string; translation?: string | null };
  tense: { id: number; code: string; name: string };
  expected: string;
  normalized_expected: string;
}

export interface Player {
  id: number;
  user_id: number;
  player_name: string;
  score: number;
  is_ready?: boolean;
}

interface Props {
  status: 'waiting' | 'in_progress' | 'completed';
  currentRound: number;
  totalRounds: number;
  prompt: VCSPrompt | null;
  promptsForReels?: VCSPrompt[]; // used to derive the visible pools
  me?: Player | null;
  isHost?: boolean;
  timerSeconds?: number;
  onTimerEnd?: () => void;
  onReady: () => void;
  onStartSpin: () => void;
  onSubmitAnswer: (answer: string) => void;
  lastAnswer?: { player_name: string; answer: string; correct: boolean } | null;
}

export default function GameArea({
  status,
  currentRound,
  totalRounds,
  prompt,
  promptsForReels = [],
  me,
  isHost = false,
  timerSeconds = 15,
  onTimerEnd,
  onReady,
  onStartSpin,
  onSubmitAnswer,
  lastAnswer,
}: Props) {
  const [answer, setAnswer] = useState('');
  const [spinTrigger, setSpinTrigger] = useState(0);

  // Build pools for reels from provided prompts list
  const pronounPool = useMemo(
    () => Array.from(new Map(promptsForReels.map(p => [p.pronoun.code, p.pronoun])).values()),
    [promptsForReels]
  );
  const verbPool = useMemo(
    () => Array.from(new Map(promptsForReels.map(p => [p.verb.infinitive, p.verb])).values()),
    [promptsForReels]
  );
  const tensePool = useMemo(
    () => Array.from(new Map(promptsForReels.map(p => [p.tense.code, p.tense])).values()),
    [promptsForReels]
  );

  // Determine stop indices based on the current prompt
  const stops = useMemo(() => {
    if (!prompt) return { p: null as number | null, v: null as number | null, t: null as number | null };
    const p = pronounPool.findIndex(x => x.code === prompt.pronoun.code);
    const v = verbPool.findIndex(x => x.infinitive === prompt.verb.infinitive);
    const t = tensePool.findIndex(x => x.code === prompt.tense.code);
    return { p, v, t };
  }, [prompt, pronounPool, verbPool, tensePool]);

  // Trigger reel animation whenever a new prompt arrives
  useEffect(() => {
    if (!prompt) return;
    setSpinTrigger(x => x + 1);
  }, [prompt]);

  const submit = () => {
    if (!answer.trim()) return;
    onSubmitAnswer(answer);
    setAnswer('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Round {currentRound + 1} / {totalRounds}</div>
        <div className="w-12 h-12">
          <CircularTimer timeLeft={timerSeconds} totalTime={15} key={`${currentRound}-${spinTrigger}`} />
        </div>
      </div>

      {/* Reels */}
      <div className="sm:flex sm:justify-center">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Reel
            items={pronounPool}
            itemToLabel={(x) => x.display}
            stopIndex={stops.p}
            spinTrigger={spinTrigger}
            height={56}
          />
          <Reel
            items={verbPool}
            itemToLabel={(x) => x.infinitive}
            stopIndex={stops.v}
            spinTrigger={spinTrigger}
            height={56}
          />
          <Reel
            items={tensePool}
            itemToLabel={(x) => x.name}
            stopIndex={stops.t}
            spinTrigger={spinTrigger}
            height={56}
          />
        </div>
      </div>

      {/* Input */}
      <div className="bg-red-500 dark:bg-gray-800 border dark:border-gray-700 rounded p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Exact match (case-insensitive, accent-insensitive)</div>
        <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-2">
          <input
            className="flex-1 min-w-0 border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
            placeholder="Your conjugation"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          />
          <button onClick={submit} className="bg-indigo-600 text-white px-4 py-2 rounded w-full md:w-auto">Submit</button>
          <button onClick={onReady} className="bg-green-600 text-white px-4 py-2 rounded w-full md:w-auto">Ready</button>
          {isHost && (
            <button onClick={onStartSpin} className="bg-blue-600 text-white px-4 py-2 rounded w-full md:w-auto">Start Spin</button>
          )}
        </div>
        {lastAnswer && (
          <div className="mt-2 text-sm">
            Last answer: <span className={lastAnswer.correct ? 'text-green-700' : 'text-red-700'}>
              {lastAnswer.player_name} → {lastAnswer.answer} ({lastAnswer.correct ? 'correct' : 'wrong'})
            </span>
          </div>
        )}
      </div>

      {/* Overlay for transitions */}
      {status === 'waiting' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded shadow p-6 text-center">
            <div className="font-semibold mb-2">Waiting for players to be ready…</div>
            <button onClick={onReady} className="bg-green-600 text-white px-4 py-2 rounded">I'm Ready</button>
          </div>
        </div>
      )}
    </div>
  );
}
