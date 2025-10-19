import { useState, useEffect, useRef, useMemo } from "react";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";

interface Prompt {
    id: number;
    mode: "article_gender" | "translation" | "verb_conjugation";
    word: string;
    options: string[];
    answerWindowMs?: number;
    deadlineMs?: number;
    correctAnswer?: string;
    tense?: string;
    person?: string;
    translation?: string;
    gender?: string;
}

interface PromptPanelProps {
    prompt: Prompt;
    difficulty: "easy" | "medium" | "hard";
    onAnswer: (answer: string, elapsedMs: number) => void;
    lastAnswer: any;
    myLastAnswer?: any;
    currentUserId: number;
    revealCorrect?: boolean;
}

const DIFFICULTY_TIMES = {
    easy: 10000,
    medium: 6000,
    hard: 4000,
};

export default function PromptPanel({
    prompt,
    difficulty,
    onAnswer,
    lastAnswer,
    myLastAnswer,
    currentUserId,
    revealCorrect,
}: PromptPanelProps) {
    const [timeLeft, setTimeLeft] = useState(
        Math.max(
            0,
            (prompt.deadlineMs ??
                Date.now() +
                    (prompt.answerWindowMs || DIFFICULTY_TIMES[difficulty])) -
                Date.now()
        )
    );
    const [startTime, setStartTime] = useState(Date.now());
    const [answered, setAnswered] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showCorrect, setShowCorrect] = useState<boolean>(false);
    const sentRef = useRef<boolean>(false);

    const totalTime = prompt.answerWindowMs || DIFFICULTY_TIMES[difficulty];
    const globallyLocked = !!(lastAnswer?.correct || myLastAnswer?.correct); // stop timer if anyone or I got it right
    const actorUserId = lastAnswer
        ? lastAnswer.userId ?? lastAnswer.user_id
        : null;
    // Prefer explicitly provided myLastAnswer for the local user's UI
    const myAnswer =
        myLastAnswer ??
        (lastAnswer && actorUserId === currentUserId ? lastAnswer : null);
    const myVerdict: true | false | null = myAnswer
        ? myAnswer.reason === "already_answered"
            ? null
            : myAnswer.correct
            ? true
            : false
        : null;

    // Compute once who the effective actor for the banner is (me -> prefer myLastAnswer)
    const feedback = useMemo(() => {
        if (!lastAnswer) return { isMe: false, effectiveAnswer: null as any };
        const actorUserId =
            (myLastAnswer?.userId ?? myLastAnswer?.user_id) ??
            (lastAnswer.userId ?? lastAnswer.user_id);
        const isMe = actorUserId === currentUserId;
        const effectiveAnswer = isMe && myLastAnswer ? myLastAnswer : lastAnswer;
        return { isMe, effectiveAnswer };
    }, [lastAnswer, myLastAnswer, currentUserId]);

    useEffect(() => {
        // Reset for new prompt; align remaining time to server deadline when provided
        const remaining = Math.max(
            0,
            (prompt.deadlineMs ?? Date.now() + totalTime) - Date.now()
        );
        setTimeLeft(remaining);
        setAnswered(false);
        setSelectedAnswer(null);
        setStartTime(Date.now()); // only used to compute elapsed for submit payload
        setShowCorrect(false);
        sentRef.current = false; // allow a new submission for the new prompt
    }, [prompt.id, totalTime, prompt.deadlineMs]);

    useEffect(() => {
        // Keep timer running even if local player has answered; stop only on global lock
        if (globallyLocked || revealCorrect) return;

        const interval = setInterval(() => {
            const remaining = Math.max(
                0,
                (prompt.deadlineMs ?? startTime + totalTime) - Date.now()
            );
            setTimeLeft(remaining);

            if (remaining === 0 && !globallyLocked) {
                // If no one got it right by deadline, reveal the correct answer.
                if (!answered) {
                    handleAnswer("timeout");
                }
                setShowCorrect(true);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [answered, startTime, totalTime, prompt.deadlineMs, globallyLocked]);

    const handleAnswer = (answer: string) => {
        if (answered || sentRef.current) return;

        setAnswered(true);
        sentRef.current = true; // hard guard to prevent multiple sends
        setSelectedAnswer(answer);
        const elapsedMs = Date.now() - startTime;
        onAnswer(answer, elapsedMs);
    };

    const progress = (timeLeft / totalTime) * 100;

    const winnerAnswer = lastAnswer?.correct ? lastAnswer.answer : null;
    const reveal = !!(revealCorrect || showCorrect);

    // Ensure verb conjugation options are unique (sometimes backend sends duplicates)
    const displayOptions = useMemo(() => {
        if (prompt.mode === "verb_conjugation") {
            return Array.from(new Set(prompt.options));
        }
        return prompt.options;
    }, [prompt.mode, prompt.options]);

    return (
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 mt-6 shadow-lg">
            {/* Timer bar */}
            <div className="mb-4">
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-100 ${
                            progress > 50
                                ? "bg-green-500"
                                : progress > 25
                                ? "bg-yellow-500"
                                : "bg-red-500"
                        }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="text-center text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {(timeLeft / 1000).toFixed(1)}s
                </div>
            </div>

            {/* Prompt */}
            <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                    {prompt.mode === "translation" && prompt.gender && (
                        <span className="px-3 py-1 text-base md:text-lg font-extrabold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {prompt.gender}
                        </span>
                    )}
                    <h2 className="text-4xl font-extrabold text-purple-700 dark:text-purple-300">
                        {prompt.word}
                    </h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {prompt.mode === "article_gender" &&
                        "Select the correct article"}
                    {prompt.mode === "translation" && "Select the translation"}
                    {prompt.mode === "verb_conjugation" && (
                        <>
                            Conjugate: {" "}
                            <span className="font-semibold">
                                {prompt.tense || "-"}
                            </span>{" "}
                            — {" "}
                            <span className="font-semibold">
                                {prompt.person || "-"}
                            </span>
                        </>
                    )}
                </p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {displayOptions.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleAnswer(option)}
                        disabled={answered || globallyLocked || reveal}
                        className={`
              px-6 py-4 rounded-lg font-bold text-lg transition-all transform
              ${(() => {
                  if (answered || globallyLocked || reveal) {
                      if (selectedAnswer === option) {
                          if (myVerdict === true) return "bg-green-500 text-white scale-105";
                          if (myVerdict === false) return "bg-red-500 text-white scale-95";
                          return "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed";
                      }
                      // If someone else answered correctly, show their chosen correct option
                      if (globallyLocked && winnerAnswer && option === winnerAnswer) {
                          return "bg-green-500 text-white";
                      }
                      // If time expired and no one got it, reveal the correct option from the prompt
                      if (reveal && prompt.correctAnswer && option === prompt.correctAnswer) {
                          return "bg-green-500 text-white";
                      }
                      return "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed";
                  }
                  return "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white hover:scale-105 active:scale-95";
              })()}
              disabled:opacity-50
            `}
                    >
                        {option}
                    </button>
                ))}
            </div>

            {/* Feedback */}
            {(lastAnswer || reveal) && (
                <div
                    className={`mt-4 p-4 rounded-lg flex items-center justify-center gap-2 ${
                        (feedback.effectiveAnswer?.correct || reveal)
                            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                            : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                    }`}
                >
                    {reveal ? (
                        <>
                            <AiOutlineCheckCircle className="w-6 h-6" />
                            <span className="font-bold">
                                Correct answer: {prompt.correctAnswer}
                            </span>
                        </>
                    ) : feedback.effectiveAnswer?.correct ? (
                        <>
                            <AiOutlineCheckCircle className="w-6 h-6" />
                            <span className="font-bold">
                                {feedback.isMe
                                    ? "Correct!"
                                    : `${feedback.effectiveAnswer.player_name} got it!`}
                            </span>
                        </>
                    ) : (
                        <>
                            <AiOutlineCloseCircle className="w-6 h-6" />
                            <span className="font-bold">
                                {feedback.effectiveAnswer.answer === "timeout"
                                    ? "Time's up!"
                                    : feedback.isMe
                                    ? "Incorrect"
                                    : `${feedback.effectiveAnswer.player_name} missed it`}
                            </span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
