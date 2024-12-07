import { FaHourglassHalf, FaPlay, FaFlagCheckered } from 'react-icons/fa';

interface GameInfoProps {
    languageName: string;
    currentRound?: number;
    totalRounds?: number;
    status: string;
}

const gameStatusIcon = (status: string) => {
    switch(status) {
        case 'waiting':
            return <FaHourglassHalf className="inline-block mr-1" />;
        case 'in_progress':
            return <FaPlay className="inline-block mr-1" />;
        case 'completed':
            return <FaFlagCheckered className="inline-block mr-1" />;
        default:
            return null;
    }
};

export default function GameInfo({ languageName, currentRound, totalRounds, status }: GameInfoProps) {
    return (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
            <div className="flex items-center space-x-2">
                <span className="font-medium">{languageName}</span>
                {status === 'in_progress' && (
                    <span className="text-xs opacity-75">
                        Round {currentRound}/{totalRounds}
                    </span>
                )}
            </div>
            <div className="inline-flex items-center px-2 py-1 rounded-full text-white text-xs font-semibold bg-gray-400 dark:bg-gray-700">
                {gameStatusIcon(status)}
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </div>
        </div>
    );
}
