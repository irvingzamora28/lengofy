import { MemoryTranslationGame, MemoryTranslationGamePlayer } from '@/types';
import { useTranslation } from 'react-i18next';

interface Props {
    game: MemoryTranslationGame;
    currentPlayer: MemoryTranslationGamePlayer | undefined;
}

export default function GameInfo({ game, currentPlayer }: Props) {
    const { t: trans } = useTranslation();

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-wrap justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md">
            <div className="flex flex-col mb-4 sm:mb-0">
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {trans('memory_translation.game_info.status')}: {trans(`memory_translation.status.${game.status}`)}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {trans('memory_translation.game_info.difficulty')}: {trans(`generals.${game.difficulty}`)}
                </span>
            </div>
            {currentPlayer && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-6">
                    <div className="flex flex-col items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{trans('memory_translation.game_info.moves')}</span>
                        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{currentPlayer.moves}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{trans('memory_translation.game_info.time')}</span>
                        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatTime(currentPlayer.time)}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{trans('memory_translation.game_info.score')}</span>
                        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{currentPlayer.score}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
