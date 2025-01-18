import { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { MemoryTranslationGame, MemoryTranslationGamePlayer, MemoryTranslationGameState, PageProps } from '@/types';
import { MdClose } from 'react-icons/md';
import GameArea from '@/Components/MemoryTranslationGame/GameArea';
import GameInfo from '@/Components/MemoryTranslationGame/GameInfo';
import PlayersInfo from '@/Components/MemoryTranslationGame/PlayersInfo';
import correctMatchSound from "@/assets/audio/correct-match.mp3";
import incorrectMatchSound from "@/assets/audio/incorrect-match.mp3";
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import ConfirmationExitModal from '@/Components/Games/ConfirmationExitModal';
import toast from 'react-hot-toast';

interface Props extends PageProps {
    auth: any;
    memory_translation_game: MemoryTranslationGame;
    wsEndpoint: string;
    justCreated: boolean;
}

const createCardPairs = (nouns: any[]): any[] => {
    const cardPairs: any[] = [];

    nouns.forEach((noun, index) => {
        // Create word card
        const wordCard: any = {
            ...noun,
            id: `${noun.id}-word`,
            type: 'word',
            isFlipped: false
        };

        // Create translation card
        const translationCard: any = {
            ...noun,
            id: `${noun.id}-translation`,
            word: noun.translation,
            translation: noun.word,
            type: 'translation',
            isFlipped: false
        };

        cardPairs.push(wordCard, translationCard);
    });

    // Shuffle the cards
    return cardPairs.sort(() => Math.random() - 0.5);
};

export default function Show({ auth, memory_translation_game, wsEndpoint, justCreated }: Props) {
    const [gameState, setGameState] = useState(memory_translation_game);
    const [selectedCards, setSelectedCards] = useState<number[]>([]);
    const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const wsRef = useRef<WebSocket | null>(null);
    const [showExitConfirmation, setShowExitConfirmation] = useState(false);
    const { t: trans } = useTranslation();
    const timerRef = useRef<number>(0);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Audio refs
    const correctSoundRef = useRef<HTMLAudioElement | null>(null);
    const incorrectSoundRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio elements
        correctSoundRef.current = new Audio(correctMatchSound);
        incorrectSoundRef.current = new Audio(incorrectMatchSound);

        // Clean up audio elements
        return () => {
            if (correctSoundRef.current) {
                correctSoundRef.current.pause();
                correctSoundRef.current = null;
            }
            if (incorrectSoundRef.current) {
                incorrectSoundRef.current.pause();
                incorrectSoundRef.current = null;
            }
        };
    }, []);

    const playSound = (isMatch: boolean) => {
        if (isMatch && correctSoundRef.current) {
            correctSoundRef.current.currentTime = 0;
            correctSoundRef.current.play().catch(error => console.log('Error playing sound:', error));
        } else if (!isMatch && incorrectSoundRef.current) {
            incorrectSoundRef.current.currentTime = 0;
            incorrectSoundRef.current.play().catch(error => console.log('Error playing sound:', error));
        }
    };

    const currentPlayer = gameState.players.find(player => player.user_id === auth.user.id);

    useEffect(() => {
        const ws = new WebSocket(wsEndpoint);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('Connected to Memory Translation game WebSocket about to join the game room');

            // Create card pairs only when creating a new game
            const cardPairs = createCardPairs(memory_translation_game.words);

            // Join the game room
            ws.send(JSON.stringify({
                type: 'join_memory_translation_game',
                gameId: memory_translation_game.id,
                userId: auth.user.id,
                max_players: memory_translation_game.max_players,
                data: {
                    words: cardPairs,
                    players: memory_translation_game.players,
                    language_name: memory_translation_game.language_name,
                    category: memory_translation_game.category
                }
            }));

            // If this is a newly created game, broadcast it to the lobby
            if (justCreated) {
                console.log('Broadcasting new memory translation game to lobby');
                ws.send(JSON.stringify({
                    type: 'memory_translation_game_created',
                    gameId: memory_translation_game.id,
                    game: {
                        ...memory_translation_game,
                        words: cardPairs
                    }
                }));
            }

            // For practice games, mark player as ready immediately
            if (memory_translation_game.max_players === 1) {
                ws.send(JSON.stringify({
                    type: 'player_ready',
                    gameId: gameState.id,
                    gameType: 'memory_translation',
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

                case 'memory_translation_card_flipped':
                    if (data.userId !== auth.user.id) {
                        // Sync card flip for other players
                        const cardIndex = data.data.cardIndex;
                        setSelectedCards(prev => [...prev, cardIndex]);
                    }
                    break;

                case 'memory_translation_pair_matched':
                    // Update matched pairs for all players
                    const matchedIndices = data.data.matchedIndices;
                    const isMatch = data.data.isMatch;

                    // Play appropriate sound
                    playSound(isMatch);

                    if (isMatch) {
                        setMatchedPairs(prev => [...prev, ...matchedIndices]);
                    }
                    // Clear selected cards after a delay
                    setTimeout(() => {
                        setSelectedCards([]);
                    }, 1000);
                    break;

                case 'memory_translation_player_left':
                    toast.error(`${data.data.player_name} has left the game`);
                    break;

                case 'memory_translation_game_ended':
                    if (data.data.reason === 'not_enough_players') {
                        toast.error('Game ended: Not enough players to continue', { duration: 6000 });
                    }
                    break;

                case 'memory_translation_game_state_updated':
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

                        if (data.data.status === 'completed') {
                            handleGameCompletion(data.data);
                        }

                        if (data.data.players && data.data.players.length === 0) {
                            router.visit('/games/memory-translation');
                            return prevState;
                        }

                        return newState;
                    });

                    // Clear selected cards when turn changes
                    if (data.data.current_turn !== gameState.current_turn) {
                        setSelectedCards([]);
                    }
                    break;

                case 'score_updated':
                    setGameState(prev => ({
                        ...prev,
                        players: prev.players.map(p =>
                            p.id === data.data.player.id
                                ? {
                                    ...p,
                                    score: data.data.player.score,
                                    moves: data.data.player.moves,
                                    time: data.data.player.time
                                }
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
    }, [memory_translation_game.id]);

    const handleCardClick = (index: number) => {
        // Only allow clicks if it's the player's turn
        if (gameState.current_turn !== auth.user.id || selectedCards.length >= 2) {
            return;
        }

        // Don't allow clicking already matched or selected cards
        if (matchedPairs.includes(index) || selectedCards.includes(index)) {
            return;
        }

        const newSelectedCards = [...selectedCards, index];
        setSelectedCards(newSelectedCards);

        // Send card flip message to server
        wsRef.current?.send(JSON.stringify({
            type: 'memory_translation_flip_card',
            gameId: gameState.id,
            userId: auth.user.id,
            data: {
                cardIndex: index,
                isSecondCard: newSelectedCards.length === 2,
                cardIndices: newSelectedCards.length === 2 ? newSelectedCards : undefined
            }
        }));

        // Check for matches when two cards are selected
        if (newSelectedCards.length === 2) {
            const [firstIndex, secondIndex] = newSelectedCards;
            const firstCard = gameState.words[firstIndex];
            const secondCard = gameState.words[secondIndex];

            setTimeout(() => {
                // Check if cards form a pair (one is word and other is translation)
                const isMatch =
                    (firstCard.type === 'word' && secondCard.type === 'translation' ||
                     firstCard.type === 'translation' && secondCard.type === 'word') &&
                    firstCard.id.split('-')[0] === secondCard.id.split('-')[0];

                // Send match result to server
                wsRef.current?.send(JSON.stringify({
                    type: 'memory_translation_pair_matched',
                    gameId: gameState.id,
                    userId: auth.user.id,
                    data: {
                        matchedIndices: [firstIndex, secondIndex],
                        isMatch: isMatch
                    }
                }));
            }, 1000);
        }
    };

    const handleGameCompletion = async (data: MemoryTranslationGameState) => {
        const currentPlayer = data.players.find(player => player.user_id === auth.user.id);
        if (!currentPlayer) {
            console.error('Current player not found:', auth.user.id);
            return;
        }

        // Calculate scores
        const currentScore = currentPlayer.score || 0;
        const isWinner = data.winner?.user_id === auth.user.id;

        // Get previous scores from localStorage
        const prevScores = JSON.parse(localStorage.getItem(`memoryTranslationScores_${auth.user.id}`) || '{"highestScore": 0, "totalPoints": 0, "bestTime": null}');

        const calculatedHighestScore = Math.max(currentScore, prevScores.highestScore);
        const calculatedTotalPoints = (prevScores.totalPoints || 0) + currentScore;
        const calculatedBestTime = prevScores.bestTime === null ? currentPlayer.time : Math.min(currentPlayer.time, prevScores.bestTime);

        const scoreData = {
            user_id: auth.user.id,
            game_id: 2, // MemoryTranslation game ID
            highest_score: calculatedHighestScore,
            total_points: calculatedTotalPoints,
            winning_streak: 0,
            best_time: calculatedBestTime
        };

        try {
            const response = await axios.post('/scores/update', scoreData);

            // Update localStorage
            localStorage.setItem(`memoryTranslationScores_${auth.user.id}`, JSON.stringify({
                highestScore: calculatedHighestScore,
                totalPoints: calculatedTotalPoints,
                bestTime: calculatedBestTime
            }));
        } catch (error) {
            console.error('Error saving score:', error);
        }
    };

    const markReady = () => {
        router.post(route(`games.memory-translation.ready`, `${gameState.id}`), {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                console.log("Sending ready message");

                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    console.log("WebSocket is open, sending ready message");
                    wsRef.current.send(JSON.stringify({
                        type: 'memory_translation_player_ready',
                        gameId: gameState.id,
                        gameType: 'memory_translation',
                        userId: auth.user.id,
                        data: {
                            player_id: currentPlayer?.id,
                            user_id: auth.user.id
                        }
                    }));
                }
            }
        });
    };

    const leaveGame = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'memory_translation_leave_game',
                gameId: gameState.id,
                userId: auth.user.id
            }));
        }
        router.delete(route(`games.memory-translation.leave`, `${gameState.id}`));
    };

    const handleExitClick = () => {
        if (gameState.status === 'in_progress') {
            setShowExitConfirmation(true);
        } else {
            leaveGame();
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center">
                    <button
                        onClick={handleExitClick}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition"
                    >
                        <MdClose size={24} />
                    </button>
                    <h2 className="ml-3 font-extrabold text-2xl text-indigo-700 dark:text-indigo-300 leading-tight">
                        Memory Translation
                    </h2>
                </div>
            }
        >
            <Head title={trans('memory_translation.game_room_title')} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="flex flex-col space-y-4">
                                <GameInfo game={gameState} currentPlayer={currentPlayer} />
                                <GameArea
                                    game={gameState}
                                    selectedCards={selectedCards}
                                    matchedPairs={matchedPairs}
                                    isCurrentPlayerReady={currentPlayer?.is_ready || false}
                                    onCardClick={handleCardClick}
                                    onReady={markReady}
                                    currentUserId={auth.user.id}
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
