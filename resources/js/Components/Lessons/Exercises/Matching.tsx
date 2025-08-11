import React, { useEffect, useMemo, useState } from "react";

export type MatchingPair = {
    left: string;
    right: string;
};

export type MatchingResult = {
    correct: number;
    total: number;
    mistakes: number;
    timeMs: number;
    matches: Array<{ left: string; right: string; correct: boolean }>;
};

export interface MatchingProps {
    pairs: MatchingPair[];
    shuffle?: boolean;
    title?: string;
    instructions?: string;
    onComplete?: (result: MatchingResult) => void;
    className?: string;
}

function shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const Matching: React.FC<MatchingProps> = ({
    pairs,
    shuffle = true,
    title = "Match the pairs",
    instructions = "Select one item from the left, then its match on the right.",
    onComplete,
    className = "",
}) => {
    // Assign stable IDs based on original index so correctness is easy to compute
    type Item = { id: number; text: string };

    const baseLeft: Item[] = useMemo(
        () => pairs.map((p, i) => ({ id: i, text: p.left })),
        [pairs]
    );
    const baseRight: Item[] = useMemo(
        () => pairs.map((p, i) => ({ id: i, text: p.right })),
        [pairs]
    );

    const [leftItems, setLeftItems] = useState<Item[]>([]);
    const [rightItems, setRightItems] = useState<Item[]>([]);

    const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
    const [selectedRight, setSelectedRight] = useState<number | null>(null);

    const [matches, setMatches] = useState<Map<number, { rightId: number; correct: boolean }>>(new Map());
    const [usedLeft, setUsedLeft] = useState<Set<number>>(new Set());
    const [usedRight, setUsedRight] = useState<Set<number>>(new Set());

    const [mistakes, setMistakes] = useState(0);
    const [startTime, setStartTime] = useState<number>(Date.now());

    // Initialize or reset when pairs/shuffle change
    useEffect(() => {
        const l = shuffle ? shuffleArray(baseLeft) : baseLeft;
        const r = shuffle ? shuffleArray(baseRight) : baseRight;
        setLeftItems(l);
        setRightItems(r);
        setSelectedLeft(null);
        setSelectedRight(null);
        setMatches(new Map());
        setUsedLeft(new Set());
        setUsedRight(new Set());
        setMistakes(0);
        setStartTime(Date.now());
    }, [baseLeft, baseRight, shuffle]);

    const total = pairs.length;
    const completed = matches.size === total;
    const correctCount = Array.from(matches.values()).filter((m) => m.correct).length;

    useEffect(() => {
        if (completed && onComplete) {
            const timeMs = Date.now() - startTime;
            const result: MatchingResult = {
                correct: correctCount,
                total,
                mistakes,
                timeMs,
                matches: Array.from(matches.entries()).map(([leftId, m]) => ({
                    left: baseLeft.find((i) => i.id === leftId)?.text || "",
                    right: baseRight.find((i) => i.id === m.rightId)?.text || "",
                    correct: m.correct,
                })),
            };
            onComplete(result);
        }
    }, [completed]);

    const finalizePair = (lId: number, rId: number) => {
        if (usedLeft.has(lId) || usedRight.has(rId) || matches.has(lId)) {
            // Already matched/used, ignore
            setSelectedLeft(null);
            setSelectedRight(null);
            return;
        }
        const correct = lId === rId; // IDs align when it's the true pair
        setMatches((prev) => new Map(prev).set(lId, { rightId: rId, correct }));
        setUsedLeft((prev) => new Set(prev).add(lId));
        setUsedRight((prev) => new Set(prev).add(rId));
        if (!correct) setMistakes((m) => m + 1);
        setSelectedLeft(null);
        setSelectedRight(null);
    };

    const handleSelectLeft = (id: number) => {
        if (usedLeft.has(id)) return;
        if (selectedRight !== null) {
            finalizePair(id, selectedRight);
        } else {
            setSelectedLeft(id);
        }
    };

    const handleSelectRight = (id: number) => {
        if (usedRight.has(id)) return;
        if (selectedLeft !== null) {
            finalizePair(selectedLeft, id);
        } else {
            setSelectedRight(id);
        }
    };

    const reset = () => {
        const l = shuffle ? shuffleArray(baseLeft) : baseLeft;
        const r = shuffle ? shuffleArray(baseRight) : baseRight;
        setLeftItems(l);
        setRightItems(r);
        setSelectedLeft(null);
        setSelectedRight(null);
        setMatches(new Map());
        setUsedLeft(new Set());
        setUsedRight(new Set());
        setMistakes(0);
        setStartTime(Date.now());
    };

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{instructions}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <span className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200">
                        Matched: {matches.size}/{total}
                    </span>
                    <span className="px-2 py-1 rounded bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200">
                        Correct: {correctCount}
                    </span>
                    <span className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-200">
                        Mistakes: {mistakes}
                    </span>
                    <button
                        onClick={reset}
                        className="ml-2 inline-flex items-center px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-100 transition"
                    >
                        Reset
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column */}
                <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">German</h4>
                    <div className="space-y-2">
                        {leftItems.map((item) => {
                            const isUsed = usedLeft.has(item.id);
                            const isSelected = selectedLeft === item.id;
                            const isCorrect = matches.get(item.id)?.correct;
                            return (
                                <button
                                    key={`L-${item.id}`}
                                    type="button"
                                    disabled={isUsed}
                                    onClick={() => handleSelectLeft(item.id)}
                                    className={`w-full text-left px-4 py-3 rounded-md border transition flex items-center justify-between
                                        ${isUsed
                                            ? "bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed"
                                            : isSelected
                                                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-400 text-blue-800 dark:text-blue-200"
                                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"}
                                    `}
                                >
                                    <span>{item.text}</span>
                                    {isUsed && (
                                        <span className={`ml-3 text-xs px-2 py-0.5 rounded-full border ${isCorrect ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700" : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-700"}`}>
                                            {isCorrect ? "✓" : "✗"}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right column */}
                <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">English</h4>
                    <div className="space-y-2">
                        {rightItems.map((item) => {
                            const isUsed = usedRight.has(item.id);
                            const isSelected = selectedRight === item.id;
                            const leftMatch = Array.from(matches.entries()).find(([, v]) => v.rightId === item.id);
                            const isCorrect = leftMatch?.[1].correct;
                            return (
                                <button
                                    key={`R-${item.id}`}
                                    type="button"
                                    disabled={isUsed}
                                    onClick={() => handleSelectRight(item.id)}
                                    className={`w-full text-left px-4 py-3 rounded-md border transition flex items-center justify-between
                                        ${isUsed
                                            ? "bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed"
                                            : isSelected
                                                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-400 text-blue-800 dark:text-blue-200"
                                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"}
                                    `}
                                >
                                    <span>{item.text}</span>
                                    {isUsed && (
                                        <span className={`ml-3 text-xs px-2 py-0.5 rounded-full border ${isCorrect ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700" : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-700"}`}>
                                            {isCorrect ? "✓" : "✗"}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {completed && (
                <div className="p-4 rounded-md border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200">
                    <div className="font-medium">Great job!</div>
                    <div className="text-sm">You matched all pairs. Score: {correctCount}/{total}. Mistakes: {mistakes}.</div>
                </div>
            )}
        </div>
    );
};

export default Matching;
