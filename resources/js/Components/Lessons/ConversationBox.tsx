import React, { useState, useRef } from "react";
import { FiPlayCircle, FiPauseCircle, FiRepeat } from "react-icons/fi";
import { motion } from "framer-motion";

interface ConversationBoxProps {
    children: React.ReactNode;
    title?: string;
}

const ConversationBox: React.FC<ConversationBoxProps> = ({ 
    children,
    title = "Conversation Practice"
}) => {
    const [isPlayingAll, setIsPlayingAll] = useState(false);
    const childrenArray = React.Children.toArray(children);
    const [currentAudioIndex, setCurrentAudioIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Get all audio elements from DialogueLine components within this conversation box
    const getAudioElements = (): HTMLAudioElement[] => {
        const audioElements: HTMLAudioElement[] = [];
        if (containerRef.current) {
            containerRef.current.querySelectorAll('audio.conversation-audio').forEach((audio) => {
                audioElements.push(audio as HTMLAudioElement);
            });
        }
        return audioElements;
    };

    const playAllAudio = () => {
        const audioElements = getAudioElements();
        if (!audioElements.length) return;
        
        if (isPlayingAll) {
            // Stop all audio
            audioElements.forEach(audio => {
                audio.pause();
                audio.currentTime = 0;
            });
            setIsPlayingAll(false);
            setCurrentAudioIndex(-1);
        } else {
            setIsPlayingAll(true);
            setCurrentAudioIndex(0);
            playAudioSequentially(audioElements, 0);
        }
    };

    const playAudioSequentially = (audioElements: HTMLAudioElement[], index: number) => {
        if (index >= audioElements.length) {
            setIsPlayingAll(false);
            setCurrentAudioIndex(-1);
            return;
        }
        
        setCurrentAudioIndex(index);
        const audio = audioElements[index];
        
        audio.play();
        
        audio.onended = () => {
            // Small delay between audio clips
            setTimeout(() => {
                playAudioSequentially(audioElements, index + 1);
            }, 500);
        };
    };

    return (
        <div ref={containerRef} className="my-6 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 p-4 sm:p-6 shadow-md transition-all duration-300 hover:shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-300">
                    {title}
                </h3>
                
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={playAllAudio}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
                    aria-label={isPlayingAll ? "Stop conversation audio" : "Play conversation audio"}
                >
                    {isPlayingAll ? (
                        <>
                            <FiPauseCircle className="w-4 h-4" />
                            <span className="text-sm">Stop</span>
                        </>
                    ) : (
                        <>
                            <FiPlayCircle className="w-4 h-4" />
                            <span className="text-sm">Play All</span>
                        </>
                    )}
                </motion.button>
            </div>
            
            <div className="space-y-2">
                {React.Children.map(children, (child, index) => {
                    if (React.isValidElement(child)) {
                        return React.cloneElement(child, {
                            ...child.props,
                            key: index,
                            className: `${child.props.className || ''} ${currentAudioIndex === index ? 'ring-2 ring-indigo-400 dark:ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : ''}`,
                            // Add a class to the audio element for easy selection
                            audioClassName: 'conversation-audio',
                            isHighlighted: currentAudioIndex === index
                        });
                    }
                    return child;
                })}
            </div>
        </div>
    );
};

export default ConversationBox;
