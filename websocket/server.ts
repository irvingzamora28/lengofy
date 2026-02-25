import { serve } from "bun";
import { WebSocketServer } from './core/WebSocketServer';

const port = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 6001;

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
});

console.log(`WebSocket server is running on port ${port}`);
