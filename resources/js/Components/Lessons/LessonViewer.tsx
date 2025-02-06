import React from "react";
import Markdown from "markdown-to-jsx";
import WordBuilder from "@/Components/Lessons/WordBuilder"; // Import the WordBuilder component
import VoiceRecorder from "./VoiceRecorder";
import HighlightableText from "./HighlightableText";
import { Part, SentenceBreakdown } from "./SentenceBreakdown";
import TipBox from "./TipBox";
import Mnemonic from "./Mnemonic";

interface LessonViewerProps {
    content: string;
    className?: string;
}

const LessonViewer: React.FC<LessonViewerProps> = ({
    content,
    className = "",
}) => {
    return (
        <div
            className={`prose prose-lg max-w-none dark:prose-invert ${className}`}
        >
            <Markdown
                options={{
                    overrides: {
                        table: {
                            props: {
                                className:
                                    "min-w-full divide-y divide-gray-300",
                            },
                        },
                        thead: {
                            props: {
                                className: "bg-gray-50",
                            },
                        },
                        th: {
                            props: {
                                className:
                                    "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                            },
                        },
                        td: {
                            props: {
                                className:
                                    "px-6 py-4 whitespace-nowrap text-sm text-gray-500",
                            },
                        },
                        h1: {
                            props: {
                                className: "text-3xl font-bold mb-4",
                            },
                        },
                        h2: {
                            props: {
                                className: "text-2xl font-bold mt-6 mb-4",
                            },
                        },
                        WordBuilder: {
                            component: WordBuilder,
                        },
                        VoiceRecorder: {
                            component: VoiceRecorder,
                        },
                        HighlightableText: {
                            component: HighlightableText,
                        },
                        TipBox: {
							component: TipBox,
						},
                        Mnemonic: {
                            component: Mnemonic,
                        },
                        SentenceBreakdown,
                        Part,
                    },
                }}
            >
                {content}
            </Markdown>
        </div>
    );
};

export default LessonViewer;
