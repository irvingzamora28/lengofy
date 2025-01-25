import { useEffect } from "react";
import Checkbox from "@/Components/Checkbox";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Head, Link, useForm } from "@inertiajs/react";
import axios from "axios";
import { useTranslation } from "react-i18next";

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const redirectRoute = urlParams.get("redirect_route");
    const gameId = urlParams.get("game_id");

    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
        redirect_route: redirectRoute,
        game_id: gameId,
    });
    const { t: trans } = useTranslation();

    useEffect(() => {
        // Call CSRF cookie endpoint when component mounts
        axios.get("/sanctum/csrf-cookie").then(() => {
            // CSRF cookie is set; now we can make authenticated requests
        });

        return () => {
            reset("password");
        };
    }, []);

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(route("login"), {
            onSuccess: () => {
                // If redirect route and game ID are provided, redirect to the game
                if (data.redirect_route && data.game_id) {
                    window.location.href = route(data.redirect_route, {
                        [data.redirect_route.includes("gender-duel")
                            ? "genderDuelGame"
                            : "memoryTranslationGame"]: data.game_id,
                    });
                }
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md px-6 py-8 space-y-8 bg-white shadow-md sm:rounded-lg dark:bg-gray-800">
                    {status && (
                        <div className="mb-4 text-sm font-medium text-green-600">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit}>
                        <div>
                            <InputLabel
                                htmlFor="email"
                                value={trans("login.email")}
                            />

                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                            />

                            <InputError
                                message={errors.email}
                                className="mt-2"
                            />
                        </div>

                        <div className="mt-4">
                            <InputLabel
                                htmlFor="password"
                                value={trans("login.password")}
                            />

                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full"
                                autoComplete="current-password"
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                            />

                            <InputError
                                message={errors.password}
                                className="mt-2"
                            />
                        </div>

                        <div className="block mt-4">
                            <label className="flex items-center">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData("remember", e.target.checked)
                                    }
                                />
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                    {trans("login.remember_me")}
                                </span>
                            </label>
                        </div>

                        <div className="flex items-center justify-end mt-4">
                            {canResetPassword && (
                                <Link
                                    href={route("password.request")}
                                    className="underline text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                                >
                                    {trans("login.forgot_password")}
                                </Link>
                            )}

                            <PrimaryButton
                                className="ml-4"
                                disabled={processing}
                            >
                                {trans("login.login")}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </GuestLayout>
    );
}
