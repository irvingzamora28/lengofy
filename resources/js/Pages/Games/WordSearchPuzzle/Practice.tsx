import { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { FaClock, FaTrophy } from 'react-icons/fa';

interface Props {
    difficulty: 'easy' | 'medium' | 'hard';
    category: number;
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

export default function WordSearchPuzzlePractice({ difficulty, category }: Props) {
    const { t: trans } = useTranslation();

    // Grid size based on difficulty
    const gridSize = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 30;

    // Dynamic cell size based on grid size for better design
    const cellSizeClass = useMemo(() => {
        switch (gridSize) {
            case 10: return 'h-10 w-10'; // 40px for 10x10
            case 15: return 'h-9 w-9';   // 36px for 15x15
            default: return 'h-6 w-6';   // 24px for 30x30
        }
    }, [gridSize]);

    const [words, setWords] = useState<Word[]>([
        { id: 1, word: 'CASA', translation: 'HOUSE', found: false },
        { id: 2, word: 'COCHE', translation: 'CAR', found: false },
        { id: 3, word: 'PERRO', translation: 'DOG', found: false },
        { id: 4, word: 'GATO', translation: 'CAT', found: false },
        { id: 5, word: 'LIBRO', translation: 'BOOK', found: false },
    ]);

    const [grid, setGrid] = useState<GridCell[][]>([]);
    const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
    const [score, setScore] = useState(0);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isGameFinished, setIsGameFinished] = useState(false);

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
    }, [gridSize, words]);

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

    // Memoize grid rendering to prevent unnecessary re-renders
    const memoizedGrid = useMemo(() => {
        return grid.map((row, i) =>
            row.map((cell, j) => (
                <div
                    key={`${i}-${j}`}
                    className={`
                        border border-gray-200 dark:border-gray-700
                        flex items-center justify-center
                        text-sm font-medium
                        select-none cursor-pointer
                        transition-colors duration-150
                        hover:bg-gray-100 dark:hover:bg-gray-700
                        ${cell.isSelected ? 'bg-blue-200 dark:bg-blue-800' : ''}
                        ${cell.isFound ? 'bg-green-200 dark:bg-green-800' : ''}
                        ${cellSizeClass}
                    `}
                    onMouseDown={() => handleCellMouseDown(i, j)}
                    onMouseEnter={() => handleCellMouseEnter(i, j)}
                    onMouseUp={handleCellMouseUp}
                >
                    {cell.letter}
                </div>
            ))
        );
    }, [grid, cellSizeClass]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                    {trans('word_search_puzzle.practice_mode')}
                </h2>
            }
        >
            <Head title={trans('word_search_puzzle.practice_mode')} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        {/* Score and Timer */}
                        <div className="mb-6 flex items-center justify-between">
                            <div className="text-lg font-medium text-gray-800 dark:text-gray-200">
                                {trans('word_search_puzzle.score')}: {score}/{words.length}
                            </div>
                            <div className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
                                <FaClock className="mr-2 text-blue-500" />
                                Time: {formatTime(timeElapsed)}
                            </div>
                        </div>

                        {/* Responsive Grid Container */}
                        <div className="w-full max-w-full overflow-auto md:max-h-[80vh] sm:max-h-[60vh]">
                            <div
                                className="grid gap-0 mx-auto"
                                style={{
                                    gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                                    maxWidth: gridSize === 10 ? '400px' : gridSize === 15 ? '540px' : '720px', // Adjusted max-width
                                    width: '100%',
                                }}
                            >
                                {memoizedGrid}
                            </div>
                        </div>

                        {/* Word List */}
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                                    Spanish
                                </h3>
                                {words.map((word) => (
                                    <div
                                        key={`word-${word.id}`}
                                        className={`p-2 ${
                                            word.found
                                                ? 'line-through text-green-600 dark:text-green-400'
                                                : 'text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        {word.word}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                                    English
                                </h3>
                                {words.map((word) => (
                                    <div
                                        key={`translation-${word.id}`}
                                        className={`p-2 ${
                                            word.found
                                                ? 'line-through text-green-600 dark:text-green-400'
                                                : 'text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        {word.translation}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Completion Message */}
                        {isGameFinished && (
                            <div className="mt-6 text-center text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-center">
                                <FaTrophy className="mr-2 text-yellow-500" />
                                {trans('word_search_puzzle.congratulations')} You found all the words in{' '}
                                {formatTime(timeElapsed)}!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
