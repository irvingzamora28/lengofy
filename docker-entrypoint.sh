#!/bin/bash

# Start PHP-FPM
php-fpm -D

# Start Vite dev server in development mode
if [ "$APP_ENV" = "local" ]; then
    bun run dev --host
else
    # In production, we don't need to start the dev server as we already built the assets
    echo "Running in production mode, using built assets"
fi

# Keep the container running
tail -f /dev/null
