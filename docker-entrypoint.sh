#!/bin/bash

# Ensure vendor directory exists and has correct permissions
if [ ! -d /var/www/html/vendor ]; then
    composer install --no-dev --optimize-autoloader
fi

# Start PHP-FPM
php-fpm &

# Check if we're in production mode
if [ "$APP_ENV" = "production" ]; then
    echo "Running in production mode, using built assets"
    # Start WebSocket server
    bun run websocket-server.ts
else
    echo "Running in development mode"
    # Start Vite dev server and WebSocket server
    bun run dev &
    bun run websocket-server.ts
fi

# Keep the container running
wait
