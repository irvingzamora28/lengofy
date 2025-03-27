import React from "react";
import Markdown from "markdown-to-jsx";
import WordBuilder from "@/Components/Lessons/WordBuilder";
import VoiceRecorder from "./VoiceRecorder";
import HighlightableText from "./HighlightableText";
import { Part, SentenceBreakdown } from "./SentenceBreakdown";
import TipBox from "./TipBox";
import Mnemonic from "./Mnemonic";
import TextToSpeechPlayer from "../UI/TextToSpeechPlayer";
import Table from "./Table";
import TableBody from "./TableBody";
import ConversationBox from "./ConversationBox";
import DialogueLine from "./DialogueLine";
import AudioExercise from "./AudioExercise";
import AudioItem from "./AudioItem";

interface LessonViewerProps {
    content: string;
    className?: string;
}

const LessonViewer: React.FC<LessonViewerProps> = ({
    content,
    className = "",
}) => {
    return (
        <div className={`max-w-none ${className} text-gray-800 dark:text-gray-100`}>
            <Markdown
                options={{
                    overrides: {
                        h1: {
                            props: {
                                className:
                                    "py-3 text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-gray-200 border-b-2 border-gray-200 dark:border-gray-700 pb-2",
                            },
                        },
                        h2: {
                            props: {
                                className:
                                    "border-t-2 border-slate-200 dark:border-slate-700 py-3 mt-8 text-xl md:text-2xl lg:text-3xl font-semibold text-gray-700 dark:text-gray-300",
                            },
                        },
                        h3: {
                            props: {
                                className:
                                    "py-3 text-md md:text-lg lg:text-xl font-medium text-gray-600 dark:text-gray-400",
                            },
                        },
                        ul: {
                            props: {
                                className: "pl-5 py-2 list-disc space-y-1 text-gray-700 dark:text-gray-300",
                            },
                        },
                        ol: {
                            props: {
                                className: "pl-5 py-2 list-decimal space-y-1 text-gray-700 dark:text-gray-300",
                            },
                        },
                        li: {
                            props: {
                                className: "pl-2 py-1 leading-relaxed",
                            },
                        },
                        table: {
                            component: Table,
                            props: {
                                className:
                                    "min-w-full text-left border-collapse rounded-lg overflow-hidden shadow-sm bg-gray-50 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-800",
                            },
                        },
                        thead: {
                            props: {
                                className:
                                    "border-b bg-gray-100 dark:bg-gray-800/30 font-semibold",
                            },
                        },
                        tr: {
                            props: {
                                className:
                                    "even:bg-gray-50 odd:bg-white dark:even:bg-gray-800/30 dark:odd:bg-gray-900/20 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors duration-200",
                            },
                        },
                        th: {
                            props: {
                                className:
                                    "px-4 py-3 font-bold text-sm sm:text-base text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800/20",
                            },
                        },
                        tbody: {
                            component: TableBody,
                            props: {
                                className:
                                    "bg-white dark:bg-gray-900/10",
                            },
                        },
                        td: {
                            props: {
                                className:
                                    "px-4 py-3 border-b border-gray-100 dark:border-gray-800/50 text-gray-700 dark:text-gray-300",
                            },
                        },
                        p: {
                            props: {
                                className: "py-3 text-gray-800 dark:text-gray-200 leading-relaxed",
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
                        ConversationBox: {
                            component: ConversationBox,
                        },
                        DialogueLine: {
                            component: DialogueLine,
                        },
                        AudioExercise: {
                            component: AudioExercise,
                        },
                        AudioItem: {
                            component: AudioItem,
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
