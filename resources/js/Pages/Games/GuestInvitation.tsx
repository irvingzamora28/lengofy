import { Head } from "@inertiajs/react";
import { useForm } from "@inertiajs/react";
import { FaCheckCircle } from 'react-icons/fa';
import { HiUserGroup } from "react-icons/hi";
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

    const { post: postGuest, processing: guestProcessing } = useForm({
        language_pair_id: languagePairId,
        redirect_route: gameRoute,
        game_id: gameId,
    });

    const handleGuestJoin = () => {
        postGuest(route("guest.create"), {
            preserveScroll: true,
        });
    };

    const handleCreateAccount = () => {
        window.location.href = route("register", {
            language_pair_id: languagePairId,
            redirect_route: gameRoute,
            game_id: gameId
        });
    };

    const handleLogin = () => {
        window.location.href = route("login", {
            redirect_route: gameRoute,
            game_id: gameId
        });
    };

    return (
        <>
            <Head title={`Join ${gameName}`} />
            <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
                <div className="w-full sm:max-w-md mt-6 px-8 py-8 bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
                    <div className="text-center mb-8">
                        <div className="mb-6 flex justify-center">
                        <HiUserGroup className="w-20 h-20 text-purple-600 dark:text-purple-400" /> {/* Replace SVG with FaUserAlt */}
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-3">
                            Join {gameName} with Friends! 🎮
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                            Your friend wants you to play <span className="font-semibold text-purple-600 dark:text-purple-400">{gameName}</span>
                        </p>
                        <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            <span className="font-medium">Why create an account?</span>
                            <ul className="mt-2 space-y-1 text-left">
                                <li className="flex items-center">
                                    <FaCheckCircle className="w-4 h-4 mr-2 text-green-500" /> {/* Replace SVG with FaCheckCircle */}
                                    Save your progress & stats
                                </li>
                                <li className="flex items-center">
                                    <FaCheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                    Compete on leaderboards
                                </li>
                                <li className="flex items-center">
                                    <FaCheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                    Unlock special features
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="space-y-4 mt-8">
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

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">
                                Prefer to play without saving?
                            </p>
                            <SecondaryButton
                                className="w-full justify-center bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700"
                                onClick={handleGuestJoin}
                                disabled={guestProcessing}
                            >
                                Continue as Guest
                            </SecondaryButton>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}
