import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaLightbulb, FaBook } from 'react-icons/fa';

export interface PartProps {
  part: string;
  explanation: string;
}

export const Part = (props: PartProps) => null;

interface SentenceBreakdownProps {
  sentence: string;
  children: React.ReactElement<PartProps>[];
}

export const SentenceBreakdown = ({ sentence, children }: SentenceBreakdownProps) => {
  const parts = React.Children.map(children, (child) => ({
    part: child.props.part,
    explanation: child.props.explanation,
  })) || [];

  const [currentStep, setCurrentStep] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleNext = () => currentStep < parts.length - 1 && setCurrentStep(prev => prev + 1);
  const handlePrevious = () => currentStep > 0 && setCurrentStep(prev => prev - 1);

  const currentPart = parts[currentStep];

  return (
    <motion.div
      layout
      className="w-full max-w-xl mx-auto bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg overflow-hidden"
    >
      <div className="p-4 sm:p-6">
        <div className="flex items-center mb-6">
          <FaBook className="text-blue-600 dark:text-blue-400 text-xl mr-2" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Sentence Analysis</h2>
        </div>

        <div className="text-lg sm:text-xl mb-6 font-medium text-center">
          {parts.map(({ part }, index) => (
            <motion.span
              key={index}
              className="inline-block mx-1 px-2 py-1 rounded-md cursor-pointer"
              initial={false}
              animate={{
                backgroundColor: currentStep === index ? 'rgb(219 234 254)' : 'transparent',
                color: currentStep === index ? 'rgb(30 64 175)' : 'currentColor',
                scale: currentStep === index ? 1.05 : 1,
              }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setCurrentStep(index)}
              style={{
                colorScheme: 'dark:rgb(55 65 81)'
              }}
            >
              {part}
            </motion.span>
          ))}
        </div>

        <motion.div
          layout
          className="relative bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
        >
          <div className="absolute -top-3 left-4">
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              className="bg-blue-500 dark:bg-blue-600 p-2 rounded-full shadow-md"
            >
              <FaLightbulb className="text-white text-sm" />
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-2"
            >
              <p className="text-gray-600 dark:text-gray-300">{currentPart.explanation}</p>
              <div className="mt-2 text-sm text-gray-400 dark:text-gray-500 text-right">
                {currentStep + 1} / {parts.length}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <div className="flex justify-between mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors hover:bg-blue-600 dark:hover:bg-blue-700"
          >
            <FaArrowLeft className="mr-2 text-xs" />
            Previous
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            disabled={currentStep === parts.length - 1}
            className="flex items-center px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors hover:bg-blue-600 dark:hover:bg-blue-700"
          >
            Next
            <FaArrowRight className="ml-2 text-xs" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default SentenceBreakdown;
