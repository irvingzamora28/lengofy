import React, { useEffect, useMemo, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { router } from '@inertiajs/react';
import Reel from '@/Components/VerbConjugationSlotGame/Reel';
import CircularTimer from '@/Components/Games/CircularTimer';
import SpecialCharacterButtons from '@/Components/SpecialCharacterButtons';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { PageProps } from '@/types';

interface VCSPrompt {
  pronoun: { id: number; code: string; display: string };
  verb: { id: number; infinitive: string; translation?: string | null };
  tense: { id: number; code: string; name: string };
  expected: string;
  normalized_expected: string;
}

interface Props extends PageProps {
  prompts: VCSPrompt[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: number;
  targetLanguage: string;
  specialCharacters: string[];
}

export default function Practice({ prompts: initialPrompts, difficulty, category, auth, specialCharacters = [] }: Props) {
  const [prompts, setPrompts] = useState<VCSPrompt[]>(initialPrompts || []);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<null | { correct: boolean; expected: string }>(null);
  const [remaining, setRemaining] = useState(15);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const timerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [spinTrigger, setSpinTrigger] = useState(0);
  const { t: trans } = useTranslation();

  const prompt = useMemo(() => prompts[idx] ?? null, [prompts, idx]);

  // Build pools for reels from available prompts
  const pronounPool = useMemo(
    () => Array.from(new Map(prompts.map(p => [p.pronoun.code, p.pronoun])).values()),
    [prompts]
  );
  const verbPool = useMemo(
    () => Array.from(new Map(prompts.map(p => [p.verb.infinitive, p.verb])).values()),
    [prompts]
  );
  const tensePool = useMemo(
    () => Array.from(new Map(prompts.map(p => [p.tense.code, p.tense])).values()),
    [prompts]
  );

  const stops = useMemo(() => {
    if (!prompt) return { p: null as number | null, v: null as number | null, t: null as number | null };
    const p = pronounPool.findIndex(x => x.code === prompt.pronoun.code);
    const v = verbPool.findIndex(x => x.infinitive === prompt.verb.infinitive);
    const t = tensePool.findIndex(x => x.code === prompt.tense.code);
    return { p, v, t };
  }, [prompt, pronounPool, verbPool, tensePool]);

  const fetchMore = async () => {
    try {
      const url = route('games.verb-conjugation-slot.get-prompts', { difficulty, count: 10 });
      const res = await fetch(url.toString());
      const data: VCSPrompt[] = await res.json();
      setPrompts((prev) => [...prev, ...data]);
    } catch (e) {
      console.error('Failed to fetch prompts', e);
    }
  };

  const resetTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setRemaining(15);
    timerRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(timerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000) as unknown as number;
  };

  useEffect(() => {
    resetTimer();
    // trigger reel spin when prompt changes
    setSpinTrigger(x => x + 1);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [idx]);

  const next = () => {
    setResult(null);
    setAnswer('');
    const nextIdx = idx + 1;
    setIdx(nextIdx);
    if (nextIdx + 3 >= prompts.length) fetchMore();
  };

  const handleSubmit = (isTimeout = false) => {
    if (!prompt) return;
    const normalized = (answer || '').trim().toLowerCase();
    const correct = !isTimeout && normalized === (prompt.normalized_expected || '').toLowerCase();
    setResult({ correct, expected: prompt.expected });
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => {
        const ns = s + 1;
        setLongestStreak((ls) => Math.max(ls, ns));
        return ns;
      });
    } else {
      setStreak(0);
    }
    if (timerRef.current) window.clearInterval(timerRef.current);
    // move to next after short delay
    setTimeout(() => next(), 1200);
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

  const updateAddScore = async () => {
    try {
      const authUser = auth?.user;
      if (!authUser?.id) return;
      await axios.post(route('scores.update-add-score'), {
        user_id: authUser.id,
        game_id: 4, // verb-conjugation-slot
        score: score,
        correct_streak: longestStreak,
      });
    } catch (e) {
      console.error('Failed to update score', e);
    }
  };

  return (
    <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">{trans('verb_conjugation_slot.practice_title')}</h2>}>
      <div className="max-w-3xl sm:max-w-5xl lg:max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-4 text-sm text-gray-600 dark:text-gray-300">
          <div>{trans('verb_conjugation_slot.game_info.difficulty')}: <span className="font-semibold">{difficulty}</span></div>
          <div>{trans('verb_conjugation_slot.game_info.score')}: <span className="font-semibold">{score}</span></div>
          <div className="w-14 h-14">
            <CircularTimer timeLeft={remaining} totalTime={15} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded p-5 sm:p-6 lg:p-8">
          {prompt ? (
            <>
              {/* Reels */}
              <div className="mb-4 sm:flex sm:justify-center">
                <div className="grid grid-cols-3 gap-2 sm:gap-6 lg:gap-8 sm:inline-grid">
                  <Reel
                    items={pronounPool}
                    itemToLabel={(x) => x.display}
                    stopIndex={stops.p}
                    spinTrigger={spinTrigger}
                    height={64}
                  />
                  <Reel
                    items={verbPool}
                    itemToLabel={(x) => x.infinitive}
                    stopIndex={stops.v}
                    spinTrigger={spinTrigger}
                    height={64}
                  />
                  <Reel
                    items={tensePool}
                    itemToLabel={(x) => x.name}
                    stopIndex={stops.t}
                    spinTrigger={spinTrigger}
                    height={64}
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <input
                    ref={inputRef}
                    className="border dark:border-gray-600 rounded px-3 py-2 flex-1 min-w-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                    placeholder={trans('verb_conjugation_slot.input_placeholder')}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                    autoFocus
                  />
                  <button onClick={() => handleSubmit()} className="bg-indigo-600 text-white px-4 py-2 rounded shrink-0 whitespace-nowrap">{trans('generals.submit')}</button>
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
              </div>

              {result && (
                <div className="mt-3 text-sm">
                  {result.correct ? (
                    <span className="text-green-700 dark:text-green-300">{trans('verb_conjugation_slot.game_info.result_correct')}</span>
                  ) : (
                    <span className="text-red-700 dark:text-red-300">{trans('verb_conjugation_slot.game_info.result_wrong_expected', { expected: result.expected })}</span>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-600 dark:text-gray-300">{trans('verb_conjugation_slot.game_info.loading_prompt')}</div>
          )}
        </div>

        <div className="mt-6">
          <button onClick={async () => { await updateAddScore(); router.visit(route('games.verb-conjugation-slot.lobby')); }} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm">{trans('verb_conjugation_slot.game_info.back_to_lobby')}</button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
