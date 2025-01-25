import { Head } from "@inertiajs/react";
import { useForm } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";

interface Props {
    gameName: string;
    gameRoute: string;
    gameId: string;
    canLogin: boolean;
    canRegister: boolean;
    languagePairId: string;
}

export default function GuestInvitation({ gameName, gameRoute, gameId, canLogin, canRegister, languagePairId }: Props) {
    // Format the route name to match the validation rules
    const formattedRoute = `games.${gameRoute}`;

    const { post, processing } = useForm({
        language_pair_id: languagePairId,
        redirect_route: formattedRoute,
        game_id: gameId,
    });

    const handleGuestJoin = () => {
        post(route("guest.create"), {
            preserveScroll: true,
        });
    };

    const handleCreateAccount = () => {
        window.location.href = route("register", {
            language_pair_id: languagePairId,
            redirect_route: formattedRoute,
            game_id: gameId
        });
    };

    const handleLogin = () => {
        window.location.href = route("login", {
            redirect_route: formattedRoute,
            game_id: gameId
        });
    };

    return (
        <>
            <Head title={`Join ${gameName}`} />
            <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-100 dark:bg-gray-900">
                <div className="w-full sm:max-w-md mt-6 px-6 py-4 bg-white dark:bg-gray-800 shadow-md overflow-hidden sm:rounded-lg">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Game Invitation
                        </h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Your friend invited you to play {gameName}
                        </p>
                    </div>

                    <div className="space-y-4">
                        {canRegister && (
                            <PrimaryButton
                                className="w-full justify-center"
                                onClick={handleCreateAccount}
                            >
                                Create Account
                            </PrimaryButton>
                        )}

                        {canLogin && (
                            <SecondaryButton
                                className="w-full justify-center"
                                onClick={handleLogin}
                            >
                                Login
                            </SecondaryButton>
                        )}

                        <SecondaryButton
                            className="w-full justify-center"
                            onClick={handleGuestJoin}
                            disabled={processing}
                        >
                            Join as Guest
                        </SecondaryButton>
                    </div>
                </div>
            </div>
        </>
    );
}
