# Lengofy: Comprehensive Language Learning Platform

## Project Overview

Lengofy is an innovative language learning platform designed to make language acquisition engaging, interactive, and effective. Unlike traditional learning methods, Lengofy combines interactive lessons, gamified learning experiences, and real-time practice to help users master new languages.

## Key Components

### 1. Interactive Lessons
- Structured, progressive language learning modules
- Multimedia content (text, audio, video)
- Grammar and vocabulary explanations
- Adaptive learning paths

### 2. Language Practice Games
- Multiplayer language learning games
- Real-time competitive and cooperative gameplay
- Skill-based challenges
- Adaptive difficulty levels

### 3. Learning Features
- Multiple language pair support
- User progress tracking
- Personalized learning recommendations
- Achievement and reward systems

## Technology Stack

- **Backend**: Laravel (PHP)
- **Frontend**: React/TypeScript
- **Database**: MySQL
- **Real-time Communication**: Laravel Reverb
- **Authentication**: Laravel Breeze
- **Package Manager**: Bun
- **Testing**: PHPUnit

## Real-time Communication Architecture

### Laravel Reverb
Laravel Reverb is used for:
- Game management (creation, ending)
- Sending notifications
- Handling system-level messages
- Broadcasting game-related events

### WebSocket Server
The WebSocket server is dedicated to:
- Real-time game interactions
- Synchronizing player moves
- Managing in-game state
- Providing instant feedback during gameplay

#### Communication Flow
1. **Laravel Reverb**: Handles high-level game events and notifications
2. **WebSocket Server**: Manages real-time, low-latency game interactions

This architecture ensures smooth, responsive, and synchronized gameplay across multiple players.

## Prerequisites

- PHP 8.2+
- Composer
- Bun
- MySQL 8.0+
- Node.js 18+ (optional)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/lengofy.git
cd lengofy
```

### 2. Install Backend Dependencies

```bash
composer install
```

### 3. Install Frontend Dependencies

```bash
bun install
```

### 4. Environment Configuration

Copy `.env.example` to `.env` and configure your database settings:

```bash
cp .env.example .env
php artisan key:generate
```

### 5. Database Setup

```bash
php artisan migrate
php artisan db:seed
```

## Running with Docker

### 1. Docker Setup
Ensure you have Docker and Docker Compose installed on your system:
```bash
docker --version
docker-compose --version
```

### 2. Environment Configuration
Make sure your `.env` file is properly configured. The database host should be set to `db` when using Docker:
```env
DB_HOST=db
```

### 3. Build and Run Containers
Start the application using Docker Compose:
```bash
sudo docker-compose up -d
```

This will start all necessary services:
- PHP/Laravel Application
- MySQL Database
- Nginx Web Server

### 4. Access the Application
Once the containers are running, you can access the application at:
```
http://localhost
```

## Running the Application

Lengofy requires multiple services to run simultaneously:

### 1. Laravel Backend Server
```bash
php artisan serve
```

### 2. Frontend Development Server
```bash
bun run dev
```

### 3. WebSocket Server (Laravel Reverb)
```bash
php artisan reverb:start
```

### 4. Queue Listener
```bash
php artisan queue:listen
```

### 5. WebSocket Client
```bash
bun run ws
```

### Recommended: Use a Process Manager

For development, consider using a process manager like `tmux` or `supervisor` to manage these services:

```bash
# Example tmux setup
tmux new-session -d -s lengofy
tmux split-window -h
tmux split-window -v

# Assign commands to panes
tmux select-pane -t 0
tmux send-keys 'php artisan serve' C-m

tmux select-pane -t 1
tmux send-keys 'bun run dev' C-m

tmux select-pane -t 2
tmux send-keys 'php artisan reverb:start' C-m
```

## Testing Setup

### 1. Create Test Database

Create a separate MySQL database for testing:

```bash
mysql -u root -p
CREATE DATABASE lengofy_test;
exit
```

### 2. Configure Testing Environment

Copy `.env.example` to `.env.testing` and configure test database:

```bash
cp .env.example .env.testing
```

### 3. Generate Test Application Key

```bash
php artisan key:generate --env=testing
```

### 4. Run Database Test Migrations

```bash
php artisan migrate --env=testing
```

### 5. Run Tests

```bash
php artisan test --env=testing
```

## Deployment

Add to github secrets:
- VPS_HOST
- VPS_USERNAME
- VPS_SSH_KEY
- DB_CONNECTION
- DB_HOST
- DB_PORT
- DB_DATABASE
- DB_USERNAME
- DB_PASSWORD
- DB_ROOT_PASSWORD
- APP_NAME
- APP_URL
- WEBSOCKET_GAME_ENDPOINT
- SERVER_NAME

Make sure to allow port 6001 on VPS
Make sure to allow port 22 on VPS
Make sure to add VPS SSH key on Github secrets

VPS_HOST: VPS IP address
VPS_USERNAME: VPS username
VPS_SSH_KEY: SSH key for VPS (Without passphrase)
DB_CONNECTION: Database connection type (e.g., mysql)
DB_HOST: Database host (3306 for MySQL)
DB_PORT: Database port
DB_DATABASE: Database name
DB_USERNAME: Database username
DB_PASSWORD: Database password
DB_ROOT_PASSWORD: Database root password
APP_NAME: Application name
APP_URL: Application URL (localhost or yourdomain.com)
WEBSOCKET_GAME_ENDPOINT: WebSocket game endpoint (e.g., wss://192.1.0.0:6001 or ws://192.1.0.0:6001)
SERVER_NAME: Server name (e.g., localhost or yourdomain.com)

Push to main branch:
```bash
git push origin main
```

## TODO
 -Remove this emoji: "  кабел"

## License

Distributed under the Creative Commons Attribution-NonCommercial 4.0 International Public License. See `LICENSE` for more information.
