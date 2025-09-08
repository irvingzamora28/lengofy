import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdateGameSettingsForm from './Partials/UpdateGameSettingsForm';
import { Head } from '@inertiajs/react';
interface Props {
    auth: {
        user: {
            is_guest: boolean;
        };
    };
    mustVerifyEmail: boolean;
    status?: string;
}

export default function Edit({ auth, mustVerifyEmail, status }: Props) {
    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Profile</h2>}
        >
            <Head title="Profile" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg border border-transparent dark:border-gray-700">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                            isGuest={auth.user.is_guest}
                        />
                    </div>

                    {!auth.user.is_guest && (
                        <>
                            <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg border border-transparent dark:border-gray-700">
                                <UpdatePasswordForm className="max-w-xl" />
                            </div>

                            <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg border border-transparent dark:border-gray-700">
                                <UpdateGameSettingsForm
                                    className="max-w-xl"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
