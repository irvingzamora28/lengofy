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
                </div>
            </div>
        </GuestLayout>
    );
}
