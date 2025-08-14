import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiX, FiChevronLeft, FiChevronRight, FiRefreshCw } from "react-icons/fi";
import AutoAdvanceCountdown from "@/Components/Common/AutoAdvanceCountdown";

export type Choice = {
  text: string;
  correct: boolean;
};

export type MCQuestion = {
  prompt: string;
  choices: Choice[];
  explanation?: string;
};

export type MCResult = {
  total: number;
  answered: number;
  correct: number;
  mistakes: number; // number of first-attempt incorrect answers
  timeMs: number;
  details: Array<{
    questionIndex: number; // index in the shuffled order
    selectedIndex: number; // index within the displayed (possibly shuffled) choices
    correct: boolean;
  }>;
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface MultipleChoiceProps {
  questions: MCQuestion[];
  title?: string;
  instructions?: string;
  shuffleQuestions?: boolean;
  shuffleChoices?: boolean;
  showExplanation?: boolean;
  onComplete?: (result: MCResult) => void;
  className?: string;
}

const MultipleChoice: React.FC<MultipleChoiceProps> = ({
  questions,
  title,
  instructions,
  shuffleQuestions = true,
  shuffleChoices = true,
  showExplanation = true,
  onComplete,
  className,
}) => {
  const startTimeRef = useRef<number>(Date.now());
  // Auto-advance: external reusable component
  const [autoActive, setAutoActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Prepare question order
  const [questionOrder, setQuestionOrder] = useState<number[]>([]);
  const [choiceOrders, setChoiceOrders] = useState<Record<number, number[]>>({});

  // State per session
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<number, number | null>>({});
  const [correctMap, setCorrectMap] = useState<Record<number, boolean>>({});
  const [mistakes, setMistakes] = useState(0);

  const total = questions.length;

  // Initialize orders when questions change
  useEffect(() => {
    const qOrder = shuffleQuestions ? shuffleArray(questions.map((_, i) => i)) : questions.map((_, i) => i);
    const cOrders: Record<number, number[]> = {};
    qOrder.forEach((qIdx) => {
      const indices = questions[qIdx]?.choices?.map((_, i) => i) || [];
      cOrders[qIdx] = shuffleChoices ? shuffleArray(indices) : indices;
    });
    setQuestionOrder(qOrder);
    setChoiceOrders(cOrders);
    setCurrent(0);
    setSelected({});
    setCorrectMap({});
    setMistakes(0);
    startTimeRef.current = Date.now();
    // stop any pending auto-advance
    setAutoActive(false);
  }, [questions, shuffleQuestions, shuffleChoices]);

  const progress = useMemo(() => {
    const answered = Object.keys(selected).filter((k) => selected[Number(k)] !== null).length;
    const correct = Object.values(correctMap).filter(Boolean).length;
    return { answered, correct, total };
  }, [selected, correctMap, total]);

  useEffect(() => {
    if (progress.answered === total && total > 0 && onComplete) {
      const timeMs = Date.now() - startTimeRef.current;
      const details = Object.entries(selected).map(([qIdxStr, sel]) => {
        const qIdx = Number(qIdxStr);
        return {
          questionIndex: questionOrder.indexOf(qIdx),
          selectedIndex: (sel ?? -1) as number,
          correct: !!correctMap[qIdx],
        };
      });
      onComplete({
        total,
        answered: progress.answered,
        correct: progress.correct,
        mistakes,
        timeMs,
        details,
      });
    }
  }, [progress.answered, total]);

  if (!questions || !questions.length) {
    return (
      <div className={"text-gray-600 dark:text-gray-300 " + (className ?? "")}>No questions available.</div>
    );
  }

  const currentQIndex = questionOrder[current] ?? 0;
  const q = questions[currentQIndex];
  const cOrder = choiceOrders[currentQIndex] || [];
  

  const handleSelect = (displayedChoiceIdx: number) => {
    // Prevent changing answer once selected for clean scoring
    if (selected[currentQIndex] !== undefined && selected[currentQIndex] !== null) return;

    const actualChoiceIdx = cOrder[displayedChoiceIdx];
    const choice = q.choices[actualChoiceIdx];

    setSelected((prev) => ({ ...prev, [currentQIndex]: displayedChoiceIdx }));
    const isCorrect = !!choice?.correct;
    setCorrectMap((prev) => ({ ...prev, [currentQIndex]: isCorrect }));
    if (!isCorrect) setMistakes((m) => m + 1);
    // Start auto-advance if not last question
    if (current < total - 1) setAutoActive(true);
  };

  const goPrev = () => {
    setAutoActive(false);
    setCurrent((i) => Math.max(0, i - 1));
  };
  const goNext = () => {
    setAutoActive(false);
    setCurrent((i) => Math.min(total - 1, i + 1));
  };

  const reset = () => {
    // Re-initialize by toggling dependencies (questions refs remain the same)
    const qOrder = shuffleQuestions ? shuffleArray(questions.map((_, i) => i)) : questions.map((_, i) => i);
    const cOrders: Record<number, number[]> = {};
    qOrder.forEach((qIdx) => {
      const indices = questions[qIdx]?.choices?.map((_, i) => i) || [];
      cOrders[qIdx] = shuffleChoices ? shuffleArray(indices) : indices;
    });
    setQuestionOrder(qOrder);
    setChoiceOrders(cOrders);
    setCurrent(0);
    setSelected({});
    setCorrectMap({});
    setMistakes(0);
    startTimeRef.current = Date.now();
    setAutoActive(false);
  };

  const answeredThis = selected[currentQIndex] !== undefined && selected[currentQIndex] !== null;
  const isLast = current === total - 1;

  return (
    <div
      className={"space-y-4 " + (className ?? "")}
      ref={containerRef}
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
            Question {current + 1} of {total}
          </span>
          <span>
            Correct: {progress.correct}/{total}
          </span>
        </div>
        <div className="mt-2 h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-2 bg-green-500"
            style={{ width: `${(progress.answered / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <AutoAdvanceCountdown
          seconds={3}
          active={autoActive}
          onFinish={() => {
            setAutoActive(false);
            goNext();
          }}
          onCancel={() => setAutoActive(false)}
          containerRef={containerRef as React.RefObject<HTMLElement>}
        />
        <div className="text-base font-medium text-gray-900 dark:text-gray-100">{q.prompt}</div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cOrder.map((choiceIdx, idx) => {
            const choice = q.choices[choiceIdx];
            const isSelected = selected[currentQIndex] === idx;
            const locked = selected[currentQIndex] !== undefined && selected[currentQIndex] !== null;
            const showCorrect = locked && choice.correct;
            const showWrong = locked && isSelected && !choice.correct;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(idx)}
                className={
                  "w-full text-left rounded-md border px-4 py-3 transition shadow-sm " +
                  (showCorrect
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : showWrong
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : isSelected
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:shadow")
                }
                disabled={locked}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-gray-100">{choice.text}</span>
                  {showCorrect && <FiCheck className="text-green-600" />}
                  {showWrong && <FiX className="text-red-600" />}
                </div>
              </button>
            );
          })}
        </div>

        {showExplanation && answeredThis && q.explanation && (
          <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Explanation:</span> {q.explanation}
          </div>
        )}

        {/* Nav */}
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

export default MultipleChoice;
