# Stage 1: Build Stage
FROM php:8.2-fpm AS base

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
WORKDIR /var/www/html

# Configure Git for the www-data user
RUN git config --global --add safe.directory /var/www/html && \
    chown -R www-data:www-data /var/www/html

# Copy composer files first
COPY composer.json composer.lock ./

# Install PHP dependencies
RUN composer install --no-scripts --no-autoloader

# Copy the rest of the application code
COPY . .

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 775 storage bootstrap/cache

# Generate optimized autoload files
RUN composer dump-autoload --optimize

# Install Node dependencies and build the React app
RUN bun install
RUN bun run build

# Generate application key
RUN php artisan key:generate

# Create a startup script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose ports for PHP-FPM and Vite
EXPOSE 9000 5173

# Switch to www-data user
USER www-data

# Set the entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]
