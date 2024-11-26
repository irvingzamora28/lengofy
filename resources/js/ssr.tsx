import ReactDOMServer from 'react-dom/server';
import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { route } from '../../vendor/tightenco/ziggy/dist/index.js';
import { Config, Router, RouteName, RouteParams, ParameterValue } from 'ziggy-js';

interface PageProps {
    ziggy: Config & { location: string };
}

declare global {
    interface Window {
        route: {
            (): Router;
            (name: undefined, params: undefined, absolute?: boolean, config?: Config): Router;
            <T extends RouteName>(name: T, params?: RouteParams<T> | ParameterValue, absolute?: boolean, config?: Config): string;
        }
    }
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => `${title} - ${appName}`,
        resolve: (name) =>
            resolvePageComponent(
                `./Pages/${name}.tsx`,
                import.meta.glob('./Pages/**/*.tsx'),
            ),
        setup: ({ App, props }) => {
            const ziggy = props.initialPage.props.ziggy as Config;
            
            global.route = function(name?: RouteName, params?: RouteParams<RouteName> | ParameterValue, absolute?: boolean, config: Config = ziggy) {
                if (!name && !params) {
                    return route() as Router;
                }
                if (name === undefined && params === undefined) {
                    return route(name, params, absolute, config) as Router;
                }
                return route(name, params, absolute, config) as string;
            } as Window['route'];

            return <App {...props} />;
        },
    }),
);
