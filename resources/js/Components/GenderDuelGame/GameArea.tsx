import { AiOutlineCheckCircle, AiOutlineCloseCircle } from 'react-icons/ai';
import PrimaryButton from '@/Components/PrimaryButton';

interface GameAreaProps {
    status: string;
    currentWord?: {
        word: string;
    };
    currentRound?: number;
    totalRounds?: number;
    lastAnswer: any;
    feedbackMessage: string;
    onAnswer: (answer: string) => void;
    onReady: () => void;
    isCurrentPlayerReady: boolean;
    players: any[];
}

const renderLastAnswer = (lastAnswer: any) => {
    if (!lastAnswer) return null;
    return (
        <div className={`mt-4 flex items-center justify-center gap-2 text-lg font-bold ${
            lastAnswer.correct ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'
        }`}>
            {lastAnswer.correct ? <AiOutlineCheckCircle size={24}/> : <AiOutlineCloseCircle size={24}/>}
            <strong>{lastAnswer.player_name}</strong> {lastAnswer.correct ? 'got it right!' : 'was incorrect'}
        </div>
    );
};

export default function GameArea({ 
    status, 
    currentWord, 
    lastAnswer, 
    feedbackMessage, 
    onAnswer,
    onReady,
    isCurrentPlayerReady,
    players
}: GameAreaProps) {
    return (
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-6 shadow-lg transition-colors h-full flex flex-col items-center justify-center">
            {status === 'waiting' ? (
                <>
                    <div className="text-center text-gray-600 dark:text-gray-300">
                        Waiting for all players to be ready...
                    </div>
                    {!isCurrentPlayerReady && (
                        <div className="text-center mb-6">
                            <PrimaryButton
                                onClick={onReady}
                                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 px-4 py-2 text-sm font-semibold"
                            >
                                Ready to Start
                            </PrimaryButton>
                        </div>
                    )}
                </>
            ) : status === 'in_progress' && currentWord ? (
                <div className="text-center w-full">
                    <h1 className="text-4xl md:text-6xl lg:text-9xl font-extrabold text-gray-900 dark:text-gray-100 mb-8 transition-all">
                        {currentWord.word}
                    </h1>

                    <div className="flex flex-col sm:flex-row justify-center gap-8 mb-4">
                        {['der', 'die', 'das'].map((g) => (
                            <button
                                key={g}
                                type="button"
                                className="inline-flex items-center justify-center
                                px-6 py-6 md:px-8 md:py-4
                                text-2xl md:text-4xl lg:text-6xl font-bold uppercase tracking-wide
                                rounded-lg shadow-lg
                                bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600
                                active:scale-95 transition transform w-full sm:w-auto"
                                onClick={() => onAnswer(g)}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                    {renderLastAnswer(lastAnswer)}
                    {feedbackMessage && (
                        <div className="text-lg text-gray-700 dark:text-gray-200 mt-4 font-medium">
                            {feedbackMessage}
                        </div>
                    )}
                </div>
            ) : status === 'completed' ? (
                <div className="text-center">
                    <h3 className="text-2xl mb-4 font-extrabold text-purple-600 dark:text-purple-300">🎉 Game Over! 🎉</h3>
                    {feedbackMessage && (
                        <div className="text-lg text-gray-700 dark:text-gray-200 mb-6 font-medium">
                            {feedbackMessage}
                        </div>
                    )}
                    <div className="space-y-2 text-base text-gray-700 dark:text-gray-200">
                        {players
                            .sort((a, b) => b.score - a.score)
                            .map((player, index) => (
                                <div key={player.id} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 pb-2">
                                    <span className="font-medium">
                                        {index + 1}. {player.player_name}
                                    </span>
                                    <span>{player.score} pts</span>
                                </div>
                            ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
