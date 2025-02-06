import React from "react";
import { ReactNode } from "react";
import { IoIosBulb } from "react-icons/io";

interface TipBoxProps {
    children: ReactNode;
}

const TipBox: React.FC<TipBoxProps> = ({ children }) => {
    return (
        <div className="group transition-all duration-300 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-l-4 border-blue-500 rounded-lg px-4 py-3 shadow-sm hover:shadow-md dark:from-indigo-950 dark:to-indigo-900 dark:hover:from-indigo-900 dark:hover:to-indigo-800 dark:text-indigo-50 dark:border-indigo-400" role="alert">
            <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 mt-1">
                    <IoIosBulb className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 dark:text-indigo-300 group-hover:text-blue-600 dark:group-hover:text-indigo-200 transition-colors duration-300" />
                </div>
                <div className="flex-1 space-y-1">
                    <p className="font-medium text-blue-900 dark:text-indigo-200 text-sm sm:text-base">
                        Pro Tip
                    </p>
                    <div className="text-blue-800 dark:text-indigo-100 text-sm leading-relaxed">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TipBox;
