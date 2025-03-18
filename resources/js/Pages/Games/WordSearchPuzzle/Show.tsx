import { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GameBoard from '@/Components/Games/WordSearchPuzzle/GameBoard';
import PlayerList from '@/Components/Games/WordSearchPuzzle/PlayerList';
import WordList from '@/Components/Games/WordSearchPuzzle/WordList';
import CircularTimer from '@/Components/Games/CircularTimer';
import { WordSearchPuzzleGame, WordSearchPuzzleGameState } from '@/types/games';
import toast from 'react-hot-toast';
import ConfirmationExitModal from '@/Components/Games/ConfirmationExitModal';

interface Props {
    auth: any;
    word_search_puzzle_game: WordSearchPuzzleGame;
    wsEndpoint: string;
    justCreated: boolean;
}

export default function Show({ auth, word_search_puzzle_game, wsEndpoint, justCreated }: Props) {
    // Initialize the game state with a proper Map for words_found
    const [gameState, setGameState] = useState({
        ...word_search_puzzle_game,
        words_found: new Map(
            word_search_puzzle_game.words_found
            ? Object.entries(word_search_puzzle_game.words_found)
            : [[auth.user.id, new Set()]]
        )
    });
    const [inputWord, setInputWord] = useState('');
    const wsRef = useRef<WebSocket | null>(null);
    const [showExitConfirmation, setShowExitConfirmation] = useState(false);
    const { t: trans } = useTranslation();

    const currentPlayer = gameState.players.find(player => player.user_id === auth.user.id);

    useEffect(() => {
        const ws = new WebSocket(wsEndpoint);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('Connected to Word Search Puzzle game WebSocket');

            // Join the game room
            ws.send(JSON.stringify({
                type: 'join_word_search_puzzle_game',
                gameId: word_search_puzzle_game.id,
                userId: auth.user.id,
                gameType: 'word_search_puzzle',
                data: {
                    player_id: currentPlayer?.id,
                    language_name: word_search_puzzle_game.language_name,
                    max_players: word_search_puzzle_game.max_players,
                }
            }));

            // If this is a newly created game, broadcast it to the lobby
            if (justCreated) {
                console.log('Broadcasting new word search puzzle game to lobby');
                ws.send(JSON.stringify({
                    type: 'word_search_puzzle_game_created',
                    gameId: word_search_puzzle_game.id,
                    game: word_search_puzzle_game
                }));
            }

            // For practice games, mark player as ready immediately
            if (word_search_puzzle_game.max_players === 1) {
                ws.send(JSON.stringify({
                    type: 'player_ready',
                    gameId: gameState.id,
                    gameType: 'word_search_puzzle',
                    userId: auth.user.id,
                    data: {
                        player_id: currentPlayer?.id,
                        user_id: auth.user.id
                    }
                }));
            }
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received game message:', data.type);

            switch (data.type) {
                case 'player_ready':
                    setGameState(prev => ({
                        ...prev,
                        players: prev.players.map(player =>
                            player.id === data.data.player_id || player.user_id === data.data.user_id
                                ? { ...player, is_ready: true }
                                : player
                        )
                    }));
                    break;

                case 'word_search_puzzle_word_found':
                    if (data.userId !== auth.user.id) {
                        // Update word list for other players
                        setGameState(prev => ({
                            ...prev,
                            words_found: new Map(prev.words_found).set(
                                data.userId,
                                new Set([...(prev.words_found.get(data.userId) || []), data.data.word])
                            )
                        }));
                    }
                    break;

                case 'word_search_puzzle_player_left':
                    toast.error(`${data.data.player_name} has left the game`);
                    break;

                case 'word_search_puzzle_game_ended':
                    if (data.data.reason === 'not_enough_players') {
                        toast.error('Game ended: Not enough players to continue', { duration: 6000 });
                    }
                    break;

                case 'word_search_puzzle_game_state_updated':
                    console.log('Game state updated:', data.data);
                    setGameState(prevState => {
                        const newState = {
                            ...prevState,
                            ...data.data,
                            players: data.data.players || prevState.players,
                        };

                        if (data.data.status === 'in_progress' && prevState.status === 'waiting') {
                            setShowExitConfirmation(false);
                        }

                        if (data.data.players && data.data.players.length === 0) {
                            router.visit('/games/word-search-puzzle');
                            return prevState;
                        }

                        return newState;
                    });
                    break;

                case 'score_updated':
                    setGameState(prev => ({
                        ...prev,
                        players: prev.players.map(p =>
                            p.id === data.data.player.id
                                ? { ...p, score: data.data.player.score }
                                : p
                        )
                    }));
                    break;
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [word_search_puzzle_game.id]);

    const leaveGame = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'word_search_puzzle_leave_game',
                gameId: gameState.id,
                userId: auth.user.id
            }));
        }
        router.delete(route(`games.word-search-puzzle.leave`, `${gameState.id}`));
    };

    const handleSubmitWord = () => {
        if (!inputWord.trim()) return;

        wsRef.current?.send(JSON.stringify({
            type: 'submit_word',
            gameId: gameState.id,
            userId: auth.user.id,
            data: { word: inputWord.trim() }
        }));

        setInputWord('');
    };

    const handleReady = () => {
        wsRef.current?.send(JSON.stringify({
            type: 'player_ready',
            gameId: gameState.id,
            userId: auth.user.id,
            gameType: 'word_search_puzzle',
            data: {
                player_id: currentPlayer?.id,
                user_id: auth.user.id
            }
        }));
    };

    return (
        <AuthenticatedLayout>
            <Head title={trans('games.word_search_puzzle.game_title')} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 shadow-xl sm:rounded-lg p-6">
                        {gameState?.status === 'in_progress' && (
                            <CircularTimer
                                timeLeft={Math.max(0, gameState.round_time - (Date.now() / 1000 - gameState.round_start_time))}
                                totalTime={gameState.round_time}
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
                                    currentPlayerId={currentPlayer?.id}
                                    onReady={handleReady}
                                    gameStatus={gameState?.status}
                                />
                                <WordList
                                    words={Array.from(gameState.words_found.get(auth.user.id) || new Set())}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showExitConfirmation && (
                <ConfirmationExitModal
                    onLeave={leaveGame}
                    onCancel={() => setShowExitConfirmation(false)}
                />
            )}
        </AuthenticatedLayout>
    );
}
