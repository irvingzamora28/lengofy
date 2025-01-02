#!/bin/bash

# Start PHP-FPM
php-fpm -D

# Start Laravel Reverb WebSocket server
php artisan reverb:start &

# Start Laravel Queue Worker
php artisan queue:listen &

# Start Vite dev server in development mode
if [ "$APP_ENV" = "local" ]; then
    bun run dev --host &
    # Start Bun WebSocket server
    bun run ws &
else
    # In production, we don't need to start the dev server as we already built the assets
    echo "Running in production mode, using built assets"
    # Start Bun WebSocket server in production
    bun run ws &
fi

# Keep the container running
tail -f /dev/null
