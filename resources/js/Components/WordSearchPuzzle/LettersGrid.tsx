import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface GridCell {
    letter: string;
    isSelected: boolean;
    isFound: boolean;
}

interface LettersGridProps {
    grid: GridCell[][];
    gridSize: number;
    getCellSizeClass: () => string;
    onWordSelected: (selectedWord: string, selectedCells: { x: number; y: number }[]) => void;
}

export default function LettersGrid({
    grid,
    gridSize,
    getCellSizeClass,
    onWordSelected
}: LettersGridProps) {
    const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
    const [selectedCells, setSelectedCells] = useState<{ x: number; y: number }[]>([]);
    const [isMobileSelection, setIsMobileSelection] = useState(false);

    // Add a function to detect if we're on mobile
    const isMobileDevice = () => {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    };

    const getSelectedCells = (start: { x: number; y: number }, end: { x: number; y: number }): { x: number; y: number }[] => {
        const cells: { x: number; y: number }[] = [];
        const dx = end.x - start.x;
        const dy = end.y - start.y;

        // Determine the direction (horizontal, vertical, or diagonal)
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

    const handleCellClick = (x: number, y: number) => {
        if (!isMobileDevice()) return;

        if (!selectionStart) {
            // First tap - set start point
            setSelectionStart({ x, y });
            setSelectedCells([{ x, y }]);
            setIsMobileSelection(true);
        } else {
            // Second tap - complete the selection
            const cells = getSelectedCells(selectionStart, { x, y });
            if (cells.length > 0) {
                const word = cells
                    .map(cell => grid[cell.x][cell.y].letter)
                    .join('');
                onWordSelected(word, cells);
            }
            // Reset selection
            setSelectionStart(null);
            setSelectedCells([]);
            setIsMobileSelection(false);
        }
    };

    // Keep existing mouse handlers for desktop
    const handleCellMouseDown = (x: number, y: number) => {
        if (isMobileDevice()) return;
        setSelectionStart({ x, y });
        setSelectedCells([{ x, y }]);
    };

    const handleCellMouseEnter = (x: number, y: number) => {
        if (isMobileDevice() || !selectionStart) return;
        const cells = getSelectedCells(selectionStart, { x, y });
        if (cells.length > 0) {
            setSelectedCells(cells);
        }
    };

    const handleCellMouseUp = () => {
        if (isMobileDevice() || !selectionStart) return;
        if (selectedCells.length > 1) {
            const word = selectedCells
                .map(cell => grid[cell.x][cell.y].letter)
                .join('');
            onWordSelected(word, selectedCells);
        }
        setSelectionStart(null);
        setSelectedCells([]);
    };

    useEffect(() => {
        // Only prevent default touch behavior when touching the grid itself
        const handleTouchMove = (e: TouchEvent) => {
            // Check if the touch is within the grid
            const target = e.target as HTMLElement;
            if (target.closest('[data-cell-coords]')) {
                e.preventDefault();
            }
        };

        document.addEventListener('touchmove', handleTouchMove, { passive: false });

        return () => {
            document.removeEventListener('touchmove', handleTouchMove);
        };
    }, []);

    return (
        <div className="w-full overflow-auto max-h-[60vh] md:max-h-[80vh] p-2">
            <div
                className="grid mx-auto"
                style={{
                    gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                    maxWidth: gridSize === 10 ? '400px' : gridSize === 15 ? '540px' : '720px',
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
                                text-slate-700 dark:text-slate-200
                                select-none cursor-pointer
                                transition-all duration-150
                                ${selectedCells.some(c => c.x === i && c.y === j) ? 'bg-blue-200 dark:bg-blue-800 shadow-md' : 'bg-gray-50 dark:bg-gray-800'}
                                ${cell.isFound ? 'bg-green-200 dark:bg-green-800 shadow-md' : ''}
                                ${isMobileSelection && selectionStart?.x === i && selectionStart?.y === j ? 'ring-2 ring-blue-500' : ''}
                                ${getCellSizeClass()}
                            `}
                            onClick={() => handleCellClick(i, j)}
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
    );
}
