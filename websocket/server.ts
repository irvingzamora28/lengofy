import { serve } from "bun";
import { readFileSync } from 'fs';
import { WebSocketServer } from './core/WebSocketServer';

const port = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 6001;
const isLocal = process.env.APP_ENV === 'local';

const server = serve({
    port,
    fetch(req, server) {
        if (server.upgrade(req)) {
            return; // Return if upgrade was successful
        }
        return new Response("Upgrade failed", { status: 500 });
    },
    websocket: {
        ...new WebSocketServer().getWebSocketConfig(),
    },
    ...(isLocal ? {} : {
        tls: {
            cert: readFileSync(
                `/etc/letsencrypt/live/${process.env.SERVER_NAME}/fullchain.pem`
            ),
            key: readFileSync(
                `/etc/letsencrypt/live/${process.env.SERVER_NAME}/privkey.pem`
            ),
        },
    }),
});

console.log(`Websocket running on ${isLocal ? 'ws' : 'wss'}://${process.env.SERVER_NAME}:${port}`);
console.log(`WebSocket server is running on port ${port}`);
