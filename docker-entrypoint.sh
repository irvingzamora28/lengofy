#!/bin/bash
set -e

# Ensure storage directories exist and are writable
mkdir -p /var/www/html/storage/logs \
         /var/www/html/storage/framework/cache \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/bootstrap/cache
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true

# Start PHP-FPM
php-fpm -D
echo "PHP-FPM started"

# Start Vite dev server in development mode
if [ "$APP_ENV" = "local" ]; then
    bun run dev --host &
    bun run ws &
else
    echo "Running in production mode, using built assets"
    # Start Bun WebSocket server in production (restart on failure)
    while true; do
        bun run ws
        echo "WebSocket server exited, restarting in 5s..."
        sleep 5
    done &
fi

# Keep the container running
tail -f /dev/null
