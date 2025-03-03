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

interface NavigationItem {
    title: string;
    lesson_number: number;
}

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
