import React, { useEffect, useMemo, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { router } from '@inertiajs/react';

interface VCSPrompt {
  pronoun: { id: number; code: string; display: string };
  verb: { id: number; infinitive: string; translation?: string | null };
  tense: { id: number; code: string; name: string };
  expected: string;
  normalized_expected: string;
}

interface Props {
  prompts: VCSPrompt[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: number;
  targetLanguage: string;
}

export default function Practice({ prompts: initialPrompts, difficulty, category }: Props) {
  const [prompts, setPrompts] = useState<VCSPrompt[]>(initialPrompts || []);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<null | { correct: boolean; expected: string }>(null);
  const [remaining, setRemaining] = useState(15);
  const [score, setScore] = useState(0);
  const timerRef = useRef<number | null>(null);

  const prompt = useMemo(() => prompts[idx] ?? null, [prompts, idx]);

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
    if (correct) setScore((s) => s + 1);
    if (timerRef.current) window.clearInterval(timerRef.current);
    // move to next after short delay
    setTimeout(() => next(), 1200);
  };

  return (
    <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Practice: Verb Conjugation Slot</h2>}>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
          <div>Difficulty: <span className="font-semibold">{difficulty}</span></div>
          <div>Score: <span className="font-semibold">{score}</span></div>
          <div>Time: <span className="font-semibold">{remaining}s</span></div>
        </div>

        <div className="bg-white border rounded p-5">
          {prompt ? (
            <>
              <div className="text-xl">
                <span className="mr-2">{prompt.pronoun.display}</span>
                <span className="mr-2">{prompt.verb.infinitive}</span>
                <span className="text-gray-500">({prompt.tense.name})</span>
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  className="border rounded px-3 py-2 flex-1"
                  placeholder="Your conjugation"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                  autoFocus
                />
                <button onClick={() => handleSubmit()} className="bg-indigo-600 text-white px-4 py-2 rounded">Submit</button>
              </div>

              {result && (
                <div className="mt-3 text-sm">
                  {result.correct ? (
                    <span className="text-green-700">Correct!</span>
                  ) : (
                    <span className="text-red-700">Wrong. Expected: {result.expected}</span>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-600">Loading prompt...</div>
          )}
        </div>

        <div className="mt-6">
          <button onClick={() => router.visit(route('games.verb-conjugation-slot.lobby'))} className="text-indigo-600 hover:text-indigo-800 text-sm">Back to Lobby</button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
