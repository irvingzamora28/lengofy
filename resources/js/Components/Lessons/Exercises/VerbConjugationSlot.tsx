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
  const [displaySubject, setDisplaySubject] = useState<string | null>(null); // current visible subject when not spinning
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<null | { correct: boolean; expected: string }>(null);
  const spinTimer = useRef<number | null>(null); // legacy, no longer used for rAF spinner

  // Reel animation state
  const reelRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const rafId = useRef<number | null>(null);
  const [reelItems, setReelItems] = useState<string[]>([]);
  const [reelOffset, setReelOffset] = useState(0); // px offset from top
  const ITEM_HEIGHT = 56; // px per subject row
  const inputRef = useRef<HTMLInputElement | null>(null);

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
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const startSpin = () => {
    if (!currentVerb || spinning) return;
    setResult(null);
    setAnswer('');
    setLandedSubject(null);
    setSpinning(true);

    // Build a long reel sequence and choose a final subject to land on
    const available = subjectCycle.filter((s) => currentVerb.forms[s] !== undefined);
    const finalSubject = pickRandom(available);
    const cycles = Math.max(6, Math.ceil(spinDurationMs / 200)); // number of full cycles for visual length
    const base = Array.from({ length: cycles }, () => available).flat();
    const sequence = [...base, finalSubject];
    setReelItems(sequence);
    setReelOffset(0);

    // rAF animation with easing
    const totalDistance = (sequence.length - 1) * ITEM_HEIGHT;
    const start = performance.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / spinDurationMs);
      const eased = easeOutCubic(t);
      const offset = eased * totalDistance;
      setReelOffset(offset);
      if (t < 1) {
        rafId.current = requestAnimationFrame(step);
      } else {
        // Snap to exact end
        setReelOffset(totalDistance);
        setDisplaySubject(finalSubject);
        setLandedSubject(finalSubject);
        setSpinning(false);
        // Collapse reel to just the result and reset offset so the word is visible
        setTimeout(() => {
          setReelItems([finalSubject]);
          setReelOffset(0);
          // Focus input for quick typing
          inputRef.current?.focus();
        }, 50);
      }
    };
    rafId.current = requestAnimationFrame(step);
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
    setReelItems([]);
    setReelOffset(0);
  };

  const canCheck = !!currentVerb && !!landedSubject && answer.trim().length > 0;

  // Scoped keyboard shortcuts (like FillInTheBlank)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const within = !!(rootRef.current && target && rootRef.current.contains(target));
      if (!within && !isHovered) return;

      // Don't hijack typing in other editable fields
      const tag = (target?.tagName || '').toLowerCase();
      const isEditable = tag === 'input' || tag === 'textarea' || (target && (target as HTMLElement).isContentEditable);

      // Enter: check (or spin if nothing landed yet)
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!spinning && canCheck) {
          checkAnswer();
        } else if (!spinning && !landedSubject) {
          startSpin();
        }
        return;
      }

      // Ctrl/Cmd + ArrowDown: Spin subject
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowDown') {
        e.preventDefault();
        if (!spinning) startSpin();
        return;
      }

      // Ctrl/Cmd + ArrowRight: Next verb
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
        e.preventDefault();
        if (!spinning) nextRound();
        return;
      }

      // Esc: clear input
      if (e.key === 'Escape') {
        if (isEditable) e.preventDefault();
        setAnswer('');
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isHovered, canCheck, spinning, landedSubject]);

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={"w-full p-4 sm:p-6 rounded-lg border border-gray-200 bg-white shadow-sm " + (className || '')}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-500">Verb</div>
        <div className="text-lg font-semibold">{currentVerb?.verb}</div>
        {currentVerb?.tense && (
          <div className="text-xs text-gray-400">{currentVerb.tense}</div>
        )}
      </div>

      {/* Sentence row: [ Subject Reel ] [ Answer Input ] */}
      <div className="mt-3 flex items-center gap-2 sm:gap-3 flex-nowrap">
        {/* Subject reel */}
        <div className="relative overflow-hidden rounded-md border bg-gray-50 h-14 w-28 sm:w-40 shrink-0">
          {/* Top/Bottom mask for slot feel */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/80 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white/80 to-transparent z-10" />
          <div
            ref={reelRef}
            className="will-change-transform"
            style={{ transform: `translateY(-${reelOffset}px)`, transition: spinning ? 'none' : 'transform 150ms ease-out' }}
          >
            {(reelItems.length > 0 ? reelItems : [displaySubject ?? '—']).map((s, i) => (
              <div key={i} className="h-14 flex items-center justify-center text-lg sm:text-2xl font-bold tracking-wide px-2 text-center truncate">{s}</div>
            ))}
          </div>
          {/* Center marker line */}
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 m-auto w-full h-0.5 bg-indigo-200/60" />
        </div>

        {/* Answer input inline to form a sentence */}
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={!landedSubject || spinning}
          placeholder={landedSubject ? `Type the form for "${landedSubject}"` : 'Spin to get a subject'}
          className="min-w-0 flex-1 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base sm:text-lg py-2"
          ref={inputRef}
        />
      </div>

      {/* Hint under the sentence row */}
      <div className="text-xs text-gray-500 mt-1">Exact match (case-insensitive, accent-insensitive)</div>

      {/* Compact toolbar */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startSpin}
            disabled={spinning}
            className={`px-3 py-1.5 rounded-md text-sm text-white ${spinning ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {spinning ? 'Spinning…' : 'Spin'}
          </button>
          <button
            type="button"
            onClick={nextRound}
            disabled={spinning}
            className={`px-3 py-1.5 rounded-md text-sm border ${spinning ? 'bg-white text-gray-400 border-gray-200' : 'bg-white hover:bg-gray-50'}`}
          >
            Next
          </button>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={checkAnswer}
            disabled={!canCheck || spinning}
            className={`px-3 py-1.5 rounded-md text-sm text-white ${canCheck && !spinning ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400'}`}
          >
            Check
          </button>
        </div>
      </div>

      {/* End toolbar */}

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

      {/* Keyboard Shortcuts Footer */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 bg-gray-50 hidden lg:block mt-4 rounded-md">
        <div className="flex flex-wrap items-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded font-mono font-medium">Enter</kbd>
            <span>Check answer</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded font-mono font-medium">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded font-mono font-medium">↓</kbd>
            <span>Spin subject</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded font-mono font-medium">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded font-mono font-medium">→</kbd>
            <span>Next verb</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded font-mono font-medium">Esc</kbd>
            <span>Clear input</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default VerbConjugationSlot;
