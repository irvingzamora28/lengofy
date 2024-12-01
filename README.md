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

## License

Distributed under the Creative Commons Attribution-NonCommercial 4.0 International Public License. See `LICENSE` for more information.
