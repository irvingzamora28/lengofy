import React, { useState, useRef } from "react";
import { FiVolume2, FiPauseCircle } from "react-icons/fi";
import { motion } from "framer-motion";

interface AudioItemProps {
    audio: string;
    text: string;
}

const AudioItem: React.FC<AudioItemProps> = ({ audio, text }) => {

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
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3"
        >
            <audio
                ref={audioRef}
                src={audio}
                onEnded={handleAudioEnded}
                className="hidden"
            />


            <span className="text-gray-800 dark:text-gray-200 font-medium">
                {text}
            </span>

            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleAudio}
                className={`p-2 rounded-full ${
                    isPlaying
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                } hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors`}
                aria-label={isPlaying ? "Pause audio" : "Play audio"}
            >
                {isPlaying ? (
                    <FiPauseCircle className="w-5 h-5" />
                ) : (
                    <FiVolume2 className="w-5 h-5" />
                )}
            </motion.button>
        </motion.div>
    );
};

export default AudioItem;
