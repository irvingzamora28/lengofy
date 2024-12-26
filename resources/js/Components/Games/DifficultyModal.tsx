import { start } from 'repl';
import Modal from '../Modal';

interface DifficultyModalProps {
    showDifficultyModal: boolean;
    setShowDifficultyModal: React.Dispatch<React.SetStateAction<boolean>>;
    selectedDifficulty: string;
    setSelectedDifficulty: React.Dispatch<React.SetStateAction<"easy" | "medium" | "hard">>;
    startGame: () => void;
    gameType: 'singlePlayer' | 'multiPlayer';
}

export default function DifficultyModal({
    showDifficultyModal,
    setShowDifficultyModal,
    selectedDifficulty,
    setSelectedDifficulty,
    startGame,
    gameType
}: DifficultyModalProps) {
    return (
        <Modal show={showDifficultyModal} onClose={() => setShowDifficultyModal(false)}>
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Select Difficulty</h2>
            <div className="space-y-4">
              {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => setSelectedDifficulty(difficulty)}
                  className={`w-full py-3 rounded-lg transition-colors ${
                    selectedDifficulty === difficulty
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  <span className="block text-sm mt-1">
                    {difficulty === 'easy' && '5 seconds per word'}
                    {difficulty === 'medium' && '3 seconds per word'}
                    {difficulty === 'hard' && '1 second per word'}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-6">
              <button
                onClick={startGame}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg"
              >
                {gameType === 'singlePlayer' ? 'Start Practice' : 'Start Game'}
              </button>
            </div>
          </div>
        </Modal>
      );
}
