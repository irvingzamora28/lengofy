import React, { useState, useRef } from "react";
import { FiVolume2 } from "react-icons/fi";
import { IoMdSwap } from "react-icons/io";
import { motion } from "framer-motion";

interface DialogueLineProps {
    speaker: string;
    text: string;
    translation: string;
    audio?: string;
    audioClassName?: string;
    isHighlighted?: boolean;
}

const DialogueLine: React.FC<DialogueLineProps> = ({
    speaker,
    text,
    translation,
    audio,
    audioClassName,
    isHighlighted = false
}) => {

    const [showTranslation, setShowTranslation] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const toggleAudio = () => {
        if (!audioRef.current) return;
        
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        
        setIsPlaying(!isPlaying);
    };

    const handleAudioEnded = () => {
        setIsPlaying(false);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-2 mb-3 w-full">
            {/* Speaker section */}
            <div className="w-full sm:w-24 flex-shrink-0">
                <div className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-lg font-medium text-sm">
                    {speaker}
                </div>
            </div>

            {/* Content section */}
            <div className="flex-grow">
                <div className={`bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 relative ${isHighlighted ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700' : ''}`}>
                    <p className={`mb-1 ${isHighlighted ? 'text-indigo-700 dark:text-indigo-300 font-medium' : 'text-gray-800 dark:text-gray-200'}`}>
                        {showTranslation ? translation : text}
                    </p>

                    <div className="flex justify-end gap-2 mt-2">
                        {audio && (
                            <>

                                <audio 
                                    ref={audioRef} 
                                    src={audio} 
                                    onEnded={handleAudioEnded}
                                    className={`hidden ${audioClassName || ''}`}
                                />

                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={toggleAudio}
                                    className={`p-1.5 rounded-full ${
                                        isPlaying
                                            ? "bg-indigo-500 text-white dark:bg-indigo-600 dark:text-white ring-2 ring-indigo-200 dark:ring-indigo-800"
                                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                    } hover:bg-indigo-400 hover:text-white dark:hover:bg-indigo-700 transition-colors`}
                                    aria-label={isPlaying ? "Pause audio" : "Play audio"}
                                >
                                    <FiVolume2 className="w-4 h-4" />
                                </motion.button>
                            </>
                        )}

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowTranslation(!showTranslation)}
                            className="p-1.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                            aria-label="Toggle translation"
                        >
                            <IoMdSwap className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DialogueLine;
