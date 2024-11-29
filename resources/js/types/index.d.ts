import { Config } from 'ziggy-js';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string;
    is_guest: boolean;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
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

declare global {
    interface Window {
        Echo: {
            join: (channel: string) => {
                here: (callback: (users: any[]) => void) => void;
                joining: (callback: (user: any) => void) => void;
                leaving: (callback: (user: any) => void) => void;
                listen: (event: string, callback: (e: any) => void) => void;
            };
            leave: (channel: string) => void;
        };
    }
}
