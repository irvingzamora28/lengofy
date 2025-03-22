import { useState } from 'react';
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
    // Add debug logging
    console.log('LettersGrid received grid:', grid);
    console.log('LettersGrid received gridSize:', gridSize);

    const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
    const [selectedCells, setSelectedCells] = useState<{ x: number; y: number }[]>([]);

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
        setSelectedCells([{ x, y }]);
    };

    const handleCellMouseEnter = (x: number, y: number) => {
        if (selectionStart) {
            const cells = getSelectedCells(selectionStart, { x, y });
            if (cells.length > 0) {
                setSelectionEnd({ x, y });
                setSelectedCells(cells);
            }
        }
    };

    const handleCellMouseUp = () => {
        if (selectionStart && selectionEnd && selectedCells.length > 1) {
            const word = selectedCells
                .map(cell => grid[cell.x][cell.y].letter)
                .join('');
            onWordSelected(word, selectedCells);
        }
        setSelectionStart(null);
        setSelectionEnd(null);
        setSelectedCells([]);
    };

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
                                ${getCellSizeClass()}
                            `}
                            onMouseDown={() => handleCellMouseDown(i, j)}
                            onMouseEnter={() => handleCellMouseEnter(i, j)}
                            onMouseUp={handleCellMouseUp}
                            onTouchStart={() => handleCellMouseDown(i, j)}
                            onTouchMove={(e) => {
                                e.preventDefault();
                                const touch = e.touches[0];
                                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                                const cellElement = element?.closest('[data-cell-coords]');
                                if (cellElement) {
                                    const [x, y] = (cellElement as HTMLElement).dataset.cellCoords!.split(',').map(Number);
                                    handleCellMouseEnter(x, y);
                                }
                            }}
                            onTouchEnd={handleCellMouseUp}
                            data-cell-coords={`${i},${j}`}
                        >
                            {cell.letter}
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
