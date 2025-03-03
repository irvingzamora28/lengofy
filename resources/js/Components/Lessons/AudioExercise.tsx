import React from "react";
import { motion } from "framer-motion";

interface AudioExerciseProps {
    children: React.ReactNode;
    title?: string;
}

const AudioExercise: React.FC<AudioExerciseProps> = ({ 
    children,
    title = "Audio Practice"
}) => {
    return (
        <div className="my-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 sm:p-6 shadow-md transition-all duration-300 hover:shadow-lg">
            {title && (
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4">
                    {title}
                </h3>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {children}
            </div>
        </div>
    );
};

export default AudioExercise;
