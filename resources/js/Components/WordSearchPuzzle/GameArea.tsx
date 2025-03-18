import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { WordSearchPuzzleGame } from '@/types/games';

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
    getCellSizeClass
}: GameAreaProps) {
    const { t: trans } = useTranslation();

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

    if (game.status === 'finished') {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4">{trans('word_search_puzzle.game_finished')}</h3>
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

    return (
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md">
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
                    {game.grid.map((row, i) =>
                        row.map((letter, j) => (
                            <motion.div
                                key={`${i}-${j}`}
                                whileHover={{ scale: 1.1 }}
                                className={`
                                    border border-gray-200 dark:border-gray-700
                                    flex items-center justify-center
                                    text-sm font-bold
                                    select-none cursor-pointer
                                    transition-all duration-150
                                    ${selectedCells.some(cell => cell.x === i && cell.y === j) ? 'bg-blue-200 dark:bg-blue-800 shadow-md' : 'bg-gray-50 dark:bg-gray-800'}
                                    ${getCellSizeClass()}
                                `}
                                onMouseDown={() => handleCellMouseDown(i, j)}
                                onMouseEnter={() => handleCellMouseEnter(i, j)}
                                onMouseUp={handleCellMouseUp}
                            >
                                {letter}
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
