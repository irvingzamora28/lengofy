import { Game } from './types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import { useGuestUser } from '@/Hooks/useGuestUser';
import GuestConversionModal from '@/Components/GuestConversionModal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useEchoChannel from '@/Hooks/useEchoChannel';

interface Props {
    activeGames: Game[];
    languagePairs: { [key: string]: string };
}

export default function Lobby({ activeGames: initialGames, languagePairs, auth }: Props) {
    const [selectedPair, setSelectedPair] = useState<string>('');
    const [games, setGames] = useState<Game[]>(initialGames);

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

    useEffect(() => {
        // Set initial selected pair only if we have language pairs
        if (Object.keys(languagePairs).length > 0) {
            setSelectedPair(Object.keys(languagePairs)[0]);
        }
    }, [languagePairs]);

    const handleCreateGame = () => {
        console.log('selectedPair', selectedPair);

        if (!selectedPair) return;

        router.post('/games', {
            language_pair_id: selectedPair,
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
                                <select
                                    value={selectedPair}
                                    onChange={(e) => setSelectedPair(e.target.value)}
                                    className="rounded-md border-gray-300"
                                >
                                    <option value="">Select a language pair</option>
                                    {Object.entries(languagePairs).map(([id, name]) => (
                                        <option key={id} value={id}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                                <PrimaryButton
                                    onClick={handlePlayClick}
                                    disabled={!selectedPair}
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
