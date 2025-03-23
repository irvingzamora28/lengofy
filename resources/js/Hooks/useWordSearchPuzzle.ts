import { useState, useEffect } from 'react';

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

interface UseWordSearchPuzzleProps {
    initialWords: {
        id: number;
        word: string;
        translation: string;
    }[];
    gridSize: number;
    onWordFound?: (word: string, cells: { x: number; y: number }[]) => void;
    seed?: string; // Optional seed parameter
}

// A simple hash function to convert a string seed to a numeric seed
const hashSeed = (seed: string): number => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

// Custom seeded random generator using a Linear Congruential Generator (LCG)
const createSeededRandom = (seed: number): (() => number) => {
    let state = seed;
    const m = 2147483648; // 2^31
    const a = 1103515245;
    const c = 12345;
    return function () {
        state = (a * state + c) % m;
        return state / m;
    };
};

export const useWordSearchPuzzle = ({
    initialWords,
    gridSize,
    onWordFound,
    seed,
}: UseWordSearchPuzzleProps) => {
    const [words, setWords] = useState<Word[]>(
        initialWords.map(word => ({
            ...word,
            found: false,
        }))
    );
    const [grid, setGrid] = useState<GridCell[][]>([]);
    const [isGridInitialized, setIsGridInitialized] = useState(false);
    const [score, setScore] = useState(0);

    // Modified to preserve found state
    const updateWordsAndReset = (newWords: typeof initialWords) => {
        setWords(newWords.map(word => ({ ...word, found: false })));
    };

    const generateGrid = (words: Word[], gridSize: number): GridCell[][] => {
        // Initialize a new random generator on every grid generation
        const rng = seed ? createSeededRandom(hashSeed(seed)) : Math.random;

        const newGrid: GridCell[][] = Array.from({ length: gridSize }, () =>
            Array.from({ length: gridSize }, () => ({
                letter: '',
                isSelected: false,
                isFound: false,
            }))
        );

        const directions = [
            { dx: 0, dy: 1 },   // right
            { dx: 0, dy: -1 },  // left
            { dx: 1, dy: 0 },   // down
            { dx: -1, dy: 0 },  // up
            { dx: 1, dy: 1 },   // diagonal right-down
            { dx: 1, dy: -1 },  // diagonal right-up
            { dx: -1, dy: 1 },  // diagonal left-down
            { dx: -1, dy: -1 }, // diagonal left-up
        ];

        words.forEach((word) => {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100;
            const wordLength = word.word.length;

            while (!placed && attempts < maxAttempts) {
                attempts++;
                const direction = directions[Math.floor(rng() * directions.length)];

                // Calculate a valid starting position based on direction and word length
                const startX = Math.floor(rng() * (gridSize - Math.abs(direction.dx) * (wordLength - 1)));
                const startY = Math.floor(rng() * (gridSize - Math.abs(direction.dy) * (wordLength - 1)));

                let canPlace = true;
                const positions: { x: number; y: number; letter: string }[] = [];

                for (let i = 0; i < wordLength; i++) {
                    const x = startX + direction.dx * i;
                    const y = startY + direction.dy * i;

                    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) {
                        canPlace = false;
                        break;
                    }

                    if (newGrid[x][y].letter !== '' && newGrid[x][y].letter !== word.word[i]) {
                        canPlace = false;
                        break;
                    }

                    positions.push({ x, y, letter: word.word[i] });
                }

                if (canPlace) {
                    positions.forEach(({ x, y, letter }) => {
                        newGrid[x][y].letter = letter;
                    });
                    placed = true;
                }
            }

            if (!placed) {
                console.warn(`Could not place word: ${word.word}`);
            }
        });

        // Fill remaining empty cells with random letters
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (newGrid[i][j].letter === '') {
                    newGrid[i][j].letter = String.fromCharCode(65 + Math.floor(rng() * 26));
                }
            }
        }

        return newGrid;
    };

    useEffect(() => {
        if (isGridInitialized || !words.length) return;

        const newGrid = generateGrid(words, gridSize);
        setGrid(newGrid);
        setIsGridInitialized(true);
    }, [isGridInitialized, words.length, gridSize]);

    const handleWordSelected = (selectedWord: string, selectedCells: { x: number; y: number }[]) => {
        console.log('Word selected:', selectedWord);
        console.log("Words: ", words);

        const reversedWord = selectedWord.split('').reverse().join('');
        const wordIndex = words.findIndex(
            (w) => (w.word === selectedWord || w.word === reversedWord) && !w.found
        );

        if (wordIndex !== -1) {
            console.log('Word found:', words[wordIndex].word, selectedCells);
            onWordFound?.(words[wordIndex].word, selectedCells);

            setWords(prevWords => {
                const newWords = [...prevWords];
                newWords[wordIndex] = { ...newWords[wordIndex], found: true };
                return newWords;
            });

            setScore(prev => prev + 1);

            setGrid(prevGrid => {
                const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
                selectedCells.forEach(({ x, y }) => {
                    newGrid[x][y] = {
                        ...newGrid[x][y],
                        isFound: true,
                        isSelected: false,
                    };
                });
                return newGrid;
            });
        }
    };

    return {
        grid,
        words,
        score,
        handleWordSelected,
        generateGrid, // Exported for potential re-generation
        updateWordsAndReset,
    };
};
