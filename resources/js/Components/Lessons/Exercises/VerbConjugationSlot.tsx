import React, { useEffect, useMemo, useRef, useState } from 'react';

// One verb entry (present lesson: only subject + conjugation). Extensible with optional fields.
export interface ConjugationEntry {
  verb: string;                 // e.g., "sein" or any language verb label
  infinitive?: string;          // optional alias if verb has a base form separate from label
  // Map of subject label → conjugated form. Subject labels are arbitrary strings (language-agnostic).
  forms: Record<string, string>;
  tense?: string;               // future extension (e.g., 'present')
  mood?: string;                // future extension (e.g., 'indicative')
  notes?: string;               // optional helper text
}

export interface VerbConjugationSlotProps {
  items: ConjugationEntry[];
  // Optional: supply explicit subject labels/order. If omitted, subjects are inferred from data.
  subjects?: string[];
  // UI options
  shuffleOnMount?: boolean;
  spinDurationMs?: number; // total duration for the spin animation
  onRoundComplete?: (payload: {
    verb: string;
    subject: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }) => void;
  className?: string;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const VerbConjugationSlot: React.FC<VerbConjugationSlotProps> = ({
  items,
  subjects,
  shuffleOnMount = true,
  spinDurationMs = 1400,
  onRoundComplete,
  className,
}) => {
  const [currentVerb, setCurrentVerb] = useState<ConjugationEntry | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [landedSubject, setLandedSubject] = useState<string | null>(null);
  const [displaySubject, setDisplaySubject] = useState<string | null>(null); // for animation cycling
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<null | { correct: boolean; expected: string }>(null);
  const spinTimer = useRef<number | null>(null);

  // Determine the subject set: use provided list, otherwise infer from all items' form keys (stable order)
  const subjectCycle = useMemo(() => {
    if (subjects && subjects.length > 0) return subjects;
    const set = new Set<string>();
    for (const it of items || []) {
      Object.keys(it.forms || {}).forEach((k) => set.add(k));
    }
    return Array.from(set);
  }, [items, subjects]);

  // UI strings are currently hardcoded in English by request.

  useEffect(() => {
    if (!items || items.length === 0) return;
    const initial = shuffleOnMount ? pickRandom(items) : items[0];
    setCurrentVerb(initial);
    setDisplaySubject(subjectCycle[0]);
    setLandedSubject(null);
    setAnswer('');
    setResult(null);
  }, [items, shuffleOnMount, subjectCycle]);

  useEffect(() => {
    return () => {
      if (spinTimer.current) window.clearInterval(spinTimer.current);
    };
  }, []);

  const startSpin = () => {
    if (!currentVerb || spinning) return;
    setResult(null);
    setAnswer('');
    setLandedSubject(null);
    setSpinning(true);

    let idx = 0;
    const interval = 80; // ms per tick
    const total = spinDurationMs;
    let elapsed = 0;

    // accelerate then decelerate feel (simple easing by varying interval length)
    let currentInterval = interval;

    spinTimer.current = window.setInterval(() => {
      // cycle subject visually
      setDisplaySubject(subjectCycle[idx % subjectCycle.length]);
      idx++;
      elapsed += currentInterval;

      // ease towards end by increasing interval
      if (elapsed > total * 0.6) {
        currentInterval = Math.min(currentInterval + 20, 220);
        if (spinTimer.current) {
          window.clearInterval(spinTimer.current);
          spinTimer.current = window.setInterval(() => {
            setDisplaySubject(subjectCycle[idx % subjectCycle.length]);
            idx++;
            elapsed += currentInterval;
            if (elapsed >= total) {
              if (spinTimer.current) window.clearInterval(spinTimer.current);
              // land on a random subject from list that exists in forms
              const available = subjectCycle.filter((s) => currentVerb.forms[s] !== undefined);
              const finalSubject = pickRandom(available);
              setDisplaySubject(finalSubject);
              setLandedSubject(finalSubject);
              setSpinning(false);
            }
          }, currentInterval);
        }
      }

      if (elapsed >= total) {
        if (spinTimer.current) window.clearInterval(spinTimer.current);
        const available = subjectCycle.filter((s) => currentVerb.forms[s] !== undefined);
        const finalSubject = pickRandom(available);
        setDisplaySubject(finalSubject);
        setLandedSubject(finalSubject);
        setSpinning(false);
      }
    }, currentInterval);
  };

  const checkAnswer = () => {
    if (!currentVerb || !landedSubject) return;
    const expected = (currentVerb.forms[landedSubject] || '').trim();
    const user = answer.trim();
    const isCorrect = expected.localeCompare(user, undefined, { sensitivity: 'accent' }) === 0;
    setResult({ correct: isCorrect, expected });
    onRoundComplete?.({
      verb: currentVerb.verb,
      subject: landedSubject,
      userAnswer: user,
      correctAnswer: expected,
      isCorrect,
    });
  };

  const nextRound = () => {
    if (!items || items.length === 0) return;
    const nextVerb = pickRandom(items);
    setCurrentVerb(nextVerb);
    setAnswer('');
    setResult(null);
    setLandedSubject(null);
    setDisplaySubject(subjectCycle[0]);
  };

  const canCheck = !!currentVerb && !!landedSubject && answer.trim().length > 0;

  return (
    <div className={"w-full max-w-xl mx-auto p-4 rounded-lg border border-gray-200 bg-white shadow-sm " + (className || '')}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-500">Verb</div>
        <div className="text-lg font-semibold">{currentVerb?.verb}</div>
        {currentVerb?.tense && (
          <div className="text-xs text-gray-400">{currentVerb.tense}</div>
        )}
      </div>

      {/* Slot display */}
      <div className="relative overflow-hidden rounded-lg border bg-gray-50">
        <div className="flex items-center justify-center h-20 text-2xl font-bold tracking-wide">
          {displaySubject ?? '—'}
        </div>
        <div className="absolute inset-0 pointer-events-none border-y-4 border-transparent" />
      </div>

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={startSpin}
          disabled={spinning}
          className={`px-4 py-2 rounded-md text-white ${spinning ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {spinning ? 'Spinning…' : 'Spin Subject'}
        </button>

        <button
          type="button"
          onClick={nextRound}
          disabled={spinning}
          className={`px-4 py-2 rounded-md border ${spinning ? 'bg-white text-gray-400 border-gray-200' : 'bg-white hover:bg-gray-50'}`}
        >
          Next Verb
        </button>
      </div>

      {/* Answer input */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Your conjugation</label>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={!landedSubject || spinning}
          placeholder={landedSubject ? `Type the form for "${landedSubject}"` : 'Spin to get a subject'}
          className="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <div className="text-xs text-gray-500 mt-1">Exact match (case-insensitive, accent-insensitive)</div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={checkAnswer}
          disabled={!canCheck || spinning}
          className={`px-4 py-2 rounded-md text-white ${canCheck && !spinning ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400'}`}
        >
          Check
        </button>
      </div>

      {/* Feedback */}
      {result && (
        <div className={`mt-3 p-3 rounded-md ${result.correct ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {result.correct ? (
            <div className="font-medium">Correct! 🎉</div>
          ) : (
            <div>
              <div className="font-medium">Not quite.</div>
              <div className="text-sm">Expected: <span className="font-semibold">{result.expected}</span></div>
            </div>
          )}
        </div>
      )}

      {/* Subject reference guide */}
      <div className="mt-6">
        <details className="text-sm text-gray-600">
          <summary className="cursor-pointer select-none font-medium text-gray-700">Subjects reference</summary>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {subjectCycle.map((s) => (
              <div key={s} className="px-2 py-1 rounded border text-center bg-white">{s}</div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
};

export default VerbConjugationSlot;
