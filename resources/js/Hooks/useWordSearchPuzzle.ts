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
}

export const useWordSearchPuzzle = ({ initialWords, gridSize, onWordFound }: UseWordSearchPuzzleProps) => {
    const [words, setWords] = useState<Word[]>(
        initialWords.map(word => ({
            ...word,
            found: false
        }))
    );

    const [grid, setGrid] = useState<GridCell[][]>([]);
    const [isGridInitialized, setIsGridInitialized] = useState(false);
    const [score, setScore] = useState(0);

    const generateGrid = (words: Word[], gridSize: number): GridCell[][] => {
        const newGrid: GridCell[][] = Array(gridSize).fill(null).map(() =>
            Array(gridSize).fill(null).map(() => ({
                letter: '',
                isSelected: false,
                isFound: false,
            }))
        );

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

        words.forEach((word) => {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100;

            while (!placed && attempts < maxAttempts) {
                attempts++;
                const direction = directions[Math.floor(Math.random() * directions.length)];
                const wordLength = word.word.length;

                const startX = Math.floor(Math.random() * (gridSize - Math.abs(direction.dx * (wordLength - 1))));
                const startY = Math.floor(Math.random() * (gridSize - Math.abs(direction.dy * (wordLength - 1))));

                let canPlace = true;
                const positions: { x: number; y: number; letter: string }[] = [];

                for (let i = 0; i < wordLength; i++) {
                    const x = startX + (direction.dx * i);
                    const y = startY + (direction.dy * i);

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

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (newGrid[i][j].letter === '') {
                    newGrid[i][j].letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
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
        const reversedWord = selectedWord.split('').reverse().join('');
        const wordIndex = words.findIndex(
            (w) => (w.word === selectedWord || w.word === reversedWord) && !w.found
        );

        if (wordIndex !== -1) {
            // Call onWordFound with the found word and cells
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
                        isSelected: false
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
        generateGrid, // Export the function as part of the hook
    };
};
