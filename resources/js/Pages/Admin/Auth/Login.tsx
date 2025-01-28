import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.login'));
    };

    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-100 dark:bg-gray-900">
            <div className="w-full sm:max-w-md mt-6 px-6 py-4 bg-white dark:bg-gray-800 shadow-md overflow-hidden sm:rounded-lg">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
                    Admin Login
                </h1>
                
                <form onSubmit={submit}>
                    <div>
                        <InputLabel htmlFor="email" value="Email" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="Password" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="flex items-center justify-end mt-4">
                        <PrimaryButton className="ml-4" disabled={processing}>
                            Log in
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
