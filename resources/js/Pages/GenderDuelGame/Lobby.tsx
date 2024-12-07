import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { router } from '@inertiajs/core';
import { GenderDuelGame } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useEchoChannel from '@/Hooks/useEchoChannel';
import { useGuestUser } from '@/Hooks/useGuestUser';
import GuestConversionModal from '@/Components/GuestConversionModal';

interface Props {
    auth: {
        user: {
            id: number;
            name: string;
            language_pair_id: string;
        };
    };
    activeGames: GenderDuelGame[];
}

export default function Lobby({ auth, activeGames }: Props) {
    const [games, setGames] = useState<GenderDuelGame[]>(activeGames);

    // Subscribe to game events
    useEchoChannel('gender-duel-game', {
        'gender-duel-game-created': (data: { game: GenderDuelGame }) => {
            console.log('New game created:', data.game);
            setGames(prevGames => [...prevGames, data.game]);
        },
        'gender-duel-game-ended': (data: { gameId: number }) => {
            console.log('Game ended:', data.gameId);
            setGames(prevGames => prevGames.filter(game => game.id !== data.gameId));
        }
    });

    const handleCreateGame = () => {
        router.post(route('games.gender-duel.create'), {
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

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold">Active Games</h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Showing games for your selected language pair only
                                    </p>
                                </div>
                                <PrimaryButton
                                    onClick={handlePlayClick}
                                >
                                    Create New Game
                                </PrimaryButton>
                            </div>

                            {games.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 mb-4">No active games for your language pair.</p>
                                    <p className="text-sm text-gray-400">
                                        Create a new game or change your language pair in your profile settings.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {games.map((game) => (
                                        <div
                                            key={game.id}
                                            className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
                                        >
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-lg font-semibold">
                                                    Game #{game.id}
                                                </h3>
                                                <span className="text-sm text-gray-500">
                                                    {game.players.length}/{game.max_players} Players
                                                </span>
                                            </div>

                                            <div className="mb-4 p-2 bg-gray-50 rounded">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <span className="text-xl">{game.source_language.flag}</span>
                                                    <span className="text-gray-600">{game.source_language.name}</span>
                                                    <span className="text-gray-400">→</span>
                                                    <span className="text-xl">{game.target_language.flag}</span>
                                                    <span className="text-gray-600">{game.target_language.name}</span>
                                                </div>
                                            </div>

                                            <Link
                                                href={`/games/gender-duel/${game.id}/join`}
                                                method="post"
                                                as="button"
                                                className="mt-2 inline-block bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full text-center"
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
