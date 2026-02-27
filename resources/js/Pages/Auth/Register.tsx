import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { FormEventHandler } from "react";
import LanguagePairSelect from "../Profile/Partials/LanguagePairSelect";
import i18n from "i18next";
import { useTranslation } from "react-i18next";
import { PageProps } from "@/types";

export default function Register() {
    const { languagePairs } = usePage<PageProps>().props;
    const { t: trans } = useTranslation();

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlLanguagePairId = urlParams.get("language_pair_id");
    const redirectRoute = urlParams.get("redirect_route");
    const gameId = urlParams.get("game_id");

    // Initialize with the language pair from URL or first available
    const defaultLanguagePairId =
        urlLanguagePairId || Object.keys(languagePairs)[0] || "";

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        language_pair_id: defaultLanguagePairId,
        redirect_route: redirectRoute || null,
        game_id: gameId || null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        i18n.changeLanguage(
            languagePairs[data.language_pair_id].sourceLanguage.code
        );
        localStorage.setItem(
            "I18N_LANGUAGE",
            languagePairs[data.language_pair_id].sourceLanguage.code
        );
        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
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
            <Head title="Register" />
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md px-6 py-8 space-y-8 bg-white shadow-md sm:rounded-lg dark:bg-gray-800">
                    <form onSubmit={submit}>
                        <div>
                            <InputLabel
                                htmlFor="name"
                                value={trans("register.name")}
                            />

                            <TextInput
                                id="name"
                                name="name"
                                value={data.name}
                                className="mt-1 block w-full"
                                autoComplete="name"
                                isFocused={true}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                required
                            />

                            <InputError
                                message={errors.name}
                                className="mt-2"
                            />
                        </div>

                        <div className="mt-4">
                            <InputLabel
                                htmlFor="email"
                                value={trans("register.email")}
                            />

                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full"
                                autoComplete="username"
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                required
                            />

                            <InputError
                                message={errors.email}
                                className="mt-2"
                            />
                        </div>

                        <div className="mt-4">
                            <InputLabel
                                htmlFor="password"
                                value={trans("register.password")}
                            />

                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full"
                                autoComplete="new-password"
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                                required
                            />

                            <InputError
                                message={errors.password}
                                className="mt-2"
                            />
                        </div>

                        <div className="mt-4">
                            <InputLabel
                                htmlFor="password_confirmation"
                                value={trans("register.password_confirmation")}
                            />

                            <TextInput
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className="mt-1 block w-full"
                                autoComplete="new-password"
                                onChange={(e) =>
                                    setData(
                                        "password_confirmation",
                                        e.target.value
                                    )
                                }
                                required
                            />

                            <InputError
                                message={errors.password_confirmation}
                                className="mt-2"
                            />
                        </div>

                        <div className="mt-4">
                            <LanguagePairSelect
                                value={data.language_pair_id}
                                onChange={(value) =>
                                    setData("language_pair_id", value)
                                }
                                error={errors.language_pair_id}
                                languagePairs={languagePairs}
                            />
                        </div>

                        <div className="flex items-center justify-end mt-4">
                            <Link
                                href={route("login")}
                                className="underline text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                            >
                                {trans("register.already_registered")}
                            </Link>

                            <PrimaryButton
                                className="ml-4"
                                disabled={processing}
                            >
                                {trans("register.register")}
                            </PrimaryButton>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                    {trans("register.or_continue_with") ?? "Or continue with"}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4">
                            <a
                                href={route("auth.google.redirect.register") + (data.language_pair_id ? `?language_pair_id=${data.language_pair_id}` : '')}
                                className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                {trans("register.register_with_google") ?? "Sign up with Google"}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
