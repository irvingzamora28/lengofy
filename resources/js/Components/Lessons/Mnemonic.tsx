import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BiBrain } from "react-icons/bi";
import { IoIosArrowDown } from "react-icons/io";

type MnemonicProps = {
  title: string;
  content: string;
};

const Mnemonic: React.FC<MnemonicProps> = ({ title, content }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative w-full max-w-md">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full items-center justify-between px-4 py-3 rounded-lg
                 bg-gradient-to-r from-violet-500 to-indigo-500
                 dark:from-violet-600 dark:to-indigo-600
                 hover:from-violet-600 hover:to-indigo-600
                 dark:hover:from-violet-700 dark:hover:to-indigo-700
                 transition-all duration-300 ease-in-out
                 shadow-lg hover:shadow-xl"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-sm font-medium text-white md:text-base">
          {title}
        </span>
        <div className="flex items-center space-x-2">
          <BiBrain className="w-6 h-6 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <IoIosArrowDown className="w-5 h-5 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 w-full mt-2 overflow-hidden rounded-lg
                     bg-white dark:bg-gray-800 shadow-xl
                     border border-gray-100 dark:border-gray-700"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="p-4"
            >
              <p className="text-sm text-gray-700 dark:text-gray-200 md:text-base leading-relaxed">
                {content}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Mnemonic;
