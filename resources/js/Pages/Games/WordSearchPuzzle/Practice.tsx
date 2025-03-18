import { useState, useEffect } from 'react';
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { FaClock, FaTrophy, FaEye, FaEyeSlash, FaStar } from 'react-icons/fa';
import { MdClose, MdGamepad } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import matchSound from "@/assets/audio/correct-match.mp3";


const playSound = (() => {
    const audio = new Audio(matchSound);
    return () => {
        audio.currentTime = 0;
        audio.play().catch(() => {
            // Ignore errors from browsers blocking autoplay
        });
    };
})();

interface Props {
    auth: {
        user: {
            language_pair_id: number;
        };
    };
    difficulty: 'easy' | 'medium' | 'hard';
    category: number;
    words: {
        id: number;
        word: string;
        translation: string;
    }[];
}

interface Word {
    id: number;
    word: string;
    translation: string;
    found: boolean;
}

interface GridCell {
    letter: string;
    isSelected: boolean;
    isFound: boolean;
}

export default function WordSearchPuzzlePractice({ auth, difficulty, category, words: initialWords }: Props) {
    const { t: trans } = useTranslation();

    useEffect(() => {
        console.log("Words: ", initialWords);

    }, []);

    // Grid size based on difficulty
    const gridSize = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 30;

    // Dynamic cell size based on grid size for better design
    const getCellSizeClass = () => {
        switch (gridSize) {
            case 10: return 'h-10 w-10'; // 40px for 10x10
            case 15: return 'h-6 w-6 md:h-9 md:w-9';   // 36px for 15x15
            default: return 'h-6 w-6';   // 24px for 30x30
        }
    };

    const [words, setWords] = useState<Word[]>(
        initialWords.map(word => ({
            ...word,
            found: false
        }))
    );

    const [grid, setGrid] = useState<GridCell[][]>([]);
    const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
    const [score, setScore] = useState(0);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isGameFinished, setIsGameFinished] = useState(false);
    const [showTranslations, setShowTranslations] = useState(false);

    // Directions for word placement
    const directions = [
        { dx: 0, dy: 1 },  // right
        { dx: 0, dy: -1 }, // left
        { dx: 1, dy: 0 },  // down
        { dx: -1, dy: 0 }, // up
        { dx: 1, dy: 1 },  // diagonal right-down
        { dx: 1, dy: -1 }, // diagonal right-up
        { dx: -1, dy: 1 }, // diagonal left-down
        { dx: -1, dy: -1 }, // diagonal left-up
    ];

    // Initialize grid and place words
    useEffect(() => {
        const newGrid: GridCell[][] = Array.from({ length: gridSize }, () =>
            Array.from({ length: gridSize }, () => ({
                letter: '',
                isSelected: false,
                isFound: false,
            }))
        );

        words.forEach((word) => {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100;

            while (!placed && attempts < maxAttempts) {
                const directionIndex = Math.floor(Math.random() * directions.length);
                const { dx, dy } = directions[directionIndex];
                const wordLength = word.word.length;

                const minX = dx > 0 ? 0 : dx < 0 ? wordLength - 1 : 0;
                const maxX = dx > 0 ? gridSize - wordLength : dx < 0 ? gridSize - 1 : gridSize - 1;
                const minY = dy > 0 ? 0 : dy < 0 ? wordLength - 1 : 0;
                const maxY = dy > 0 ? gridSize - wordLength : dy < 0 ? gridSize - 1 : gridSize - 1;

                if (minX > maxX || minY > maxY) {
                    attempts++;
                    continue;
                }

                const x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
                const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;

                let canPlace = true;
                for (let i = 0; i < wordLength; i++) {
                    const cx = x + i * dx;
                    const cy = y + i * dy;
                    if (cx < 0 || cx >= gridSize || cy < 0 || cy >= gridSize) {
                        canPlace = false;
                        break;
                    }
                    const cell = newGrid[cx][cy];
                    if (cell.letter !== '' && cell.letter !== word.word[i]) {
                        canPlace = false;
                        break;
                    }
                }

                if (canPlace) {
                    for (let i = 0; i < wordLength; i++) {
                        const cx = x + i * dx;
                        const cy = y + i * dy;
                        newGrid[cx][cy].letter = word.word[i];
                    }
                    placed = true;
                }
                attempts++;
            }

            if (!placed) {
                console.warn(`Could not place word: ${word.word}`);
            }
        });

        // Fill empty cells with random letters
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (newGrid[i][j].letter === '') {
                    newGrid[i][j].letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
                }
            }
        }

        setGrid(newGrid);
    }, [gridSize]);

    // Timer logic
    useEffect(() => {
        if (!isGameFinished) {
            const timer = setInterval(() => {
                setTimeElapsed((prev) => prev + 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isGameFinished]);

    // Check if game is finished
    useEffect(() => {
        if (score === words.length) {
            setIsGameFinished(true);
        }
    }, [score, words.length]);

    // Format time as MM:SS
    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Get cells in a straight line from start to end
    const getSelectedCells = (start: { x: number; y: number }, end: { x: number; y: number }): { x: number; y: number }[] => {
        const cells: { x: number; y: number }[] = [];
        const dx = end.x - start.x;
        const dy = end.y - start.y;

        if (dx === 0 && dy !== 0) { // Vertical
            const step = dy > 0 ? 1 : -1;
            for (let y = start.y; y !== end.y + step; y += step) {
                cells.push({ x: start.x, y });
            }
        } else if (dy === 0 && dx !== 0) { // Horizontal
            const step = dx > 0 ? 1 : -1;
            for (let x = start.x; x !== end.x + step; x += step) {
                cells.push({ x, y: start.y });
            }
        } else if (Math.abs(dx) === Math.abs(dy)) { // Diagonal
            const stepX = dx > 0 ? 1 : -1;
            const stepY = dy > 0 ? 1 : -1;
            let x = start.x;
            let y = start.y;
            while (x !== end.x + stepX) {
                cells.push({ x, y });
                x += stepX;
                y += stepY;
            }
        }
        return cells;
    };

    const handleCellMouseDown = (x: number, y: number) => {
        setSelectionStart({ x, y });
        setSelectionEnd({ x, y });
        setGrid((prevGrid) =>
            prevGrid.map((row, i) =>
                row.map((cell, j) => ({
                    ...cell,
                    isSelected: i === x && j === y,
                }))
            )
        );
    };

    const handleCellMouseEnter = (x: number, y: number) => {
        if (selectionStart) {
            const cells = getSelectedCells(selectionStart, { x, y });
            if (cells.length > 0) {
                setSelectionEnd({ x, y });
                setGrid((prevGrid) =>
                    prevGrid.map((row, i) =>
                        row.map((cell, j) => ({
                            ...cell,
                            isSelected: cells.some((c) => c.x === i && c.y === j),
                        }))
                    )
                );
            }
        }
    };

    const handleCellMouseUp = () => {
        if (selectionStart && selectionEnd && (selectionStart.x !== selectionEnd.x || selectionStart.y !== selectionEnd.y)) {
            const selectedCells = getSelectedCells(selectionStart, selectionEnd);
            const selectedWord = selectedCells.map((c) => grid[c.x][c.y].letter).join('');
            checkWord(selectedWord, selectedCells);
        }
        setGrid((prevGrid) =>
            prevGrid.map((row) => row.map((cell) => ({ ...cell, isSelected: false })))
        );
        setSelectionStart(null);
        setSelectionEnd(null);
    };

    const checkWord = (selectedWord: string, selectedCells: { x: number; y: number }[]) => {
        const reversedWord = selectedWord.split('').reverse().join('');
        const wordIndex = words.findIndex(
            (w) => (w.word === selectedWord || w.word === reversedWord) && !w.found
        );

        if (wordIndex !== -1) {
            playSound(); // Play sound when word is found
            setWords((prevWords) => {
                const newWords = [...prevWords];
                newWords[wordIndex] = { ...newWords[wordIndex], found: true };
                return newWords;
            });
            setScore((prev) => prev + 1);
            setGrid((prevGrid) => {
                const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));
                selectedCells.forEach(({ x, y }) => {
                    newGrid[x][y].isFound = true;
                });
                return newGrid;
            });
        }
    };


    const toggleTranslations = () => {
        setShowTranslations(!showTranslations);
    };

    const leaveGame = () => {
            router.visit(route("dashboard"));
        };

        const handleExitClick = () => {
            leaveGame();
        };

        return (
          <AuthenticatedLayout
            header={
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center w-full"
              >
                <div className="flex items-center">
                  <MdGamepad className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                  <h2 className="ml-3 font-extrabold text-2xl text-indigo-700 dark:text-indigo-300">
                    Word Search Puzzle Game
                  </h2>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="absolute top-4 right-4"
                >
                  <button
                    onClick={handleExitClick}
                    className="flex items-center justify-center p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200 shadow-md"
                    title="Exit"
                  >
                    <MdClose className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </motion.div>
              </motion.div>
            }
          >
            <Head title="Word Search Puzzle Game" />
            <div className="py-8">
              <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg sm:rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                >
                  {/* Game Stats Bar */}
                  <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow-inner">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md"
                    >
                      <FaStar className="mr-2 text-yellow-300" />
                      <span className="font-bold">{trans('word_search_puzzle.game_info.score')}: {score}/{words.length}</span>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-md"
                    >
                      <FaClock className="mr-2 text-gray-100" />
                      <span className="font-bold">{trans('word_search_puzzle.game_info.time')}: {formatTime(timeElapsed)}</span>
                    </motion.div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Puzzle Grid Container */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="lg:w-2/3 w-full"
                    >
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md mb-4">
                        <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200 border-b pb-2 border-gray-200 dark:border-gray-700">
                          {trans('word_search_puzzle.game_info.puzzle')}
                        </h3>
                        <div className="w-full overflow-auto max-h-[60vh] md:max-h-[70vh] p-2">
                          <div
                            className="grid mx-auto"
                            style={{
                              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                              maxWidth: gridSize === 10 ? '450px' : gridSize === 15 ? '540px' : '720px',
                              width: '100%',
                            }}
                          >
                            {grid.map((row, i) =>
                              row.map((cell, j) => (
                                <motion.div
                                  key={`${i}-${j}`}
                                  whileHover={{ scale: 1.1 }}
                                  className={`
                                    border border-gray-200 dark:border-gray-700
                                    flex items-center justify-center
                                    text-sm font-bold
                                    select-none cursor-pointer
                                    transition-all duration-150
                                    ${cell.isSelected ? 'bg-blue-200 dark:bg-blue-800 shadow-md' : 'bg-gray-50 dark:bg-gray-800'}
                                    ${cell.isFound ? 'bg-green-200 dark:bg-green-800 shadow-md' : ''}
                                    ${getCellSizeClass()}
                                  `}
                                  onMouseDown={() => handleCellMouseDown(i, j)}
                                  onMouseEnter={() => handleCellMouseEnter(i, j)}
                                  onMouseUp={handleCellMouseUp}
                                >
                                  {cell.letter}
                                </motion.div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Word Lists */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="lg:w-1/3 w-full"
                    >
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md mb-4">
                        <div className="flex justify-between items-center border-b pb-2 border-gray-200 dark:border-gray-700 mb-4">
                          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                            {trans('word_search_puzzle.game_info.words')}
                          </h3>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleTranslations}
                            className="flex items-center gap-2 px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-colors text-sm shadow-md"
                          >
                            {showTranslations ? <FaEyeSlash className="w-3 h-3" /> : <FaEye className="w-3 h-3" />}
                            {showTranslations ? trans('word_search_puzzle.game_info.hide_translation') : trans('word_search_puzzle.game_info.show_translation')}
                          </motion.button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <h4 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">
                              {trans('word_search_puzzle.game_info.translation')}
                            </h4>
                            <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                              {words.map((word) => (
                                <motion.div
                                  key={`translation-${word.id}`}
                                  whileHover={{ x: 3 }}
                                  className={`p-2 rounded-md ${
                                    word.found
                                      ? 'line-through bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  {word.translation}
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          <AnimatePresence>
                            {showTranslations && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                              >
                                <h4 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">
                                  {trans('word_search_puzzle.game_info.words')}
                                </h4>
                                <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                                  {words.map((word) => (
                                    <motion.div
                                      key={`word-${word.id}`}
                                      whileHover={{ x: 3 }}
                                      className={`p-2 rounded-md ${
                                        word.found
                                          ? 'line-through bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                          : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                      }`}
                                    >
                                      {word.word}
                                    </motion.div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Completion Message */}
                  <AnimatePresence>
                    {isGameFinished && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mt-6 text-center p-6 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg shadow-lg"
                      >
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 10, 0] }}
                          transition={{ duration: 0.5, repeat: 3 }}
                          className="text-2xl font-bold text-white flex items-center justify-center"
                        >
                          <FaTrophy className="mr-3 text-yellow-300 text-4xl" />
                          <div>
                            <div>{trans('word_search_puzzle.game_info.congratulations')}!</div>
                            <div className="text-lg font-normal mt-1">Time: {formatTime(timeElapsed)}</div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </AuthenticatedLayout>
        );
    };
