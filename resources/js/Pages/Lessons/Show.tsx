import { useEffect, useState } from "react";
import { Head, router, Link } from "@inertiajs/react";
import { PageProps } from "@/types";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import LessonViewer from "@/Components/Lessons/LessonViewer";
import LessonNavigation from "@/Components/Lessons/LessonNavigation";
import { parseFrontmatter } from "@/Utils/parseFrontmatter";
import { parseContent } from "@/Utils/parseContent";
import FlashcardVocabulary from "@/Components/Lessons/FlashcardVocabulary";
import { FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import Matching from "@/Components/Lessons/Exercises/Matching";
import MultipleChoice from "@/Components/Lessons/Exercises/MultipleChoice";
import FillInTheBlank from "@/Components/Lessons/Exercises/FillInTheBlank";
import SentenceOrdering from "@/Components/Lessons/Exercises/SentenceOrdering";

interface NavigationItem {
    title: string;
    lesson_number: number;
}

type ExerciseSummary = {
    id: number;
    title: string;
    instructions: string;
    order: number;
    type: string; // e.g., 'matching', 'multiple-choice', 'fill-in-the-blank', 'sentence-ordering'
};

type ExerciseFull = ExerciseSummary & {
    data: any;
};

type Gender = "fem" | "masc" | "neut";

type VocabularyItem = {
    word: string;
    translation: string;
    exampleSentence: string;
    exampleTranslation: string;
    gender?: Gender;
};

interface Props extends PageProps {
    content: string;
    title: string;
    languagePairName: string;
    level: string;
    lesson_number: number;
    progress: {
        completed: boolean;
        completed_at: string | null;
    };
    navigation: {
        previous: NavigationItem | null;
        next: NavigationItem | null;
    };
}

export default function Show({
    content,
    title,
    languagePairName,
    level,
    lesson_number,
    progress,
    navigation,
}: Props) {
    const [lessonContent, setLessonContent] = useState("");
    const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
    // Exercises state
    const [exercises, setExercises] = useState<ExerciseSummary[]>([]);
    const [exercisesLoading, setExercisesLoading] = useState(false);
    const [exercisesError, setExercisesError] = useState<string | null>(null);
    const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
    const [exerciseDataMap, setExerciseDataMap] = useState<Record<number, ExerciseFull>>({});
    const [exerciseLoading, setExerciseLoading] = useState(false);
    const [exerciseError, setExerciseError] = useState<string | null>(null);

    const formatLevelName = (name: string) => {
        return name
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    useEffect(() => {
        console.log("Content:", content);

        // Extract metadata from the MDX content
        const metadata = parseFrontmatter(content);
        console.log("Metadata:", metadata);
        // Extract the content without the frontmatter
        const parsedContent = parseContent(content);
        setLessonContent(parsedContent);
        setVocabulary(metadata?.vocabulary || []);
        console.log("Vocabulary:", metadata?.vocabulary);
    }, []);

    // Fetch exercises list on mount or when lesson changes
    useEffect(() => {
        let cancelled = false;
        const fetchExercises = async () => {
            try {
                setExercisesLoading(true);
                setExercisesError(null);
                const { data } = await axios.get(
                    route("lessons.exercises.index", {
                        level,
                        lesson_number,
                    })
                );
                if (!cancelled) {
                    const list = data as ExerciseSummary[];
                    setExercises(list);
                    // Auto-select first exercise for immediate UX
                    if (list.length && selectedExerciseId === null) {
                        // Fire and forget; do not await to keep UI responsive
                        selectExercise(list[0].id);
                    }
                }
            } catch (e: any) {
                if (!cancelled)
                    setExercisesError(
                        e?.response?.data?.message || "Failed to load exercises"
                    );
            } finally {
                if (!cancelled) setExercisesLoading(false);
            }
        };
        fetchExercises();
        return () => {
            cancelled = true;
        };
    }, [level, lesson_number]);

    const selectExercise = async (id: number) => {
        setSelectedExerciseId(id);
        if (exerciseDataMap[id]) return; // already fetched
        try {
            setExerciseLoading(true);
            setExerciseError(null);
            const { data } = await axios.get(
                route("lessons.exercises.show", {
                    level,
                    lesson_number,
                    exercise: id,
                })
            );
            setExerciseDataMap((prev) => ({ ...prev, [id]: data as ExerciseFull }));
        } catch (e: any) {
            setExerciseError(
                e?.response?.data?.message || "Failed to load exercise"
            );
        } finally {
            setExerciseLoading(false);
        }
    };

    const selectedExercise =
        selectedExerciseId !== null ? exerciseDataMap[selectedExerciseId] : undefined;

    const renderExercise = () => {
        if (!selectedExercise) return null;
        switch (selectedExercise.type) {
            case "matching":
                return (
                    <Matching
                        title={selectedExercise.title}
                        instructions={selectedExercise.instructions}
                        pairs={selectedExercise.data?.pairs || []}
                        shuffle={selectedExercise.data?.shuffle ?? true}
                        onComplete={(res) => {
                            // TODO: optionally POST results
                            console.log("Matching completed:", res);
                        }}
                    />
                );
            case "multiple-choice":
                return (
                    <MultipleChoice
                        title={selectedExercise.title}
                        instructions={selectedExercise.instructions}
                        questions={selectedExercise.data?.questions || []}
                        shuffleQuestions={selectedExercise.data?.shuffleQuestions ?? true}
                        shuffleChoices={selectedExercise.data?.shuffleChoices ?? true}
                        onComplete={(res) => {
                            console.log("Multiple-choice completed:", res);
                        }}
                    />
                );
            case "fill-in-the-blank":
                return (
                    <FillInTheBlank
                        title={selectedExercise.title}
                        instructions={selectedExercise.instructions}
                        sentences={selectedExercise.data?.sentences || []}
                        shuffleSentences={selectedExercise.data?.shuffleSentences ?? false}
                        caseSensitive={selectedExercise.data?.caseSensitive ?? false}
                        trimWhitespace={selectedExercise.data?.trimWhitespace ?? true}
                        onComplete={(res) => {
                            console.log("Fill-in-the-blank completed:", res);
                        }}
                    />
                );
            case "sentence-ordering":
                return (
                    <SentenceOrdering
                        title={selectedExercise.title}
                        instructions={selectedExercise.instructions}
                        items={selectedExercise.data?.items || []}
                        shuffleTokens={selectedExercise.data?.shuffleTokens ?? true}
                        onComplete={(res) => {
                            console.log("Sentence-ordering completed:", res);
                        }}
                    />
                );
            default:
                return (
                    <div className="text-gray-700 dark:text-gray-300">
                        Exercise type "{selectedExercise.type}" coming soon.
                    </div>
                );
        }
    };

    const handleComplete = () => {
        router.post(
            `/lessons/${level}/${lesson_number}/complete`,
            {},
            {
                preserveScroll: true,
            }
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                            {languagePairName} - {formatLevelName(level)}
                        </h2>
                        <h3 className="text-lg text-gray-600 dark:text-gray-400">
                            {title}
                        </h3>
                    </div>
                    <Link
                        href={route("lessons.index")}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                        <FiArrowLeft />
                        Back to Lessons
                    </Link>
                </div>
            }
        >
            <Head title={`${title} - ${languagePairName}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="lg:grid lg:grid-cols-3 lg:gap-6">
                        {/* Main lesson content */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 mb-6 lg:mb-0">
                                <LessonViewer content={lessonContent} />
                            </div>
                        </div>

                        {/* Vocabulary sidebar */}
                        {vocabulary.length > 0 && (
                            <div className="lg:col-span-1">
                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 top-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                                        Vocabulary
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            {vocabulary.map((item, index) => (
                                                <FlashcardVocabulary
                                                    key={index}
                                                    item={item}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Exercises section */}
                    <div className="mt-6 bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Practice
                            </h3>
                        </div>
                        {exercisesLoading ? (
                            <div className="text-gray-600 dark:text-gray-400">Loading exercises…</div>
                        ) : exercisesError ? (
                            <div className="text-red-600 dark:text-red-400">{exercisesError}</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {exercises.map((ex) => {
                                    const isActive = selectedExerciseId === ex.id;
                                    return (
                                        <button
                                            key={ex.id}
                                            onClick={() => selectExercise(ex.id)}
                                            className={
                                                "text-left rounded-lg border transition-shadow p-4 focus:outline-none focus:ring-2 focus:ring-primary-500 " +
                                                (isActive
                                                    ? "border-primary-500 shadow"
                                                    : "border-gray-200 dark:border-gray-700 hover:shadow")
                                            }
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1 font-medium text-gray-700 dark:text-gray-300">
                                                    {ex.type}
                                                </span>
                                                {isActive && (
                                                    <span className="text-primary-600 text-xs">Selected</span>
                                                )}
                                            </div>
                                            <h4 className="mt-2 font-semibold text-gray-900 dark:text-gray-100">
                                                {ex.title}
                                            </h4>
                                            {ex.instructions && (
                                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                                                    {ex.instructions}
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {selectedExerciseId !== null && (
                            <div className="mt-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                                            {selectedExercise?.title || "Exercise"}
                                        </h4>
                                        {selectedExercise?.instructions && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {selectedExercise.instructions}
                                            </p>
                                        )}
                                    </div>
                                    {/* Placeholder for future controls (reset, etc.) */}
                                </div>

                                {exerciseLoading && !selectedExercise ? (
                                    <div className="mt-4 text-gray-600 dark:text-gray-400">Loading…</div>
                                ) : exerciseError ? (
                                    <div className="mt-4 text-red-600 dark:text-red-400">{exerciseError}</div>
                                ) : selectedExercise ? (
                                    <div className="mt-4">{renderExercise()}</div>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {/* Navigation footer */}
                    <div className="mt-6 bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <LessonNavigation
                            previous={navigation.previous}
                            next={navigation.next}
                            level={level}
                            onComplete={handleComplete}
                            isCompleted={progress.completed}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
