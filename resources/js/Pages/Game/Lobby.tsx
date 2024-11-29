import { Game } from './types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import { useGuestUser } from '@/Hooks/useGuestUser';
import GuestConversionModal from '@/Components/GuestConversionModal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CreateGameModal from '@/Components/CreateGameModal';

interface Props {
    activeGames: Game[];
    languagePairs: Record<string, string>;
}

export default function Lobby({ activeGames: initialGames, languagePairs, auth }: Props) {
    const [selectedPair, setSelectedPair] = useState(Object.keys(languagePairs)[0] || '');
    const [games, setGames] = useState(initialGames);
    const [isCreateGameModalOpen, setIsCreateGameModalOpen] = useState(false);
    const { isGuestModalOpen, showConversionModal, hideConversionModal, createGuestSession } = useGuestUser();

    useEffect(() => {
        const channel = window.Echo.join('games');

        channel.listen('.game-created', (e: { game: Game }) => {
            console.log('Game created:', e);
            setGames(prevGames => [...prevGames, e.game]);
        });

        channel.listen('.game-ended', (e: { game: Game }) => {
            console.log('Game ended:', e);
            setGames(prevGames => prevGames.filter(game => game.id !== e.game.id));
        });

        // Clean up subscription when component unmounts
        return () => {
            channel.stopListening('.game-created');
            channel.stopListening('.game-ended');
        };
    }, []);

    const createGame = () => {
        router.post('/games', {
            language_pair_id: selectedPair,
            max_players: 8, // You might want to make this configurable
        });
    };

    const handlePlayClick = async () => {
        if (!auth.user) {
            // Create guest session if user is not logged in
            const guestUser = await createGuestSession();
            if (guestUser) {
                setIsCreateGameModalOpen(true);
            }
        } else {
            setIsCreateGameModalOpen(true);
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
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold">Available Games</h3>
                            <div className="flex items-center gap-4">
                                {auth.user?.is_guest && (
                                    <button
                                        onClick={showConversionModal}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Create Account
                                    </button>
                                )}
                                <PrimaryButton onClick={handlePlayClick}>
                                    Create Game
                                </PrimaryButton>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {games.map((game) => (
                                <div key={game.id} className="bg-white dark:bg-gray-700 rounded-lg shadow p-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold mb-2">Game #{game.id}</h3>
                                        <p className="mb-2">
                                            Players: {game.players.length}/{game.max_players}
                                        </p>
                                        <p className="mb-4">
                                            Language: {game.language_name}
                                        </p>
                                        <PrimaryButton
                                            onClick={() =>
                                                router.post(`/games/${game.id}/join`)
                                            }
                                            disabled={game.players.length >= game.max_players}
                                        >
                                            Join Game
                                        </PrimaryButton>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <CreateGameModal
                show={isCreateGameModalOpen}
                onClose={() => setIsCreateGameModalOpen(false)}
                languagePairs={languagePairs}
            />

            <GuestConversionModal
                show={isGuestModalOpen}
                onClose={hideConversionModal}
            />
        </AuthenticatedLayout>
    );
}
