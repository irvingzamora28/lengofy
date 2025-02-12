import React, { useEffect } from "react";
import Markdown from "markdown-to-jsx";
import WordBuilder from "@/Components/Lessons/WordBuilder"; // Import the WordBuilder component
import VoiceRecorder from "./VoiceRecorder";
import HighlightableText from "./HighlightableText";
import { Part, SentenceBreakdown } from "./SentenceBreakdown";
import TipBox from "./TipBox";
import Mnemonic from "./Mnemonic";
import TextToSpeechPlayer from "../UI/TextToSpeechPlayer";
import Table from "./Table";
import TableBody from "./TableBody";

interface LessonViewerProps {
    content: string;
    className?: string;
}

const LessonViewer: React.FC<LessonViewerProps> = ({
    content,
    className = "",
}) => {

    return (
        <div className={`max-w-none ${className}`}>
            <Markdown
                options={{
                    overrides: {
                        h1: {
                            props: {
                                className:
                                    "py-3 text-2xl md:text-3xl lg:text-4xl",
                            },
                        },
                        h2: {
                            props: {
                                className:
                                    "border-t-2 border-slate-200 py-3 mt-8 text-xl md:text-2xl lg:text-3xl",
                            },
                        },
                        h3: {
                            props: {
                                className:
                                    "py-3 text-md md:text-md lg:text-2xl",
                            },
                        },
                        ul: {
                            props: {
                                className: "pl-5 py-0 list-disc",
                            },
                        },
                        ol: {
                            props: {
                                className: "pl-5 py-1 list-decimal",
                            },
                        },
                        li: {
                            props: {
                                className: "pl-2 py-1",
                            },
                        },
                        table: {
                            component: Table,
                            props: {
                                className:
                                    "min-w-full text-left border-collapse bg-gradient-to-b from-blue-500 to-blue-600 dark:from-indigo-800 dark:to-indigo-900 rounded-none md:rounded-lg",
                            },
                        },
                        thead: {
                            props: {
                                className:
                                    "border-b font-medium dark:border-neutral-500",
                            },
                        },
                        th: {
                            props: {
                                className:
                                    "px-4 py-2 font-semibold text-sm sm:text-base text-slate-50 dark:text-gray-200",
                            },
                        },
                        tbody: {
                            component: TableBody,
                            props: {
                                className:
                                    "bg-white dark:bg-neutral-800 dark:text-gray-200",
                            },
                        },
                        td: {
                            props: {
                                className:
                                    "px-4 py-2",
                            },
                        },
                        p: {
                            props: {
                                className: "py-3",
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
                        TextToSpeechPlayer: {
                            component: TextToSpeechPlayer,
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
