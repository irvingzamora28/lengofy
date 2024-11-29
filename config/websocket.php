<?php

return [
    /*
    |--------------------------------------------------------------------------
    | WebSocket Configuration
    |--------------------------------------------------------------------------
    |
    | Here you can configure the WebSocket server settings for your application.
    |
    */

    'game_endpoint' => env('WEBSOCKET_GAME_ENDPOINT', 'ws://localhost:6001'),
];
