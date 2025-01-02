# Stage 1: Build Stage
FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    libpq-dev \
    libpng-dev \
    libjpeg-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    && docker-php-ext-install pdo pdo_mysql mbstring zip exif pcntl

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash && \
    mv /root/.bun/bin/bun /usr/local/bin/bun

# Set the working directory
WORKDIR /var/www/lengofy

# Configure Git
RUN git config --global --add safe.directory /var/www/lengofy

# Copy composer files first
COPY composer.json composer.lock ./

# Set proper ownership for the working directory
RUN chown -R www-data:www-data /var/www/lengofy

# Switch to www-data user for dependency installation
USER www-data

# Install PHP dependencies
RUN composer install --no-scripts --no-autoloader

# Switch back to root for copying files
USER root

# Copy the rest of the application code
COPY . .

# Set proper permissions
RUN chown -R www-data:www-data . && \
    chmod -R 755 . && \
    chmod -R 775 storage bootstrap/cache && \
    chmod -R 775 vendor

# Switch back to www-data
USER www-data

# Generate optimized autoload files
RUN composer dump-autoload --optimize

# Install Node dependencies and build assets
RUN bun install && \
    bun run build

# Create a startup script
COPY --chown=www-data:www-data docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose ports for PHP-FPM, Laravel Reverb, and Bun WebSocket
EXPOSE 9000 8080 6001

ENTRYPOINT ["docker-entrypoint.sh"]
