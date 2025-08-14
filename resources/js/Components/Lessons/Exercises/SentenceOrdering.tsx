import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiChevronLeft, FiChevronRight, FiRefreshCw, FiCheck, FiX } from "react-icons/fi";

export type SentenceOrderingItem = {
  target: string;
  tokens: string[];
  explanation?: string;
};

export type SentenceOrderingResult = {
  total: number;
  solved: number;
  mistakes: number; // number of incorrect checks (first-time per item)
  timeMs: number;
  details: Array<{
    itemIndex: number;
    correct: boolean;
    finalString: string;
    order: string[]; // arranged tokens in final state
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

// Produce a sentence string from tokens with simple punctuation rules
function joinTokens(tokens: string[]): string {
  let s = "";
  const punct = new Set([",", ".", "!", "?", ";", ":"]);
  tokens.forEach((tok) => {
    if (s.length === 0) {
      s = tok;
    } else if (punct.has(tok)) {
      s = s + tok;
    } else {
      // word-like token
      s = s + (s.endsWith("\n") ? "" : " ") + tok;
    }
  });
  return s;
}

// Represent each token with a stable id for duplicates handling
type TokenObj = { id: number; text: string };

interface SentenceOrderingProps {
  items: SentenceOrderingItem[];
  title?: string;
  instructions?: string;
  shuffleTokens?: boolean;
  onComplete?: (result: SentenceOrderingResult) => void;
  className?: string;
}

const SentenceOrdering: React.FC<SentenceOrderingProps> = ({
  items,
  title,
  instructions,
  shuffleTokens = true,
  onComplete,
  className,
}) => {
  const startTimeRef = useRef<number>(Date.now());

  const total = items.length;

  // Precompute token objects per item for stable ids
  const tokenObjs = useMemo(() => {
    return items.map((it) => it.tokens.map((t, idx) => ({ id: idx, text: t })));
  }, [items]);

  // Available order and arranged order per item (arrays of token ids)
  const [available, setAvailable] = useState<Record<number, number[]>>({});
  const [arranged, setArranged] = useState<Record<number, number[]>>({});
  // Whether item has been checked correct
  const [correctMap, setCorrectMap] = useState<Record<number, boolean>>({});
  // Track if we've counted a mistake for this item already (first incorrect check)
  const [mistakeCounted, setMistakeCounted] = useState<Record<number, boolean>>({});
  const [mistakes, setMistakes] = useState(0);
  const [current, setCurrent] = useState(0);

  // Using dnd-kit for drag-and-drop within the arranged zone

  useEffect(() => {
    const initAvail: Record<number, number[]> = {};
    const initArr: Record<number, number[]> = {};
    items.forEach((it, idx) => {
      const ids = tokenObjs[idx].map((o) => o.id);
      initAvail[idx] = shuffleTokens ? shuffleArray(ids) : ids;
      initArr[idx] = [];
    });
    setAvailable(initAvail);
    setArranged(initArr);
    setCorrectMap({});
    setMistakeCounted({});
    setMistakes(0);
    setCurrent(0);
    startTimeRef.current = Date.now();
  }, [items, shuffleTokens, tokenObjs]);

  const progress = useMemo(() => {
    const solved = Object.values(correctMap).filter(Boolean).length;
    return { solved, total };
  }, [correctMap, total]);

  useEffect(() => {
    if (progress.solved === total && total > 0 && onComplete) {
      const timeMs = Date.now() - startTimeRef.current;
      const details = items.map((_, idx) => {
        const orderIds = arranged[idx] || [];
        const orderTexts = orderIds.map((id) => tokenObjs[idx].find((o) => o.id === id)?.text || "");
        const finalString = joinTokens(orderTexts);
        return {
          itemIndex: idx,
          correct: !!correctMap[idx],
          finalString,
          order: orderTexts,
        };
      });
      onComplete({ total, solved: progress.solved, mistakes, timeMs, details });
    }
  }, [progress.solved, total]);

  if (!items || !items.length) {
    return (
      <div className={"text-gray-600 dark:text-gray-300 " + (className ?? "")}>No items available.</div>
    );
  }

  const addToken = (id: number) => {
    setAvailable((prev) => {
      const cur = prev[current] ? [...prev[current]] : [];
      const idx = cur.indexOf(id);
      if (idx >= 0) cur.splice(idx, 1);
      return { ...prev, [current]: cur };
    });
    setArranged((prev) => {
      const cur = prev[current] ? [...prev[current]] : [];
      cur.push(id);
      return { ...prev, [current]: cur };
    });
  };

  const removeToken = (id: number, fromIndex: number) => {
    setArranged((prev) => {
      const cur = prev[current] ? [...prev[current]] : [];
      cur.splice(fromIndex, 1);
      return { ...prev, [current]: cur };
    });
    setAvailable((prev) => {
      const cur = prev[current] ? [...prev[current]] : [];
      cur.push(id);
      return { ...prev, [current]: cur };
    });
  };

  // (left/right move handlers removed in favor of drag-and-drop)

  // (native HTML5 drag handlers removed; dnd-kit handles reordering)

  const resetTokens = () => {
    setArranged((prev) => ({ ...prev, [current]: [] }));
    setAvailable((prev) => {
      const ids = tokenObjs[current].map((o) => o.id);
      return { ...prev, [current]: shuffleTokens ? shuffleArray(ids) : ids };
    });
    setCorrectMap((prev) => ({ ...prev, [current]: false }));
  };

  const check = () => {
    const orderIds = arranged[current] || [];
    const orderTexts = orderIds.map((id) => tokenObjs[current].find((o) => o.id === id)?.text || "");
    const finalStr = joinTokens(orderTexts);
    const isCorrect = finalStr === items[current].target;

    if (!isCorrect && !mistakeCounted[current]) {
      setMistakeCounted((m) => ({ ...m, [current]: true }));
      setMistakes((m) => m + 1);
    }

    setCorrectMap((prev) => ({ ...prev, [current]: isCorrect }));
  };

  const goPrev = () => setCurrent((i) => Math.max(0, i - 1));
  const goNext = () => setCurrent((i) => Math.min(total - 1, i + 1));

  const isLast = current === total - 1;
  const curAvail = available[current] || [];
  const curArr = arranged[current] || [];

  const correctThis = !!correctMap[current];
  const item = items[current];

  // dnd-kit sensors: enable mouse + touch + keyboard dragging
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // no options needed for mouse
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sortable token component for arranged tokens
  const SortableToken: React.FC<{ id: number; text: string; onRemove: () => void }> = ({ id, text, onRemove }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.7 : 1,
    };
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="inline-flex items-center gap-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 shadow-sm cursor-grab touch-none"
        {...attributes}
        {...listeners}
      >
        <span className="select-none text-gray-900 dark:text-gray-100">{text}</span>
        <button
          type="button"
          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
          onClick={onRemove}
          title="Remove"
        >
          <FiX />
        </button>
      </div>
    );
  };

  const handleDndEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setArranged((prev) => {
      const cur = prev[current] ? [...prev[current]] : [];
      const oldIndex = cur.indexOf(active.id as number);
      const newIndex = cur.indexOf(over.id as number);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const reordered = arrayMove(cur, oldIndex, newIndex);
      return { ...prev, [current]: reordered };
    });
  };

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
            Item {current + 1} of {total}
          </span>
          <span>
            Solved: {progress.solved}/{total}
          </span>
        </div>
        <div className="mt-2 h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-2 bg-green-500"
            style={{ width: `${(progress.solved / Math.max(total, 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className={"rounded-lg border p-4 " + (correctThis ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-gray-200 dark:border-gray-700") }>
        {/* Arranged area */}
        <div className="text-sm text-gray-600 dark:text-gray-400">Arrange tokens to form a sentence:</div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDndEnd}>
          <SortableContext items={curArr} strategy={rectSortingStrategy}>
            <div className="mt-2 min-h-[56px] rounded-md border border-dashed border-gray-300 dark:border-gray-700 p-2 flex flex-wrap gap-2 bg-white/50 dark:bg-gray-800/40">
              {curArr.length === 0 && (
                <span className="text-gray-400 text-sm">Click tokens below to add them here</span>
              )}
              {curArr.map((id, idx) => {
                const tok = tokenObjs[current].find((o) => o.id === id)!;
                return (
                  <SortableToken
                    key={id}
                    id={id}
                    text={tok.text}
                    onRemove={() => removeToken(id, idx)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        {/* Available tokens */}
        <div className="mt-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Available tokens</div>
          <div className="flex flex-wrap gap-2">
            {curAvail.map((id) => {
              const tok = tokenObjs[current].find((o) => o.id === id)!;
              return (
                <button
                  key={id}
                  type="button"
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 shadow-sm hover:shadow"
                  onClick={() => addToken(id)}
                >
                  {tok.text}
                </button>
              );
            })}
            {curAvail.length === 0 && (
              <span className="text-gray-400 text-sm">No more tokens</span>
            )}
          </div>
        </div>

        {/* Feedback */}
        {correctThis && (
          <div className="mt-4 inline-flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
            <FiCheck /> Correct!
          </div>
        )}

        {correctThis && item.explanation && (
          <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Explanation:</span> {item.explanation}
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
              onClick={resetTokens}
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

export default SentenceOrdering;
