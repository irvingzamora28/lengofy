import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Game, Player } from './types';

interface Props {
    game: Game;
    isReady: boolean;
    answer?: any;
}

export default function Show({ game: initialGame, isReady: initialIsReady, answer }: Props) {
    const [game, setGame] = useState<Game>(initialGame);
    const [isReady, setIsReady] = useState<boolean>(initialIsReady);
    const [connectedUsers, setConnectedUsers] = useState<number[]>([]);
    const [lastAnswer, setLastAnswer] = useState<any>(answer);

    // Update lastAnswer when flash data changes
    useEffect(() => {
        if (answer) {
            setLastAnswer(answer);
        }
    }, [answer]);

    useEffect(() => {
        // Subscribe to the game channel
        const channel = window.Echo.join(`game.${game.id}`);

        // Handle presence events
        channel.here((users: any) => {
            console.log('Users currently in the channel:', users);
            setConnectedUsers(users.map((user: any) => user.id));
        });

        channel.joining((user: any) => {
            console.log('User joined presence:', user);
            setConnectedUsers(prev => [...prev, user.id]);
        });

        channel.leaving((user: any) => {
            console.log('User left presence:', user);
            setConnectedUsers(prev => prev.filter(id => id !== user.id));
        });

        // Listen for game events
        channel.listen('.player-joined', (e: { player: Player; game_id: number }) => {
            console.log('Player joined event received:', e);
            if (e.game_id === game.id) {
                setGame(prevGame => ({
                    ...prevGame,
                    players: [...prevGame.players.filter(p => p.id !== e.player.id), e.player]
                }));
            }
        });

        channel.listen('.player-ready', (e: { player_id: number; game_id: number }) => {
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

        channel.listen('.player-left', (e: { game_id: number; player_id: number }) => {
            console.log('Player left event received:', e);
            if (e.game_id === game.id) {
                setGame(prevGame => ({
                    ...prevGame,
                    players: prevGame.players.filter(player => player.id !== e.player_id)
                }));
            }
        });

        channel.listen('.game-started', (e: { game: Game }) => {
            console.log('Game started:', e);
            setGame(e.game);
        });

        channel.listen('.game-ended', () => {
            console.log('Game ended');
            router.visit('/games');
        });

        channel.listen('.answer-submitted', (e: { answer: any }) => {
            console.log('Answer submitted:', e);
            setLastAnswer(e.answer);
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

    const leaveGame = () => {
        router.delete(`/games/${game.id}/leave`);
    };

    const submitAnswer = (gender: string) => {
        router.post(`/games/${game.id}/submit`, { answer: gender }, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title={`Game #${game.id}`} />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold">Game #{game.id}</h2>
                                <div className="flex items-center gap-4">
                                    {!isReady && game.status === 'waiting' && (
                                        <PrimaryButton onClick={markReady}>
                                            Ready
                                        </PrimaryButton>
                                    )}
                                    <SecondaryButton onClick={leaveGame}>
                                        Leave Game
                                    </SecondaryButton>
                                </div>
                            </div>

                            {/* Game Info */}
                            <div className="flex justify-between items-center mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <div className="flex items-center gap-6">
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400">Language:</span>
                                        <span className="ml-2 font-medium">{game.language_name}</span>
                                    </div>
                                    {game.status === 'in_progress' && (
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Round:</span>
                                            <span className="ml-2 font-medium">{game.current_round}/{game.total_rounds}</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                    <span className={`ml-2 font-medium ${
                                        game.status === 'waiting' ? 'text-yellow-500' :
                                        game.status === 'in_progress' ? 'text-green-500' :
                                        'text-red-500'
                                    }`}>
                                        {game.status.charAt(0).toUpperCase() + game.status.slice(1).replace('_', ' ')}
                                    </span>
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
                                        </div>
                                    ) : game.status === 'in_progress' && game.current_word ? (
                                        <div className="text-center">
                                            <h3 className="text-xl mb-2">Round {game.current_round} of {game.total_rounds}</h3>
                                            <h4 className="text-lg mb-4">{game.current_word.word}</h4>
                                            <div className="flex justify-center gap-4 mb-4">
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
                                            {lastAnswer && (
                                                <div className={`mt-4 p-2 rounded ${lastAnswer.correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    <p>{lastAnswer.correct ? 'Correct!' : 'Wrong!'} ({lastAnswer.points} points)</p>
                                                    <p className="mt-2">Translation: {lastAnswer.translation}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : game.status === 'completed' ? (
                                        <div className="text-center">
                                            <h3 className="text-xl mb-4">Game Over!</h3>
                                            <div className="space-y-2">
                                                {game.players.sort((a, b) => b.score - a.score).map((player, index) => (
                                                    <div key={player.id} className="flex justify-between items-center">
                                                        <span>{index + 1}. {player.player_name}</span>
                                                        <span>{player.score} points</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
