import React, { useEffect, useMemo, useRef, useState } from 'react';
import Reel from './Reel';
import CircularTimer from '@/Components/Games/CircularTimer';
import SpecialCharacterButtons from '@/Components/SpecialCharacterButtons';
import { useTranslation } from 'react-i18next';

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
  lastAnswer?: { player_name: string; answer: string; correct: boolean; userId?: number; playerId?: number } | null;
  specialCharacters?: string[];
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
  specialCharacters = [],
}: Props) {
  const [answer, setAnswer] = useState('');
  const [spinTrigger, setSpinTrigger] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const [cooldown, setCooldown] = useState(false);
  const cooldownRef = React.useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t: trans } = useTranslation();

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
    let p = pronounPool.findIndex(x => x.code === prompt.pronoun.code);
    let v = verbPool.findIndex(x => x.infinitive === prompt.verb.infinitive);
    let t = tensePool.findIndex(x => x.code === prompt.tense.code);
    if (p === -1 || v === -1 || t === -1) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[VCS GameArea] stop index not found', {
          pronounCode: prompt.pronoun.code,
          verbInf: prompt.verb.infinitive,
          tenseCode: prompt.tense.code,
          pIndex: p, vIndex: v, tIndex: t,
          pools: { pronounPool, verbPool, tensePool }
        });
      }
      p = Math.max(0, p);
      v = Math.max(0, v);
      t = Math.max(0, t);
    }
    return { p, v, t };
  }, [prompt, pronounPool, verbPool, tensePool]);

  // Trigger reel animation whenever a new prompt arrives
  useEffect(() => {
    if (!prompt) return;
    setSpinTrigger(x => x + 1);
    setTimeLeft(timerSeconds);
  }, [prompt]);

  // Countdown timer: runs only in progress and when a prompt is present
  useEffect(() => {
    if (status !== 'in_progress' || !prompt) return;
    if (timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(id);
          onTimerEnd && onTimerEnd();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [status, prompt, timeLeft]);

  // Brief cooldown after a wrong submission by the local player to avoid spam
  useEffect(() => {
    if (!lastAnswer || !me) return;
    if (!lastAnswer.correct && (lastAnswer.userId === me.user_id || lastAnswer.playerId === me.id)) {
      setCooldown(true);
      if (cooldownRef.current) window.clearTimeout(cooldownRef.current as unknown as number);
      cooldownRef.current = window.setTimeout(() => {
        setCooldown(false);
        cooldownRef.current = null;
      }, 600);
    }
  }, [lastAnswer, me?.user_id, me?.id]);

  const submit = () => {
    if (!answer.trim()) return;
    onSubmitAnswer(answer);
    setAnswer('');
  };

  const insertSpecialCharacter = (char: string) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? answer.length;
    const end = input.selectionEnd ?? answer.length;
    const newAnswer = answer.substring(0, start) + char + answer.substring(end);
    setAnswer(newAnswer);

    // Set cursor position after inserted character
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + 1, start + 1);
    }, 0);
  };

  return (
    <div className="space-y-4">
      {status === 'in_progress' && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">{trans('verb_conjugation_slot.round')} {currentRound + 1} / {totalRounds}</div>
          <div className="w-12 h-12">
            <CircularTimer timeLeft={timeLeft} totalTime={timerSeconds} key={`${currentRound}-${spinTrigger}`} />
          </div>
        </div>
      )}

      {/* Waiting state: inline panel (no modal) */}
      {status === 'waiting' && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-2xl p-8 shadow-lg text-center">
          <div className="text-5xl mb-4">⏳</div>
          <div className="text-gray-700 dark:text-gray-300 text-lg mb-6">{trans('verb_conjugation_slot.waiting_for_players')}</div>
          <button onClick={onReady} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
            {trans('verb_conjugation_slot.i_am_ready')}
          </button>
        </div>
      )}

      {status === 'in_progress' && (
        <>
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
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{trans('verb_conjugation_slot.input_hint')}</div>
            <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-2">
              <input
                ref={inputRef}
                className={`flex-1 min-w-0 border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 ${cooldown ? 'opacity-60 cursor-not-allowed' : ''}`}
                placeholder={trans('verb_conjugation_slot.input_placeholder')}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                disabled={cooldown}
              />
              <button onClick={submit} disabled={cooldown} className={`bg-indigo-600 text-white px-4 py-2 rounded w-full md:w-auto ${cooldown ? 'opacity-60 cursor-not-allowed' : ''}`}>{trans('generals.submit')}</button>
              {/* Spin is automatic; no manual start button */}
            </div>
            {specialCharacters.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{trans('Special characters')}:</div>
                <SpecialCharacterButtons
                  specialCharacters={specialCharacters}
                  onCharacterClick={insertSpecialCharacter}
                />
              </div>
            )}
            {lastAnswer && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {trans('verb_conjugation_slot.last_answer_prefix')} <span className={lastAnswer.correct ? 'text-green-700' : 'text-red-700'}>
                  {lastAnswer.player_name} → {lastAnswer.answer} ({lastAnswer.correct ? trans('verb_conjugation_slot.correct') : trans('verb_conjugation_slot.wrong')})
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
