import { useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Switch } from '@headlessui/react';
import PrimaryButton from '@/Components/PrimaryButton';
import { Transition } from '@headlessui/react';
import { PageProps } from '@/types';

export default function UpdateGameSettingsForm({
    className = ''
}: {
    className?: string
}) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;

    const { data, setData, post, processing, reset, errors, recentlySuccessful } = useForm({
        gender_duel_difficulty: user.gender_duel_difficulty || 'medium',
        gender_duel_sound: user.gender_duel_sound ?? true,
        gender_duel_timer: user.gender_duel_timer ?? true,
        word_search_puzzle_difficulty: user.word_search_puzzle_difficulty || 'medium',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('profile.game-settings.update'), {
            preserveScroll: true,
        });
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Game Settings</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Customize your game experience and preferences.
                </p>
            </header>

            <form onSubmit={submit} className="space-y-6">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Gender Duel Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="gender_duel_difficulty"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Difficulty
                                </label>
                                <select
                                    id="gender_duel_difficulty"
                                    value={data.gender_duel_difficulty}
                                    onChange={(e) => setData('gender_duel_difficulty', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700"
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Game Sound
                                </span>
                                <Switch
                                    checked={data.gender_duel_sound}
                                    onChange={(checked) => setData('gender_duel_sound', checked)}
                                    className={`
                                        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer
                                        rounded-full border-2 border-transparent transition-colors
                                        duration-200 ease-in-out focus:outline-none focus-visible:ring-2
                                        focus-visible:ring-white focus-visible:ring-opacity-75
                                        ${data.gender_duel_sound
                                            ? 'bg-primary-600'
                                            : 'bg-gray-200 dark:bg-gray-700'}
                                    `}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`
                                            pointer-events-none inline-block h-5 w-5 transform
                                            rounded-full bg-white shadow-lg ring-0 transition
                                            duration-200 ease-in-out
                                            ${data.gender_duel_sound
                                                ? 'translate-x-5'
                                                : 'translate-x-0'}
                                        `}
                                    />
                                </Switch>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Game Timer
                                </span>
                                <Switch
                                    checked={data.gender_duel_timer}
                                    onChange={(checked) => setData('gender_duel_timer', checked)}
                                    className={`
                                        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer
                                        rounded-full border-2 border-transparent transition-colors
                                        duration-200 ease-in-out focus:outline-none focus-visible:ring-2
                                        focus-visible:ring-white focus-visible:ring-opacity-75
                                        ${data.gender_duel_timer
                                            ? 'bg-primary-600'
                                            : 'bg-gray-200 dark:bg-gray-700'}
                                    `}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`
                                            pointer-events-none inline-block h-5 w-5 transform
                                            rounded-full bg-white shadow-lg ring-0 transition
                                            duration-200 ease-in-out
                                            ${data.gender_duel_timer
                                                ? 'translate-x-5'
                                                : 'translate-x-0'}
                                        `}
                                    />
                                </Switch>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Word Search Puzzle Settings</h3>
                        <div>
                            <label
                                htmlFor="word_search_puzzle_difficulty"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Difficulty
                            </label>
                            <select
                                id="word_search_puzzle_difficulty"
                                value={data.word_search_puzzle_difficulty}
                                onChange={(e) => setData('word_search_puzzle_difficulty', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700"
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition ease-in-out"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-400">Saved.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
