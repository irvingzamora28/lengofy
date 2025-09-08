import { useEffect, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { FiBook, FiLink, FiList, FiEdit3 } from "react-icons/fi";
import { FaPuzzlePiece, FaLanguage } from "react-icons/fa";
import { MdFormatListNumbered } from "react-icons/md";
import LessonQuickAccessMobile from "@/Components/Lessons/LessonQuickAccessMobile";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import LessonNavigation from "@/Components/Lessons/LessonNavigation";
import { PageProps } from "@/types";
import axios from "axios";
import Matching from "@/Components/Lessons/Exercises/Matching";
import MultipleChoice from "@/Components/Lessons/Exercises/MultipleChoice";
import FillInTheBlank from "@/Components/Lessons/Exercises/FillInTheBlank";
import SentenceOrdering from "@/Components/Lessons/Exercises/SentenceOrdering";
import VerbConjugationSlot from "@/Components/Lessons/Exercises/VerbConjugationSlot";

interface NavigationItem {
  title: string;
  lesson_number: number;
}

type ExerciseSummary = {
  id: number;
  title: string;
  instructions: string;
  order: number;
  type: string;
};

type ExerciseFull = ExerciseSummary & { data: any };

interface Props extends PageProps {
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
  specialCharacters?: string[];
}

const getExerciseIcon = (type: string) => {
  switch (type) {
    case "matching":
      return <FiLink className="h-6 w-6" />;
    case "multiple-choice":
      return <FiList className="h-6 w-6" />;
    case "fill-in-the-blank":
      return <FiEdit3 className="h-6 w-6" />;
    case "sentence-ordering":
      return <MdFormatListNumbered className="h-6 w-6" />;
    case "verb-conjugation":
      return <FaLanguage className="h-6 w-6" />;
    default:
      return <FaPuzzlePiece className="h-6 w-6" />;
  }
};

export default function Practice({
  title,
  languagePairName,
  level,
  lesson_number,
  progress,
  navigation,
  specialCharacters = [],
}: Props) {
  const [exercises, setExercises] = useState<ExerciseSummary[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [exercisesError, setExercisesError] = useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [exerciseDataMap, setExerciseDataMap] = useState<Record<number, ExerciseFull>>({});
  const [exerciseLoading, setExerciseLoading] = useState(false);
  const [exerciseError, setExerciseError] = useState<string | null>(null);

  const formatLevelName = (name: string) =>
    name
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  // Fetch list
  useEffect(() => {
    let cancelled = false;
    const fetchExercises = async () => {
      try {
        setExercisesLoading(true);
        setExercisesError(null);
        const { data } = await axios.get(
          route("lessons.exercises.index", { level, lesson_number })
        );
        if (!cancelled) {
          const list = data as ExerciseSummary[];
          setExercises(list);
          if (list.length && selectedExerciseId === null) {
            // auto-select first exercise
            void selectExercise(list[0].id);
          }
        }
      } catch (e: any) {
        if (!cancelled)
          setExercisesError(e?.response?.data?.message || "Failed to load exercises");
      } finally {
        if (!cancelled) setExercisesLoading(false);
      }
    };
    fetchExercises();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, lesson_number]);

  const selectExercise = async (id: number) => {
    setSelectedExerciseId(id);
    if (exerciseDataMap[id]) return;
    try {
      setExerciseLoading(true);
      setExerciseError(null);
      const { data } = await axios.get(
        route("lessons.exercises.show", { level, lesson_number, exercise: id })
      );
      setExerciseDataMap((prev) => ({ ...prev, [id]: data as ExerciseFull }));
    } catch (e: any) {
      setExerciseError(e?.response?.data?.message || "Failed to load exercise");
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
            specialCharacters={specialCharacters}
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
      case "verb-conjugation":
        return (
          <VerbConjugationSlot
            items={selectedExercise.data?.items || []}
            subjects={selectedExercise.data?.subjects}
            onRoundComplete={(res) => {
              console.log("Verb-conjugation round:", res);
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

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
              {languagePairName} - {formatLevelName(level)}
            </h2>
            <h3 className="text-lg text-gray-600 dark:text-gray-400">{title} · Practice</h3>
          </div>
          <div className="hidden md:flex gap-2">
            <Link
              href={route("lessons.show", { level, lesson_number })}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
            >
              <FiBook className="h-4 w-4" />
              <span>Content</span>
            </Link>
            <Link
              href={route("lessons.practice", { level, lesson_number })}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700 shadow-sm"
            >
              <FaPuzzlePiece className="h-4 w-4" />
              <span>Practice</span>
            </Link>
          </div>
        </div>
      }
    >
      <Head title={`${title} · Practice - ${languagePairName}`} />

      {/* Mobile sticky quick access */}
      <LessonQuickAccessMobile
        level={level}
        lesson_number={lesson_number}
        current="practice"
      />

      <div className="py-0 sm:py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Practice</h3>
            </div>
            {exercisesLoading ? (
              <div className="text-gray-600 dark:text-gray-400">Loading exercises…</div>
            ) : exercisesError ? (
              <div className="text-red-600 dark:text-red-400">{exercisesError}</div>
            ) : (
              <>
                {/* Mobile: grid of square icon buttons */}
                <div className="sm:hidden -mx-1">
                  <div className="grid grid-cols-8 gap-1 px-1">
                    {exercises.map((ex, idx) => {
                      const isActive = selectedExerciseId === ex.id;
                      return (
                        <button
                          key={ex.id}
                          onClick={() => selectExercise(ex.id)}
                          className={
                            "relative aspect-square rounded-md border flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 " +
                            (isActive
                              ? "bg-primary-600 text-white border-primary-600"
                              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700")
                          }
                          aria-pressed={isActive}
                          aria-label={`Select exercise ${idx + 1}: ${ex.title}`}
                          title={ex.title}
                        >
                          <div className={"flex items-center justify-center " + (isActive ? "text-white" : "text-gray-600 dark:text-gray-300")}>
                            {/* smaller icon for compact UI */}
                            {(() => {
                              const icon = getExerciseIcon(ex.type);
                              // override size via Tailwind classes on wrapper
                              return <div className="[&>*]:h-5 [&>*]:w-5">{icon}</div>;
                            })()}
                          </div>
                          <span className={"absolute top-1 right-1 text-[10px] leading-none px-1 rounded " + (isActive ? "text-white/90" : "text-gray-500 dark:text-gray-300/80")}>{idx + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop/Tablet: existing grid of cards */}
                <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <h4 className="mt-2 font-semibold text-gray-900 dark:text-gray-100">{ex.title}</h4>
                        {ex.instructions && (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                            {ex.instructions}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {selectedExerciseId !== null && (
              <div className="mt-6">
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
          <div className="mt-6 mb-16 sm:mb-0 bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
            <LessonNavigation
              previous={navigation.previous}
              next={navigation.next}
              level={level}
              onComplete={() => {
                // In practice mode we usually don't auto-complete the lesson
              }}
              isCompleted={progress.completed}
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
