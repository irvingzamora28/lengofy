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
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-white text-sm font-semibold ${statusColors[status as keyof typeof statusColors]} transition-all duration-300 ease-in-out transform hover:scale-105`}>
                {gameStatusIcon(status)}
                <span>{status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}</span>
            </div>
        </div>
    );
}