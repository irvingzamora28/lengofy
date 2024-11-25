import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

interface Player {
    id: number;
    player_name: string;
    score: number;
    is_ready: boolean;
}

interface Game {
    id: number;
    players: Player[];
    max_players: number;
    language_name: string;
    current_word: any;
    status: string;
    current_round: number;
    total_rounds: number;
}

interface Props {
    game: Game;
    isReady: boolean;
}

export default function Show({ game: initialGame, isReady: initialIsReady }: Props) {
    const [game, setGame] = useState<Game>(initialGame);
    const [isReady, setIsReady] = useState<boolean>(initialIsReady);

    useEffect(() => {
        // Initialize Laravel Echo
        const echo = new Echo({
            broadcaster: 'pusher',
            key: import.meta.env.VITE_PUSHER_APP_KEY,
            cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1',
            wsHost: import.meta.env.VITE_PUSHER_HOST ? import.meta.env.VITE_PUSHER_HOST : `ws-${import.meta.env.VITE_PUSHER_APP_CLUSTER}.pusher.com`,
            wsPort: import.meta.env.VITE_PUSHER_PORT ?? 80,
            wssPort: import.meta.env.VITE_PUSHER_PORT ?? 443,
            forceTLS: (import.meta.env.VITE_PUSHER_SCHEME ?? 'https') === 'https',
            enabledTransports: ['ws', 'wss'],
        });

        // Subscribe to the game channel
        const channel = echo.private(`game.${game.id}`);

        // Listen for player updates
        channel.listen('PlayerJoined', (e: { player: Player }) => {
            setGame(prevGame => ({
                ...prevGame,
                players: [...prevGame.players, e.player]
            }));
        });

        channel.listen('PlayerReady', (e: { player_id: number }) => {
            setGame(prevGame => ({
                ...prevGame,
                players: prevGame.players.map(player =>
                    player.id === e.player_id
                        ? { ...player, is_ready: true }
                        : player
                )
            }));
        });

        channel.listen('GameStarted', (e: { game: Game }) => {
            setGame(e.game);
        });

        channel.listen('RoundEnded', (e: { game: Game }) => {
            setGame(e.game);
        });

        return () => {
            echo.leave(`game.${game.id}`);
        };
    }, [game.id]);

    const markReady = () => {
        fetch(`/games/${game.id}/ready`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
        }).then(() => {
            setIsReady(true);
        });
    };

    const submitAnswer = (gender: string) => {
        fetch(`/games/${game.id}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            body: JSON.stringify({ gender }),
        });
    };

    return (
        <>
            <Head title={`Game #${game.id}`} />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">Game #{game.id}</h2>
                            <div>
                                <span className="mr-4">Language: {game.language_name}</span>
                                <span>Round: {game.current_round}/{game.total_rounds}</span>
                            </div>
                        </div>

                        {/* Players List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-4">Players</h3>
                                <div className="space-y-2">
                                    {game.players.map((player) => (
                                        <div
                                            key={player.id}
                                            className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-600 rounded"
                                        >
                                            <span>{player.player_name}</span>
                                            <div>
                                                <span className="mr-4">Score: {player.score}</span>
                                                {player.is_ready && (
                                                    <span className="text-green-500">Ready</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Game Area */}
                            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                {game.status === 'waiting' ? (
                                    <div className="text-center">
                                        <p className="mb-4">
                                            Waiting for players...
                                            {game.players.length < game.max_players &&
                                                ` (${game.players.length}/${game.max_players})`}
                                        </p>
                                        {!isReady && (
                                            <PrimaryButton onClick={markReady}>
                                                Mark as Ready
                                            </PrimaryButton>
                                        )}
                                    </div>
                                ) : game.status === 'in_progress' && game.current_word ? (
                                    <div className="text-center">
                                        <h3 className="text-xl mb-4">{game.current_word.word}</h3>
                                        <div className="flex justify-center gap-4">
                                            <PrimaryButton onClick={() => submitAnswer('der')}>
                                                der
                                            </PrimaryButton>
                                            <PrimaryButton onClick={() => submitAnswer('die')}>
                                                die
                                            </PrimaryButton>
                                            <PrimaryButton onClick={() => submitAnswer('das')}>
                                                das
                                            </PrimaryButton>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center">Game Ended</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
