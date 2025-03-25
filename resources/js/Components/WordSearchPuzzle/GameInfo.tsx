import { WordSearchPuzzleGame } from '@/types';
import { useTranslation } from 'react-i18next';
import { FaFlagCheckered, FaHourglassHalf, FaPlay } from 'react-icons/fa';

interface GameInfoProps {
    game: WordSearchPuzzleGame;
    currentPlayer: any;
}

const gameStatusIcon = (status: string) => {
    switch(status) {
        case 'waiting':
            return <FaHourglassHalf className="animate-pulse" />;
        case 'in_progress':
            return <FaPlay className="animate-bounce" />;
        case 'completed':
            return <FaFlagCheckered className="animate-wave" />;
        default:
            return null;
    }
};

const statusColors = {
    waiting: 'bg-yellow-400 dark:bg-yellow-600',
    in_progress: 'bg-green-500 dark:bg-green-600',
    completed: 'bg-blue-500 dark:bg-blue-600'
};


export default function GameInfo({ game, currentPlayer }: GameInfoProps) {
    const { t: trans } = useTranslation();

    return (
        <div className="hidden md:flex flex-wrap justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md">
        <div className="flex flex-col mb-4 sm:mb-0">
        <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-white text-sm font-semibold ${statusColors[game.status as keyof typeof statusColors]} transition-all duration-300 ease-in-out transform hover:scale-105`}>
                {gameStatusIcon(game.status)}
                <span>{trans(`word_search_puzzle.status.${game.status}`)}</span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
                {trans('word_search_puzzle.game_info.difficulty')}: {trans(`generals.${game.difficulty}`)}
            </span>
        </div>
        {currentPlayer && (
            <div className="flex flex-wrap justify-center sm:justify-start gap-6">
                <div className="flex flex-col items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{trans('word_search_puzzle.game_info.score')}</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{currentPlayer.score}</span>
                </div>
            </div>
        )}
    </div>
    );
}
