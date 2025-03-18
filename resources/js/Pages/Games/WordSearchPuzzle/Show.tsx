import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GameBoard from '@/Components/Games/WordSearchPuzzle/GameBoard';
import PlayerList from '@/Components/Games/WordSearchPuzzle/PlayerList';
import WordList from '@/Components/Games/WordSearchPuzzle/WordList';
import Timer from '@/Components/Games/Timer';
import { useWebSocket } from '@/Hooks/useWebSocket';
import { WordSearchPuzzleGame, WordSearchPuzzleGameState } from '@/types/games';

interface Props {
    game: WordSearchPuzzleGame;
    isHost: boolean;
    currentPlayer: any;
}

export default function Show({ game, isHost, currentPlayer }: Props) {
    const { t } = useTranslation();
    const [gameState, setGameState] = useState<WordSearchPuzzleGameState | null>(null);
    const [inputWord, setInputWord] = useState('');
    const ws = useWebSocket();

    useEffect(() => {
        if (ws) {
            ws.send(JSON.stringify({
                type: 'join_word_search_puzzle_game',
                gameId: game.id,
                userId: currentPlayer.id,
                gameType: 'word_search_puzzle',
                data: {
                    player_id: currentPlayer.id,
                    language_name: game.language_name,
                    max_players: game.max_players,
                }
            }));
        }
    }, [ws, game.id]);

    const handleSubmitWord = () => {
        if (!inputWord.trim()) return;

        ws?.send(JSON.stringify({
            type: 'submit_word',
            gameId: game.id,
            userId: currentPlayer.id,
            data: { word: inputWord.trim() }
        }));

        setInputWord('');
    };

    const handleReady = () => {
        ws?.send(JSON.stringify({
            type: 'player_ready',
            gameId: game.id,
            userId: currentPlayer.id
        }));
    };

    return (
        <AuthenticatedLayout>
            <Head title={t('games.word_search_puzzle.game_title')} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 shadow-xl sm:rounded-lg p-6">
                        {gameState?.status === 'in_progress' && (
                            <Timer
                                startTime={gameState.round_start_time}
                                duration={gameState.round_time}
                            />
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <GameBoard
                                    letters={gameState?.current_letters || []}
                                    onSubmit={handleSubmitWord}
                                    inputWord={inputWord}
                                    setInputWord={setInputWord}
                                    disabled={gameState?.status !== 'in_progress'}
                                />
                            </div>

                            <div>
                                <PlayerList
                                    players={gameState?.players || []}
                                    currentPlayerId={currentPlayer.id}
                                    onReady={handleReady}
                                    gameStatus={gameState?.status}
                                />
                                <WordList
                                    words={Array.from(gameState?.words_found.get(currentPlayer.id) || [])}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
