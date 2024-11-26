import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import { Game, Player } from './types';

interface Props {
    game: Game;
    isReady: boolean;
}

export default function Show({ game: initialGame, isReady: initialIsReady }: Props) {
    const [game, setGame] = useState<Game>(initialGame);
    const [isReady, setIsReady] = useState<boolean>(initialIsReady);

    useEffect(() => {
        // Subscribe to the game channel
        const channel = window.Echo.join(`game.${game.id}`);

        // Handle presence events
        channel.here((users: any) => {
            console.log('Users currently in the channel:', users);
            // Map user IDs to players
            users.forEach((user: any) => {
                const player = game.players.find(p => p.user_id === user.id);
                if (player) {
                    console.log('Found player for user:', player);
                }
            });
        });

        channel.joining((user: any) => {
            console.log('User joined presence:', user);
            // Find the corresponding game player
            const player = game.players.find(p => p.user_id === user.id);
            if (player) {
                console.log('Found corresponding player:', player);
            }
        });

        channel.leaving((user: any) => {
            console.log('User left presence:', user);
            // Find the corresponding game player
            const player = game.players.find(p => p.user_id === user.id);
            if (player) {
                console.log('Player left game:', player);
            }
        });

        // Listen for game events
        channel.listen('player-joined', (e: { player: Player; game_id: number }) => {
            console.log('Player joined event received:', e);
            if (e.game_id === game.id) {
                setGame(prevGame => ({
                    ...prevGame,
                    players: [...prevGame.players, e.player]
                }));
            }
        });

        channel.listen('player-ready', (e: { player_id: number; game_id: number }) => {
            console.log('Player ready event received:', e);
            if (e.game_id === game.id) {
                setGame(prevGame => ({
                    ...prevGame,
                    players: prevGame.players.map(player =>
                        player.id === e.player_id
                            ? { ...player, is_ready: true }
                            : player
                    )
                }));
            }
        });

        channel.listen('game-started', (e: { game: Game }) => {
            console.log('Game started:', e);
            setGame(e.game);
        });

        return () => {
            window.Echo.leave(`game.${game.id}`);
        };
    }, [game.id]);

    const markReady = () => {
        router.post(`/games/${game.id}/ready`, {}, {
            preserveScroll: true,
            onSuccess: () => setIsReady(true),
        });
    };

    const submitAnswer = (gender: string) => {
        router.post(`/games/${game.id}/submit`, { gender }, {
            preserveScroll: true,
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
                                    <div className="text-center">
                                        <p>Game Over!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
