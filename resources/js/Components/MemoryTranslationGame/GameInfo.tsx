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
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col">
                <span className="text-lg font-semibold">
                    {trans('memory_translation.game_info.status')}: {trans(`memory_translation.status.${game.status}`)}
                </span>
                <span className="text-sm text-gray-600">
                    {trans('memory_translation.game_info.difficulty')}: {trans(`generals.${game.difficulty}`)}
                </span>
            </div>
            {currentPlayer && (
                <div className="flex space-x-6">
                    <div className="flex flex-col items-center">
                        <span className="text-sm text-gray-600">{trans('memory_translation.game_info.moves')}</span>
                        <span className="text-lg font-semibold">{currentPlayer.moves}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-sm text-gray-600">{trans('memory_translation.game_info.time')}</span>
                        <span className="text-lg font-semibold">{formatTime(currentPlayer.time)}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-sm text-gray-600">{trans('memory_translation.game_info.score')}</span>
                        <span className="text-lg font-semibold">{currentPlayer.score}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
