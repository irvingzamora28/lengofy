import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiRefreshCw, FiHelpCircle } from "react-icons/fi";

export type FIBBlank = {
  // Support either a single answer or multiple acceptable answers
  answer?: string;
  answers?: string[];
};

export type FIBSentence = {
  text: string; // contains one or more '____' tokens
  blanks: FIBBlank[]; // number of items should match number of tokens in text
  hint?: string;
  explanation?: string;
};

export type FIBResult = {
  totalSentences: number;
  totalBlanks: number;
  correctBlanks: number;
  mistakes: number; // number of blank-level first-attempt incorrect answers
  timeMs: number;
  sentenceDetails: Array<{
    sentenceIndex: number; // index in the shuffled order
    inputs: string[];
    correct: boolean[];
  }>;
};

function countTokens(text: string) {
  return (text.match(/____/g) || []).length;
}

function splitTokens(text: string) {
  return text.split("____");
}

function normalize(s: string, opts: { trim: boolean; caseSensitive: boolean }) {
  const trimmed = opts.trim ? s.trim() : s;
  return opts.caseSensitive ? trimmed : trimmed.toLowerCase();
}

interface FillInTheBlankProps {
  sentences: FIBSentence[];
  title?: string;
  instructions?: string;
  shuffleSentences?: boolean;
  caseSensitive?: boolean;
  trimWhitespace?: boolean;
  showExplanation?: boolean;
  onComplete?: (result: FIBResult) => void;
  className?: string;
}

const FillInTheBlank: React.FC<FillInTheBlankProps> = ({
  sentences,
  title,
  instructions,
  shuffleSentences = false,
  caseSensitive = false,
  trimWhitespace = true,
  showExplanation = true,
  onComplete,
  className,
}) => {
  const startTimeRef = useRef<number>(Date.now());
  // Root ref to scope global key handling to this component
  const rootRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  // Track pending timeouts to ensure cleanup on unmount
  const timeoutsRef = useRef<{ postCheckFocus?: number; autoAdvance?: number }>({});

  const totalSentences = sentences.length;
  const totalBlanks = useMemo(
    () => sentences.reduce((sum, s) => sum + (s.blanks?.length || 0), 0),
    [sentences]
  );

  // Order (by original indices)
  const [order, setOrder] = useState<number[]>([]);

  // Inputs per original sentence index
  const [inputs, setInputs] = useState<Record<number, string[]>>({});
  // Correctness per sentence (per blank)
  const [correctMap, setCorrectMap] = useState<Record<number, boolean[]>>({});
  // Track whether we've already counted mistakes for each blank (first check only)
  const [mistakeCounted, setMistakeCounted] = useState<Record<number, boolean[]>>({});
  const [mistakes, setMistakes] = useState(0);
  const [current, setCurrent] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);
  // Refs to inputs in the current sentence for focus management
  const inputRefs = useRef<HTMLInputElement[]>([]);
  // Track if last action was a check to enable auto-advance feedback
  const lastCheckedRef = useRef<{ at: number; sentenceIdx: number } | null>(null);
  // Simple touch detection to decide when to show desktop-only hints and shortcuts
  const isTouch = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    } catch {
      return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }
  }, []);

  useEffect(() => {
    const idxs = sentences.map((_, i) => i);
    const shuffled = shuffleSentences
      ? [...idxs].sort(() => Math.random() - 0.5)
      : idxs;
    setOrder(shuffled);

    // Initialize inputs and maps
    const initInputs: Record<number, string[]> = {};
    const initCorrect: Record<number, boolean[]> = {};
    const initMistake: Record<number, boolean[]> = {};
    sentences.forEach((s, i) => {
      const blanksCount = s.blanks?.length || countTokens(s.text);
      initInputs[i] = Array.from({ length: blanksCount }, () => "");
      initCorrect[i] = Array.from({ length: blanksCount }, () => false);
      initMistake[i] = Array.from({ length: blanksCount }, () => false);
    });
    setInputs(initInputs);
    setCorrectMap(initCorrect);
    setMistakeCounted(initMistake);
    setMistakes(0);
    setCurrent(0);
    startTimeRef.current = Date.now();
  }, [sentences, shuffleSentences]);

  // Derived progress
  const correctBlanks = useMemo(
    () => Object.values(correctMap).flat().filter(Boolean).length,
    [correctMap]
  );

  useEffect(() => {
    if (correctBlanks === totalBlanks && totalBlanks > 0 && onComplete) {
      const timeMs = Date.now() - startTimeRef.current;
      const sentenceDetails = order.map((origIdx, pos) => ({
        sentenceIndex: pos,
        inputs: inputs[origIdx] || [],
        correct: correctMap[origIdx] || [],
      }));
      onComplete({
        totalSentences,
        totalBlanks,
        correctBlanks,
        mistakes,
        timeMs,
        sentenceDetails,
      });
    }
  }, [correctBlanks, totalBlanks]);

  if (!sentences || !sentences.length) {
    return (
      <div className={"text-gray-600 dark:text-gray-300 " + (className ?? "")}>No sentences available.</div>
    );
  }

  const currentOrigIdx = order[current] ?? 0;
  const s = sentences[currentOrigIdx];
  const parts = splitTokens(s.text);
  const blanksCount = s.blanks?.length || countTokens(s.text);

  // Handle key events for inputs
  const handleInputKeyDown = (idx: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = inputs[currentOrigIdx]?.[idx] ?? "";
    // Enter: check current sentence
    if (e.key === "Enter") {
      e.preventDefault();
      check();
      return;
    }
    // Arrow navigation between blanks when at edges
    const target = e.currentTarget;
    const atStart = target.selectionStart === 0 && target.selectionEnd === 0;
    const atEnd = target.selectionStart === value.length && target.selectionEnd === value.length;
    if (e.key === "ArrowLeft" && atStart && idx > 0) {
      e.preventDefault();
      inputRefs.current[idx - 1]?.focus();
      return;
    }
    if (e.key === "ArrowRight" && atEnd && idx < blanksCount - 1) {
      // idx < (number of blanks - 1) to have a next blank
      e.preventDefault();
      inputRefs.current[idx + 1]?.focus();
      return;
    }
  };

  // Reset hint visibility when the sentence changes and focus the first editable blank
  useEffect(() => {
    setHintOpen(false);
    // Clear refs to avoid stale nodes
    inputRefs.current = [];
    // Focus first incorrect or empty blank on sentence load
    const raf = requestAnimationFrame(() => {
      const blanks = (correctMap[currentOrigIdx] || []).length;
      let targetIdx = 0;
      for (let i = 0; i < blanks; i++) {
        if (!(correctMap[currentOrigIdx]?.[i])) {
          targetIdx = i;
          break;
        }
      }
      inputRefs.current[targetIdx]?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [currentOrigIdx]);

  // Ensure autofocus on initial mount as well
  useEffect(() => {
    const t = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Global-but-scoped keyboard shortcuts (work without input focus)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const handler = (e: KeyboardEvent) => {
      // Only act if event target is within this component or the component is hovered
      const target = e.target as HTMLElement | null;
      const within = !!(rootRef.current && target && rootRef.current.contains(target));
      if (!within && !isHovered) return;

      // Note: debug logs removed after diagnosing key handling

      // Do not hijack typing when target is an editable field outside our inputs
      const tag = (target?.tagName || "").toLowerCase();
      const isEditable =
        tag === "input" ||
        tag === "textarea" ||
        (target && (target as HTMLElement).isContentEditable);

      // Sentence navigation: Ctrl/Cmd + ArrowLeft/ArrowRight (desktop only)
      if (!isTouch && (e.ctrlKey || e.metaKey) && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        e.preventDefault();
        if (e.key === "ArrowRight") {
          if (current < totalSentences - 1) goNext();
        } else {
          if (current > 0) goPrev();
        }
        return;
      }

      // Toggle hint: Ctrl/Cmd + / (or ?). Allow even when input is focused.
      if ((e.ctrlKey || e.metaKey) && (e.key === "/" || e.key === "?" || e.code === "Slash")) {
        if (sentences[currentOrigIdx]?.hint) {
          e.preventDefault();
          setHintOpen((v) => !v);
        }
        return;
      }

      // Escape toggles hint if available
      if (e.key === "Escape" && sentences[currentOrigIdx]?.hint) {
        e.preventDefault();
        setHintOpen((v) => !v);
        return;
      }

      // Do not implement Arrow blank-jumping or Enter here; those stay input-scoped
      if (isEditable) return;
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [current, totalSentences, isTouch, isHovered, currentOrigIdx, sentences]);

  // Cleanup any remaining timers on unmount
  useEffect(() => {
    return () => {
      if (timeoutsRef.current.postCheckFocus) clearTimeout(timeoutsRef.current.postCheckFocus);
      if (timeoutsRef.current.autoAdvance) clearTimeout(timeoutsRef.current.autoAdvance);
    };
  }, []);

  const onInputChange = (blankIdx: number, value: string) => {
    setInputs((prev) => {
      const prevArr = prev[currentOrigIdx] ? [...prev[currentOrigIdx]] : [];
      prevArr[blankIdx] = value;
      return { ...prev, [currentOrigIdx]: prevArr };
    });
  };

  const check = () => {
    // Build list of acceptable answers per blank (combine answers[] and answer)
    const acceptable: string[][] = (s.blanks?.map((b) => {
      const arr: string[] = [];
      if (Array.isArray(b.answers)) arr.push(...b.answers);
      if (typeof b.answer === "string") arr.push(b.answer);
      return arr;
    }) || []);

    const userInputs = inputs[currentOrigIdx] || [];
    const newCorrect = acceptable.map((candidates, i) => {
      const normInp = normalize(userInputs[i] ?? "", { trim: trimWhitespace, caseSensitive });
      return candidates.some((ans) => normalize(ans, { trim: true, caseSensitive }) === normInp);
    });

    // Count mistakes only on first check per blank when incorrect
    setMistakeCounted((prev) => {
      const prevFlags = prev[currentOrigIdx] ? [...prev[currentOrigIdx]] : Array.from({ length: newCorrect.length }, () => false);
      let add = 0;
      newCorrect.forEach((isOk, idx) => {
        if (!isOk && !prevFlags[idx]) {
          prevFlags[idx] = true;
          add += 1;
        }
      });
      if (add > 0) setMistakes((m) => m + add);
      return { ...prev, [currentOrigIdx]: prevFlags };
    });

    setCorrectMap((prev) => ({ ...prev, [currentOrigIdx]: newCorrect }));

    // Focus first incorrect blank after checking
    const firstIncorrect = newCorrect.findIndex((v) => !v);
    if (firstIncorrect !== -1) {
      if (timeoutsRef.current.postCheckFocus) clearTimeout(timeoutsRef.current.postCheckFocus);
      timeoutsRef.current.postCheckFocus = window.setTimeout(() => {
        inputRefs.current[firstIncorrect]?.focus();
      }, 0);
    } else {
      // All correct -> optionally auto-advance to next sentence
      lastCheckedRef.current = { at: Date.now(), sentenceIdx: current };
      if (!isLast) {
        if (timeoutsRef.current.autoAdvance) clearTimeout(timeoutsRef.current.autoAdvance);
        timeoutsRef.current.autoAdvance = window.setTimeout(() => {
          // Ensure we haven't navigated away and still on same sentence
          if (lastCheckedRef.current && lastCheckedRef.current.sentenceIdx === current) {
            goNext();
          }
        }, 500);
      }
    }
  };

  const reset = () => {
    const idxs = sentences.map((_, i) => i);
    const shuffled = shuffleSentences
      ? [...idxs].sort(() => Math.random() - 0.5)
      : idxs;
    setOrder(shuffled);

    const initInputs: Record<number, string[]> = {};
    const initCorrect: Record<number, boolean[]> = {};
    const initMistake: Record<number, boolean[]> = {};
    sentences.forEach((s, i) => {
      const blanksCount = s.blanks?.length || countTokens(s.text);
      initInputs[i] = Array.from({ length: blanksCount }, () => "");
      initCorrect[i] = Array.from({ length: blanksCount }, () => false);
      initMistake[i] = Array.from({ length: blanksCount }, () => false);
    });
    setInputs(initInputs);
    setCorrectMap(initCorrect);
    setMistakeCounted(initMistake);
    setMistakes(0);
    setCurrent(0);
    startTimeRef.current = Date.now();
  };

  const goPrev = () => setCurrent((i) => Math.max(0, i - 1));
  const goNext = () => setCurrent((i) => Math.min(totalSentences - 1, i + 1));
  const isLast = current === totalSentences - 1;

  const thisCorrect = correctMap[currentOrigIdx] || [];
  const allCorrectThis = thisCorrect.length > 0 && thisCorrect.every(Boolean);

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={"space-y-4 " + (className ?? "")}
    >
      {(title || instructions) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          )}
          {instructions && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{instructions}</p>
          )}
        </div>
      )}

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Sentence {current + 1} of {totalSentences}
          </span>
          <span>
            Correct blanks: {correctBlanks}/{totalBlanks}
          </span>
        </div>
        <div className="mt-2 h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-2 bg-green-500"
            style={{ width: `${(correctBlanks / Math.max(totalBlanks, 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-base font-medium text-gray-900 dark:text-gray-100">
          {/* Render sentence with input boxes */}
          <span className="flex flex-wrap items-center gap-2">
            {parts.map((part, idx) => (
              <React.Fragment key={idx}>
                <span>{part}</span>
                {idx < parts.length - 1 && (
                  <input
                    type="text"
                    ref={(el) => {
                      if (el) inputRefs.current[idx] = el;
                    }}
                    value={inputs[currentOrigIdx]?.[idx] ?? ""}
                    onChange={(e) => onInputChange(idx, e.target.value)}
                    onKeyDown={handleInputKeyDown(idx)}
                    className={
                      "w-28 sm:w-36 md:w-44 rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 " +
                      (thisCorrect[idx]
                        ? "border-green-500 focus:ring-green-400"
                        : thisCorrect[idx] === false && (inputs[currentOrigIdx]?.[idx] ?? "").length > 0
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 dark:border-gray-700 focus:ring-primary-500")
                    }
                    placeholder="____"
                  />
                )}
              </React.Fragment>
            ))}
          </span>
        </div>

        {/* Hint (always reserve space to avoid layout shifts; hide content when not available) */}
        <div className="mt-3">
          <div className="flex items-center justify-between min-h-[24px]">
            <span className={(s.hint ? "" : "invisible ") + "text-xs text-gray-500 dark:text-gray-400"}>Need a hint?</span>
            <button
              type="button"
              className={(s.hint ? "inline-flex" : "invisible inline-flex") + " items-center p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"}
              title={!isTouch ? "Show/Hide hint (Ctrl+/)" : "Show/Hide hint"}
              aria-label="Toggle hint"
              aria-disabled={!s.hint}
              onClick={() => s.hint && setHintOpen((v) => !v)}
              disabled={!s.hint}
            >
              <FiHelpCircle className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 min-h-[20px] text-sm text-gray-600 dark:text-gray-400">
            {s.hint && hintOpen && (
              <div>
                <span className="font-medium">Hint:</span> {s.hint}
              </div>
            )}
          </div>
        </div>

        {/* Reserve space for explanation to avoid layout shift when it appears */}
        <div className="mt-4 min-h-[24px] text-sm text-gray-700 dark:text-gray-300">
          {showExplanation && allCorrectThis && s.explanation && (
            <div>
              <span className="font-medium">Explanation:</span> {s.explanation}
            </div>
          )}
        </div>

        {/* Controls - 3 column grid to prevent layout shifts */}
        <div className="mt-6 grid grid-cols-3 items-center gap-2">
          <div className="justify-self-start">
            <button
              type="button"
              className={(current > 0 ? "opacity-100" : "opacity-0 pointer-events-none") + " inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}
              onClick={goPrev}
            >
              <FiChevronLeft /> Prev
            </button>
          </div>

          <div className="justify-self-center flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={reset}
            >
              <FiRefreshCw /> Reset
            </button>
            <button
              type="button"
              title="Enter"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={check}
            >
              Check
            </button>
          </div>

          <div className="justify-self-end">
            <button
              type="button"
              className={(isLast ? "opacity-0 pointer-events-none" : "opacity-100") + " inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}
              onClick={goNext}
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>

        {/* Desktop-only shortcuts hint */}
        {!isTouch && (
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-800/50">Enter</span>
              <span>Check</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-800/50">Ctrl</span>
              <span>+</span>
              <span className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-800/50">→</span>
              <span>Next sentence</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-800/50">Ctrl</span>
              <span>+</span>
              <span className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-800/50">←</span>
              <span>Previous sentence</span>
            </span>
            {s.hint && (
              <span className="inline-flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-800/50">Ctrl</span>
                <span>+</span>
                <span className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-800/50">/</span>
                <span>Toggle hint</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FillInTheBlank;
