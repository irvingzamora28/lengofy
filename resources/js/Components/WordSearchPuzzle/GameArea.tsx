import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import  { WordSearchPuzzleGame } from '@/types';
import LettersGrid from './LettersGrid';
import WordList from './WordList';

interface GameAreaProps {
    game: WordSearchPuzzleGame;
    selectedCells: { x: number; y: number }[];
    isCurrentPlayerReady: boolean;
    onReady: () => void;
    currentUserId: number;
    onRestart: () => void;
    handleCellMouseDown: (i: number, j: number) => void;
    handleCellMouseEnter: (i: number, j: number) => void;
    handleCellMouseUp: () => void;
    gridSize: number;
    onWordSelected: (selectedWord: string, selectedCells: { x: number; y: number }[]) => void
    getCellSizeClass: () => string;
}

export default function GameArea({
    game,
    selectedCells,
    isCurrentPlayerReady,
    onReady,
    currentUserId,
    onRestart,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleCellMouseUp,
    gridSize,
    getCellSizeClass,
    onWordSelected,
}: GameAreaProps) {
    const { t: trans } = useTranslation();

    // Add console.log to debug grid data
    console.log('Game grid:', game.grid);
    console.log('Grid size:', gridSize);

    if (game.status === 'waiting') {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4">{trans('word_search_puzzle.waiting_for_players')}</h3>
                {!isCurrentPlayerReady && (
                    <button
                        onClick={onReady}
                        className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                        {trans('generals.ready')}
                    </button>
                )}
            </div>
        );
    }

    if (game.status === 'completed') {
        const winner = game.players.reduce((prev, current) =>
            (prev.score > current.score) ? prev : current
        );

        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4">
                    {winner.user_id === currentUserId
                        ? trans('word_search_puzzle.you_won')
                        : trans('word_search_puzzle.winner_is', { name: winner.player_name })}
                </h3>
                {game.hostId === currentUserId && (
                    <button
                        onClick={onRestart}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        {trans('generals.restart_game')}
                    </button>
                )}
            </div>
        );
    }

    // Modified grid data formatting
    const gridData = Array.isArray(game.grid) ? game.grid.map((row, i) =>
        Array.isArray(row) ? row.map((cell, j) => {
            // If cell is already an object with letter property, return it
            if (typeof cell === 'object' && cell !== null && 'letter' in cell) {
                return {
                    ...cell,
                    isSelected: selectedCells.some(sc => sc.x === i && sc.y === j),
                };
            }
            // If cell is a string or other type, convert to proper format
            return {
                letter: String(cell || ''),
                isSelected: selectedCells.some(sc => sc.x === i && sc.y === j),
                isFound: false
            };
        }) : []
    ) : [];

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-2/3 w-full">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md touch-pan-y">
                    <LettersGrid
                        grid={gridData}
                        gridSize={gridSize}
                        getCellSizeClass={getCellSizeClass}
                        onWordSelected={onWordSelected}
                    />
                </div>
            </div>
            <div className="lg:w-1/3 w-full">
                <WordList
                    words={game.words}
                />
            </div>
        </div>
    );
}
