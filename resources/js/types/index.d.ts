import { Config } from 'ziggy-js';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
}

export interface PageProps<T extends Record<string, unknown> = Record<string, unknown>> {
    auth: {
        user: User;
    };
    ziggy: Config & { location: string };
}

export interface InertiaPage<T = Record<string, unknown>> {
    props: T & {
        auth: {
            user: User;
        };
        ziggy: Config & { location: string };
    };
}

declare module '@inertiajs/core' {
    interface Page<T = Record<string, unknown>> {
        props: T & {
            auth: {
                user: User;
            };
            ziggy: Config & { location: string };
        };
    }
}
