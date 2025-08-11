import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiX, FiChevronLeft, FiChevronRight, FiRefreshCw } from "react-icons/fi";

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

  // Reset hint visibility when the sentence changes
  useEffect(() => {
    setHintOpen(false);
  }, [currentOrigIdx]);

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
    <div className={"space-y-4 " + (className ?? "")}> 
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
                    value={inputs[currentOrigIdx]?.[idx] ?? ""}
                    onChange={(e) => onInputChange(idx, e.target.value)}
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

        {/* Hint */}
        {s.hint && !allCorrectThis && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            {!hintOpen ? (
              <button
                type="button"
                className="underline hover:no-underline"
                onClick={() => setHintOpen(true)}
              >
                Show hint
              </button>
            ) : (
              <div>
                <span className="font-medium">Hint:</span> {s.hint}
              </div>
            )}
          </div>
        )}

        {showExplanation && allCorrectThis && s.explanation && (
          <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Explanation:</span> {s.explanation}
          </div>
        )}

        {/* Controls */}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={goPrev}
            disabled={current === 0}
          >
            <FiChevronLeft /> Prev
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={reset}
            >
              <FiRefreshCw /> Reset
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={check}
            >
              Check
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={goNext}
              disabled={isLast}
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FillInTheBlank;
