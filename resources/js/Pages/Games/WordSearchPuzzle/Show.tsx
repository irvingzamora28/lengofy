import { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { WordSearchPuzzleGame, WordSearchPuzzleGameState } from '@/types';
import toast from 'react-hot-toast';
import ConfirmationExitModal from '@/Components/Games/ConfirmationExitModal';
import { IoPersonAddSharp } from 'react-icons/io5';
import { FaUserPlus } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import GameArea from '@/Components/WordSearchPuzzle/GameArea';
import GameInfo from '@/Components/WordSearchPuzzle/GameInfo';
import PlayersInfo from '@/Components/WordSearchPuzzle/PlayersInfo';
import axios from 'axios';
import { useWordSearchPuzzle } from '@/Hooks/useWordSearchPuzzle';

interface Props {
    auth: any;
    word_search_puzzle_game: WordSearchPuzzleGame;
    wsEndpoint: string;
    justCreated: boolean;
}

export default function Show({ auth, word_search_puzzle_game, wsEndpoint, justCreated }: Props) {
    const { t: trans } = useTranslation();
    const wsRef = useRef<WebSocket | null>(null);
    const [showExitConfirmation, setShowExitConfirmation] = useState(false);
    const [selectedCells, setSelectedCells] = useState<{ x: number; y: number }[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [currentWords, setCurrentWords] = useState(word_search_puzzle_game.words);

    // Add the handleShare function
    const handleShare = async () => {
        const url = new URL(window.location.href);
        const baseUrl = `${url.protocol}//${url.host}${url.pathname}`;
        const shareTitle = `Join my Word Search Puzzle Game!`;
        const shareText = `Hey! Join me for a game of Word Search Puzzle on Lengofy!`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: baseUrl,
                });
            } else {
                await navigator.clipboard.writeText(baseUrl);
                toast.success(trans('Game link copied to clipboard!'));
            }
        } catch (error) {
            console.error('Error sharing:', error);
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(baseUrl);
                toast.success(trans('Game link copied to clipboard!'));
            } catch (err) {
                toast.error(trans('Failed to share or copy link'));
            }
        }
    };

    const fetchWords = async () => {
        try {
            const response = await axios.get(route('games.word-search-puzzle.get-words'), {
                params: {
                    difficulty: gameState.difficulty,
                    category: gameState.category?.id,
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching words:', error);
            return [];
        }
    };

    const handleRestartGame = async () => {
        const newWords = await fetchWords();
        console.log('New words fetched:', newWords);

        if (wsRef.current) {
            wsRef.current.send(JSON.stringify({
                type: 'restart_word_search_puzzle_game',
                gameId: gameState.id,
                gameType: 'word_search_puzzle',
                data: {
                    words: newWords,
                    players: gameState.players,
                    language_name: gameState.language_name,
                    category: gameState.category,
                    hostId: gameState.hostId,
                    seed: gameState.id.toString() // Include the seed for grid generation
                }
            }));
        }
    };

    // Game state
    const gridSize = word_search_puzzle_game.difficulty === 'easy' ? 10 :
                    word_search_puzzle_game.difficulty === 'medium' ? 15 : 30;

    // Use the same hook implementation as in Practice.tsx
    const { grid, words, score, handleWordSelected, generateGrid, updateWordsAndReset } = useWordSearchPuzzle({
        initialWords: currentWords, // Use currentWords instead of word_search_puzzle_game.words
        gridSize,
        seed: word_search_puzzle_game.id.toString(), // Use game ID as seed
        onWordFound: (word, cells) => {
            console.log('Word found about to send to server:', word, 'Cells:', cells);

            // Update local state first
            setGameState(prev => {
                const prevWordsFound = prev.words_found || {};
                const currentUserWords = Array.isArray(prevWordsFound[auth.user.id])
                    ? prevWordsFound[auth.user.id]
                    : [];

                return {
                    ...prev,
                    words_found: {
                        ...prevWordsFound,
                        [auth.user.id]: [...currentUserWords, word]
                    },
                    grid: prev.grid.map((row, i) =>
                        row.map((cell, j) => {
                            if (cells.some(pos => pos.x === i && pos.y === j)) {
                                return { ...cell, isFound: true, isSelected: false };
                            }
                            return cell;
                        })
                    )
                };
            });

            // Then broadcast to other players
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'word_search_puzzle_word_found',
                    gameId: gameState.id,
                    userId: auth.user.id,
                    data: {
                        word,
                        cells
                    }
                }));
            }
        },
    });

    // Initialize gameState using the grid from useWordSearchPuzzle
    const [gameState, setGameState] = useState(() => ({
        ...word_search_puzzle_game,
        words_found: word_search_puzzle_game.words_found || {},
        grid: grid
    }));

    const currentPlayer = gameState.players.find(p => p.user_id === auth.user.id);

    // Dynamic cell size based on grid size
    const getCellSizeClass = () => {
        switch (gridSize) {
            case 10: return 'h-10 w-10';
            case 15: return 'h-6 w-6 md:h-9 md:w-9';
            default: return 'h-6 w-6';
        }
    };

    useEffect(() => {
        const ws = new WebSocket(wsEndpoint);
        wsRef.current = ws;

        ws.onopen = async () => {
            console.log('Connected to Word Search Puzzle game WebSocket about to join the game room');

            // Join the game room
            ws.send(JSON.stringify({
                type: 'join_word_search_puzzle_game',
                gameId: word_search_puzzle_game.id,
                userId: auth.user.id,
                gameType: 'word_search_puzzle',
                data: {
                    words: word_search_puzzle_game.words,
                    players: [{
                        id: auth.user.id,
                        user_id: auth.user.id,
                        player_name: auth.user.name,
                        name: auth.user.name,
                        ...word_search_puzzle_game.players.find(p => p.user_id === auth.user.id)
                    }],
                    source_language: word_search_puzzle_game.source_language,
                    target_language: word_search_puzzle_game.target_language,
                    max_players: word_search_puzzle_game.max_players
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

            if (word_search_puzzle_game.max_players === 1) {
                handleReady();
            }
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received game message:', data.type);

            switch (data.type) {
                case 'player_ready':
                    if (data.data.is_host && data.data.words && auth.user.id !== gameState.hostId) {
                        // Update words only when host sends the initial words
                        updateWordsAndReset(data.data.words);
                    }
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
                        setGameState(prev => {
                            const prevWordsFound = prev.words_found || {};

                            // Debug the current state
                            console.log('Previous words_found:', prevWordsFound);
                            console.log('Current user words:', prevWordsFound[data.userId]);

                            // Ensure we have an array to work with
                            const currentUserWords = Array.isArray(prevWordsFound[data.userId])
                                ? prevWordsFound[data.userId]
                                : [];

                            return {
                                ...prev,
                                words_found: {
                                    ...prevWordsFound,
                                    [data.userId]: [...currentUserWords, data.data.word]
                                }
                            };
                        });
                    }

                    // Update the grid to show found words for all players
                    setGameState(prev => {
                        const newGrid = JSON.parse(JSON.stringify(prev.grid));
                        data.data.cells.forEach(({ x, y }) => {
                            if (newGrid[x] && newGrid[x][y]) {
                                newGrid[x][y] = {
                                    ...newGrid[x][y],
                                    isFound: true,
                                    isSelected: false
                                };
                            }
                        });
                        return {
                            ...prev,
                            grid: newGrid
                        };
                    });
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
                    // Update words if player is not host
                    if (auth.user.id !== gameState.hostId && data.data.words) {
                        setCurrentWords(data.data.words);
                    }
                    setGameState(prevState => ({
                        ...prevState,
                        ...data.data,
                        players: data.data.players || prevState.players,
                        grid: data.data.grid || prevState.grid, // Explicitly handle grid updates
                        words_found: data.data.words_found || prevState.words_found,
                    }));
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

                case 'word_search_puzzle_player_ready':
                    if (data.data.is_host && auth.user.id !== gameState.hostId) {
                        // Update words when host sends them in the ready message
                        console.log('Updating words from host:', data.data.words);
                        updateWordsAndReset(data.data.words);
                    }
                    setGameState(prev => ({
                        ...prev,
                        players: prev.players.map(player =>
                            player.id === data.data.player_id || player.user_id === data.data.user_id
                                ? { ...player, is_ready: true }
                                : player
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

    const handleCellMouseDown = (x: number, y: number) => {
        if (gameState.status !== 'in_progress' || gameState.current_turn !== auth.user.id) return;

        setIsDragging(true);
        setSelectedCells([{ x, y }]);
    };

    const handleGameCompletion = async (data: WordSearchPuzzleGameState) => {
        const currentPlayer = data.players.find(player => player.user_id === auth.user.id);
        if (!currentPlayer) {
            console.error('Current player not found:', auth.user.id);
            return;
        }
        // Calculate scores
    };

    const handleCellMouseEnter = (x: number, y: number) => {
        if (!isDragging) return;

        const lastCell = selectedCells[selectedCells.length - 1];
        if (isValidSelection(lastCell, { x, y })) {
            setSelectedCells([...selectedCells, { x, y }]);
        }
    };

    const isValidWord = (word: string): boolean => {
        return gameState.words.some(w => w.word === word || w.translation === word);
    };

    const handleCellMouseUp = () => {
        if (!isDragging) return;

        setIsDragging(false);
        const selectedWord = getWordFromSelectedCells();

        if (selectedWord && isValidWord(selectedWord)) {
            wsRef.current?.send(JSON.stringify({
                type: 'word_search_puzzle_word_found',
                gameId: gameState.id,
                userId: auth.user.id,
                data: {
                    word: selectedWord,
                    cells: selectedCells
                }
            }));
        }
        setSelectedCells([]);
    };

    const isValidSelection = (last: { x: number; y: number }, current: { x: number; y: number }) => {
        const dx = Math.abs(current.x - last.x);
        const dy = Math.abs(current.y - last.y);

        // Allow horizontal, vertical, and diagonal selections
        return dx <= 1 && dy <= 1;
    };

    const getWordFromSelectedCells = () => {
        if (selectedCells.length < 2) return '';

        return selectedCells
            .map(cell => gameState.grid[cell.x][cell.y])
            .join('');
    };

    const handleReady = async () => {
        let initialGrid;
        let wordsToUse = word_search_puzzle_game.words;

        // Only the host should generate new words and grid
        if (auth.user.id === gameState.hostId) {
            // If we don't have words yet, fetch them
            if (!wordsToUse || wordsToUse.length === 0) {
                wordsToUse = await fetchWords();
            }
            initialGrid = grid; // Use the grid from useWordSearchPuzzle hook
            console.log('Host generated initial grid and words:', { grid: initialGrid, words: wordsToUse });
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'word_search_puzzle_player_ready',
                gameId: gameState.id,
                gameType: 'word_search_puzzle',
                userId: auth.user.id,
                data: {
                    player_id: currentPlayer?.id,
                    user_id: auth.user.id,
                    grid: initialGrid,
                    words: wordsToUse,
                    is_host: auth.user.id === gameState.hostId
                }
            }));
        }

        router.post(route(`games.word-search-puzzle.ready`, `${gameState.id}`), {
            grid: initialGrid,
            words: wordsToUse
        }, {
            preserveScroll: true,
            preserveState: true
        });
    };

    useEffect(() => {
        console.log('Grid generated with seed:', word_search_puzzle_game.id.toString());
        console.log('Grid layout:', grid);
    }, [grid]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                        {trans('Word Search Puzzle Game')}
                    </h2>
                    <div className="flex gap-2">
                        {gameState.status === 'waiting' && (
                            <button
                                onClick={handleShare}
                                className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                            >
                                <IoPersonAddSharp className="mr-2 md:hidden" />
                                <FaUserPlus className="mr-2 hidden md:block" />
                                <span className="hidden md:inline">{trans('generals.invite_friends')}</span>
                                <span className="md:hidden">{trans('generals.invite')}</span>
                            </button>
                        )}
                        <button
                            onClick={() => setShowExitConfirmation(true)}
                            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition"
                        >
                            <MdClose size={24} />
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={trans('games.word_search_puzzle.game_title')} />

            <div className="py-0 sm:py-12 bg-gray-100 dark:bg-gray-900">
                <div className="w-full md:w-11/12 mx-auto px-0 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-2 sm:p-6 text-gray-900 dark:text-gray-100">
                            <div className="flex flex-col space-y-4">
                                <GameInfo game={gameState} currentPlayer={currentPlayer} />
                                <GameArea
                                    game={{
                                        ...gameState,
                                        grid: gameState.grid, // Use the synchronized grid from game state
                                    }}
                                    selectedCells={selectedCells}
                                    isCurrentPlayerReady={currentPlayer?.is_ready || false}
                                    onReady={handleReady}
                                    currentUserId={auth.user.id}
                                    onRestart={handleRestartGame}
                                    handleCellMouseDown={handleCellMouseDown}
                                    handleCellMouseEnter={handleCellMouseEnter}
                                    handleCellMouseUp={handleCellMouseUp}
                                    gridSize={gridSize}
                                    onWordSelected={handleWordSelected}
                                    getCellSizeClass={getCellSizeClass}
                                />
                                <PlayersInfo
                                    status={gameState.status}
                                    players={gameState.players}
                                    currentUserId={auth.user.id}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showExitConfirmation && (
                <ConfirmationExitModal
                    onLeave={leaveGame}
                    onCancel={() => setShowExitConfirmation(false)}
                />
            )}
        </AuthenticatedLayout>
    );
}
