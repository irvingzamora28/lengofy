import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, HelpCircle, Check } from "lucide-react";

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
  // Optional list of special characters to help typing in the target language
  specialCharacters?: string[];
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
  specialCharacters = [],
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
  // Track which blank input is focused to insert special characters at caret
  const [focusedBlankIdx, setFocusedBlankIdx] = useState<number | null>(null);
  // Track if last action was a check to enable auto-advance feedback
  const lastCheckedRef = useRef<{ at: number; sentenceIdx: number } | null>(null);

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
      <div className={"flex items-center justify-center py-12 " + (className ?? "")}>
        <div className="text-center space-y-2">
          <div className="text-gray-400 dark:text-gray-500 text-lg">📝</div>
          <p className="text-gray-600 dark:text-gray-400">No sentences available</p>
        </div>
      </div>
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
    // Focus first incorrect or empty blank on sentence load. Retry until refs exist.
    let cancelled = false;
    const tryFocus = () => {
      if (cancelled) return;
      const blanks = blanksCount; // use current sentence blanks count
      let targetIdx = 0;
      for (let i = 0; i < blanks; i++) {
        if (!(correctMap[currentOrigIdx]?.[i])) {
          targetIdx = i;
          break;
        }
      }
      const el = inputRefs.current[targetIdx];
      if (el) {
        el.focus();
      } else {
        // Wait for the inputs to mount and refs to populate
        requestAnimationFrame(tryFocus);
      }
    };
    requestAnimationFrame(tryFocus);
    return () => {
      cancelled = true;
    };
  }, [currentOrigIdx, blanksCount, correctMap]);

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

      // Do not hijack typing when target is an editable field outside our inputs
      const tag = (target?.tagName || "").toLowerCase();
      const isEditable =
        tag === "input" ||
        tag === "textarea" ||
        (target && (target as HTMLElement).isContentEditable);

      // Sentence navigation: Ctrl/Cmd + ArrowLeft/ArrowRight
      if ((e.ctrlKey || e.metaKey) && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
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
  }, [current, totalSentences, isHovered, currentOrigIdx, sentences]);

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

  // Insert a character into the currently focused input at caret position
  const insertChar = (ch: string) => {
    if (focusedBlankIdx == null) return;
    const idx = focusedBlankIdx;
    const input = inputRefs.current[idx];
    const currentVal = inputs[currentOrigIdx]?.[idx] ?? "";
    if (!input) {
      // Fallback: append at end
      onInputChange(idx, currentVal + ch);
      return;
    }
    const start = input.selectionStart ?? currentVal.length;
    const end = input.selectionEnd ?? currentVal.length;
    const next = currentVal.slice(0, start) + ch + currentVal.slice(end);
    onInputChange(idx, next);
    // Restore caret just after inserted char on next frame
    requestAnimationFrame(() => {
      input.focus();
      const pos = start + ch.length;
      try {
        input.setSelectionRange(pos, pos);
      } catch {}
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

  const progressPercentage = (correctBlanks / Math.max(totalBlanks, 1)) * 100;

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={"" + (className ?? "")}
    >
      <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        {/* Header Section */}
        {(title || instructions) && (
          <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div className="space-y-3">
              {title && (
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                  {title}
                </h2>
              )}
              {instructions && (
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  {instructions}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Progress Section */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-4 sm:gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Progress:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {current + 1} / {totalSentences}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Completed:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {correctBlanks} / {totalBlanks}
                </span>
              </div>
            </div>
            <div className="w-full sm:w-48">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 dark:bg-gray-100 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 py-4">
          {/* Sentence with Inputs */}
          <div className="mb-6 sm:mb-8">
            <div className="text-base sm:text-lg leading-relaxed font-medium text-gray-900 dark:text-gray-100">
              <div className="flex flex-wrap items-center gap-2">
                {parts.map((part, idx) => (
                  <React.Fragment key={idx}>
                    <span className="whitespace-pre-wrap">{part}</span>
                    {idx < parts.length - 1 && (
                      <input
                        type="text"
                        ref={(el) => {
                          if (el) inputRefs.current[idx] = el;
                        }}
                        value={inputs[currentOrigIdx]?.[idx] ?? ""}
                        onChange={(e) => onInputChange(idx, e.target.value)}
                        onKeyDown={handleInputKeyDown(idx)}
                        onFocus={() => setFocusedBlankIdx(idx)}
                        onClick={() => setFocusedBlankIdx(idx)}
                        className={
                          "inline-block min-w-0 w-28 sm:w-32 md:w-40 lg:w-48 px-2 sm:px-3 py-2 sm:py-2.5 text-sm sm:text-base font-medium rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-20 " +
                          (thisCorrect[idx]
                            ? "border-green-600 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200 focus:ring-green-500"
                            : thisCorrect[idx] === false && (inputs[currentOrigIdx]?.[idx] ?? "").length > 0
                            ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 focus:ring-red-500"
                            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 focus:border-gray-900 dark:focus:border-gray-100 focus:ring-gray-900 dark:focus:ring-gray-100")
                        }
                        placeholder="____"
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Special Characters Toolbar */}
          {specialCharacters.length > 0 && (
            <div className="mb-3 sm:mb-4">
              <div className="flex flex-wrap items-center gap-2">
                {specialCharacters.map((ch, i) => (
                  <button
                    key={`${ch}-${i}`}
                    type="button"
                    className="px-2.5 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                    onClick={() => insertChar(ch)}
                    title={`Insert ${ch}`}
                    aria-label={`Insert character ${ch}`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hint Section - Fixed height to prevent layout shifts */}
          <div className="mb-2 sm:mb-3 h-16 sm:h-16 overflow-hidden">
            <div className="flex items-center justify-between h-6">
              <div className="flex items-center gap-2 min-w-0">
                {s.hint ? (
                  <>
                    <span className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400">Hint</span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] sm:text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors duration-150"
                      title="Show/Hide hint (Ctrl+/)"
                      aria-label="Toggle hint"
                      onClick={() => setHintOpen((v) => !v)}
                    >
                      <HelpCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span className="hidden sm:inline">Toggle</span>
                    </button>
                  </>
                ) : (
                  <div className="h-[32px]"></div>
                )}
              </div>
            </div>
            {s.hint && (
              <div className="mt-1 h-10 sm:h-10">
                {hintOpen ? (
                  <div className="h-full flex items-start gap-2 px-2 py-1.5 bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-400 dark:border-amber-600 rounded-r">
                    <span className="select-none">💡</span>
                    <p className="text-sm leading-tight text-amber-800 dark:text-amber-200 whitespace-normal break-words line-clamp-2">
                      {s.hint}
                    </p>
                  </div>
                ) : (
                  <div className="h-full" />
                )}
              </div>
            )}
          </div>

          {/* Explanation Section - Fixed height to prevent layout shifts */}
          <div className="mb-2 sm:mb-3 h-14 sm:h-16 overflow-hidden">
            {showExplanation && s.explanation && (
              <div className="h-full">
                {allCorrectThis ? (
                  <div className="h-full flex items-start gap-2 px-2 py-1.5 sm:py-2 bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 dark:border-blue-400 rounded-r">
                    <div className="text-blue-600 dark:text-blue-400 text-sm">✓</div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 leading-tight whitespace-normal break-words line-clamp-2">
                      {s.explanation}
                    </p>
                  </div>
                ) : (
                  <div className="h-full" />
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-2 sm:gap-2.5">
            <button
              type="button"
              className={
                "inline-flex items-center gap-1.5 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md border transition-all duration-200 " +
                (current > 0
                  ? "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700"
                  : "text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 cursor-not-allowed")
              }
              onClick={goPrev}
              disabled={current === 0}
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700"
                onClick={reset}
              >
                <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600 shadow-sm"
                onClick={check}
              >
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Check Answers</span>
                <span className="sm:hidden">Check</span>
              </button>
            </div>

            <button
              type="button"
              className={
                "inline-flex items-center gap-1.5 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md border transition-all duration-200 " +
                (!isLast
                  ? "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700"
                  : "text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 cursor-not-allowed")
              }
              onClick={goNext}
              disabled={isLast}
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 hidden lg:block">
          <div className="flex flex-wrap items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded font-mono font-medium">
                Enter
              </kbd>
              <span>Check answers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded font-mono font-medium">
                Ctrl
              </kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded font-mono font-medium">
                →
              </kbd>
              <span>Next sentence</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded font-mono font-medium">
                Ctrl
              </kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded font-mono font-medium">
                ←
              </kbd>
              <span>Previous sentence</span>
            </div>
            {s.hint && (
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded font-mono font-medium">
                  Ctrl
                </kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded font-mono font-medium">
                  /
                </kbd>
                <span>Toggle hint</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
   );
};

export default FillInTheBlank;
