import { Game } from './types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import { useGuestUser } from '@/Hooks/useGuestUser';
import GuestConversionModal from '@/Components/GuestConversionModal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useEchoChannel from '@/Hooks/useEchoChannel';

interface Props {
    auth: {
        user: {
            id: number;
            name: string;
            language_pair_id: string;
        };
    };
    activeGames: Game[];
}

export default function Lobby({ auth, activeGames }: Props) {
    const [games, setGames] = useState<Game[]>(activeGames);

    // Subscribe to game events
    useEchoChannel('games', {
        'game-created': (data: { game: Game }) => {
            console.log('New game created:', data.game);
            setGames(prevGames => [...prevGames, data.game]);
        },
        'game-ended': (data: { gameId: number }) => {
            console.log('Game ended:', data.gameId);
            setGames(prevGames => prevGames.filter(game => game.id !== data.gameId));
        }
    });

    const handleCreateGame = () => {
        router.post('/games', {
            language_pair_id: auth.user.language_pair_id,
            max_players: 8,
        });
    };

    const { isGuestModalOpen, showConversionModal, hideConversionModal, createGuestSession } = useGuestUser();

    const handlePlayClick = async () => {
        if (!auth.user) {
            // Create guest session if user is not logged in
            const guestUser = await createGuestSession();
            if (guestUser) {
                handleCreateGame();
            }
        } else {
            handleCreateGame();
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Game Lobby</h2>}
        >
            <Head title="Game Lobby" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="mb-6">
                            <h3 className="text-lg font-medium mb-4">Create New Game</h3>
                            <div className="flex gap-4">
                                <PrimaryButton
                                    onClick={handlePlayClick}
                                >
                                    Create Game
                                </PrimaryButton>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium mb-4">Available Games</h3>
                            {games.length === 0 ? (
                                <p>No games available. Create one!</p>
                            ) : (
                                <div className="grid gap-4">
                                    {games.map((game) => (
                                        <div
                                            key={game.id}
                                            className="flex items-center justify-between border rounded-lg p-4"
                                        >
                                            <div>
                                                <h4 className="font-medium">{game.language_name}</h4>
                                                <p className="text-sm text-gray-600">
                                                    Players: {game.players.length}/{game.max_players}
                                                </p>
                                            </div>
                                            <Link
                                                href={`/games/${game.id}/join`}
                                                method="post"
                                                as="button"
                                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                            >
                                                Join Game
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <GuestConversionModal
                show={isGuestModalOpen}
                onClose={hideConversionModal}
            />
        </AuthenticatedLayout>
    );
}
