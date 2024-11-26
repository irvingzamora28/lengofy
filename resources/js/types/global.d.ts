import { AxiosInstance } from 'axios';
import { route as ziggyRoute } from 'ziggy-js';
import { InertiaPageProps } from './';

declare global {
    interface Window {
        axios: AxiosInstance;
    }

    /* eslint-disable no-var */
    var route: typeof ziggyRoute;
}

declare module '@inertiajs/core' {
    interface Page<T = Record<string, unknown>> {
        props: InertiaPageProps<T>;
    }
}
