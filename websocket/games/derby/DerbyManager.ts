import { ServerWebSocket } from "bun";
import { BaseGameManager } from '../../core/BaseGameManager';
import { DerbyGameState, DerbyGameMessage, DerbyPrompt, DerbyPlayer } from './types';

// Difficulty configuration
const DIFFICULTY_CONFIG = {
    easy: {
        answer_window_ms: 10000,
        base_advance: 0.05, // 5% per correct
        time_bonus_max: 0.025, // +2.5% max
        time_bonus_threshold_ms: 1500,
        streak_threshold: 3,
        streak_boost: 0.10, // +10%
        wrong_lockout_ms: 600,
    },
    medium: {
        answer_window_ms: 6000,
        base_advance: 0.05,
        time_bonus_max: 0.02,
        time_bonus_threshold_ms: 1000,
        streak_threshold: 4,
        streak_boost: 0.12,
        wrong_lockout_ms: 800,
    },
    hard: {
        answer_window_ms: 4000,
        base_advance: 0.045,
        time_bonus_max: 0.0175,
        time_bonus_threshold_ms: 700,
        streak_threshold: 5,
        streak_boost: 0.15,
        wrong_lockout_ms: 1000,
    },
};

export class DerbyManager extends BaseGameManager<DerbyGameState> {
    protected raceTimers: Map<string, NodeJS.Timeout>;
    protected promptTimers: Map<string, NodeJS.Timeout>;
    protected lockouts: Map<string, Map<number, NodeJS.Timeout>>;

    constructor(lobbyConnections: Set<ServerWebSocket>) {
        super('derby', lobbyConnections);
        this.raceTimers = new Map();
        this.promptTimers = new Map();
        this.lockouts = new Map();
    }

    handleMessage(ws: ServerWebSocket, message: DerbyGameMessage): void {
        const gameId = message.derbyGameId || message.gameId;
        if (!gameId) {
            console.error('No gameId provided in message:', message);
            return;
        }

        console.log('Handling Derby message:', message.type, 'for game:', gameId);

        switch (message.type) {
            case "join_derby_game":
            case "player_joined":
                this.handleJoinGame(ws, message);
                break;
            case "derby_game_created":
                this.handleGameCreated(message);
                break;
            case "derby_game_end":
                this.handleGameEnd(gameId);
                break;
            case "submit_answer":
                this.handleAnswer(ws, message);
                break;
            case "player_ready":
                this.handlePlayerReady(message);
                break;
            case "restart_derby_game":
                this.handleRestart(message);
                break;
            case "player_left":
                this.handlePlayerLeft(ws, message);
                break;
            default:
                console.log(`Unhandled derby message type: ${message.type}`);
        }
    }

    private handleGameCreated(message: DerbyGameMessage): void {
        this.broadcastToLobby({
            type: 'derby_game_created',
            game: message.game
        });
    }

    private handleJoinGame(ws: ServerWebSocket, message: DerbyGameMessage): void {
        const gameId = message.derbyGameId || message.gameId;
        if (!this.rooms.has(gameId)) {
            console.log('Creating new derby game room:', gameId);
            this.rooms.set(gameId, new Set());
            this.setState(gameId, {
                id: gameId,
                status: "waiting",
                players: message.data?.players || [],
                difficulty: message.data?.difficulty || 'medium',
                max_players: message.data?.max_players || 4,
                race_mode: message.data?.race_mode || 'time',
                race_duration_s: message.data?.race_duration_s || 120,
                total_segments: message.data?.total_segments || 20,
                language_name: message.data?.language_name || '',
                filters: message.data?.filters || { language_pair_id: 0 },
                current_prompt: null,
                last_answer: null,
                hostId: message.userId || '',
                prompts: message.data?.prompts || [],
            });
        }

        const room = this.rooms.get(gameId);
        if (room && !room.has(ws)) {
            console.log('Adding player to derby room:', gameId);
            room.add(ws);

            const state = this.getState(gameId);
            if (state) {
                const playerExists = state.players.some(p => p.user_id === Number(message.userId));
                if (!playerExists && message.data?.players) {
                    const newPlayer = message.data.players.find(p => p.user_id === Number(message.userId));
                    if (newPlayer) {
                        state.players.push(newPlayer);
                    }
                }
                this.setState(gameId, state);
                this.broadcastState(gameId);
            }
        }
    }

    private handlePlayerLeft(ws: ServerWebSocket, message: DerbyGameMessage): void {
        const gameId = message.derbyGameId || message.gameId;
        const room = this.getRoom(gameId);
        if (room) {
            room.delete(ws);

            const state = this.getState(gameId);
            if (state) {
                state.players = state.players.filter(p => p.user_id !== Number(message.userId));
                this.setState(gameId, state);
            }

            this.clearTimers(gameId);

            if (room.size === 0) {
                this.cleanupCompletely(gameId);
            } else {
                this.broadcastState(gameId);
            }
        }
    }

    private handlePlayerReady(message: DerbyGameMessage): void {
        const gameId = message.derbyGameId || message.gameId;
        const state = this.getState(gameId);
        const room = this.getRoom(gameId);
        if (!state || !room) return;

        console.log('Player ready:', message.data?.player_id, 'in derby game:', gameId);

        // Broadcast player ready
        this.broadcast(room, {
            type: "player_ready",
            data: message.data
        });

        // Update player ready status
        state.players = state.players.map(player => {
            if (player.id === message.data?.player_id || player.user_id === Number(message.userId)) {
                return { ...player, is_ready: true };
            }
            return player;
        });

        const allReady = state.players.length >= 2 && state.players.every(player => player.is_ready);

        if (allReady && state.status === 'waiting') {
            console.log('All players ready, starting derby race:', gameId);
            this.handleStart(gameId);
        }
    }

    private handleStart(gameId: string): void {
        const state = this.getState(gameId);
        if (!state) return;

        console.log('Starting derby race:', gameId);
        state.status = "in_progress";
        state.race_start_time = Date.now();
        
        // Reset all player progress
        state.players = state.players.map(p => ({ ...p, progress: 0, score: 0, streak: 0 }));
        
        this.setState(gameId, state);
        this.broadcastState(gameId);

        // Spawn first prompt
        this.spawnPrompt(gameId);

        // Start race timer if time mode
        if (state.race_mode === 'time') {
            const timer = setTimeout(() => {
                this.handleRaceEnd(gameId);
            }, state.race_duration_s * 1000);
            this.raceTimers.set(gameId, timer);
        }
    }

    private spawnPrompt(gameId: string): void {
        const state = this.getState(gameId);
        const room = this.getRoom(gameId);
        if (!state || !room || state.status !== 'in_progress') return;

        // Get next prompt from the pool
        if (state.prompts.length === 0) {
            console.log('No more prompts available');
            return;
        }

        const prompt = state.prompts[Math.floor(Math.random() * state.prompts.length)];
        state.current_prompt = prompt;
        state.last_answer = null;

        const config = DIFFICULTY_CONFIG[state.difficulty];
        const deadlineMs = Date.now() + config.answer_window_ms;

        // Debug: prompt spawned
        console.log('[DERBY][Server] prompt_spawned', {
            gameId,
            promptId: prompt.id,
            deadlineMs,
            windowMs: config.answer_window_ms,
        });

        this.broadcast(room, {
            type: "prompt_spawned",
            data: {
                prompt_id: prompt.id,
                mode: prompt.mode,
                word: prompt.word,
                options: prompt.options,
                correct_answer: (prompt as any).correct_answer,
                answerWindowMs: config.answer_window_ms,
                deadlineMs,
                // extra metadata for UI rendering
                tense: (prompt as any).tense,
                person: (prompt as any).person,
                translation: (prompt as any).translation,
                gender: (prompt as any).gender,
            }
        });

        // Reset any existing prompt timer
        const existing = this.promptTimers.get(gameId);
        if (existing) {
            clearTimeout(existing);
            this.promptTimers.delete(gameId);
        }
        // Start a timer for the answer window; when it expires, auto-advance to next prompt
        const timer = setTimeout(() => {
            // Only advance if the game/prompt is still current
            const latest = this.getState(gameId);
            if (!latest || latest.status !== 'in_progress') return;
            // Emit a short reveal window so clients can show the correct answer
            this.broadcast(room, {
                type: 'round_timeout',
                data: {
                    prompt_id: prompt.id,
                    correct_answer: (prompt as any).correct_answer,
                }
            });
            console.log('[DERBY][Server] prompt_timeout_advance', { gameId, promptId: prompt.id });
            setTimeout(() => this.spawnPrompt(gameId), 1500);
        }, config.answer_window_ms);
        this.promptTimers.set(gameId, timer);
    }

    private handleAnswer(ws: ServerWebSocket, message: DerbyGameMessage): void {
        const gameId = message.derbyGameId || message.gameId;
        const room = this.getRoom(gameId);
        const state = this.getState(gameId);

        if (!state || !room || state.status !== 'in_progress' || !state.current_prompt) {
            return;
        }

        // Validate prompt id to prevent race conditions on late submissions
        const incomingPromptId = message.data?.prompt_id;
        if (incomingPromptId && state.current_prompt.id !== incomingPromptId) {
            // Ignore answers for an old prompt
            console.log('[DERBY][Server] ignore_old_prompt_answer', {
                gameId,
                currentPromptId: state.current_prompt.id,
                incomingPromptId,
                playerId: message.data?.player_id,
                userId: message.data?.user_id,
            });
            return;
        }

        // If this prompt already has a correct answer, reject further answers
        if (state.last_answer?.correct && state.last_answer?.prompt_id === state.current_prompt.id) {
            const rejectingPlayer = state.players.find(p => p.user_id === Number(message.data?.user_id));
            console.log('[DERBY][Server] reject_after_winner', {
                gameId,
                promptId: state.current_prompt.id,
                winnerUserId: state.last_answer.user_id,
                incomingUserId: message.data?.user_id,
            });
            if (rejectingPlayer) {
                this.broadcast(room, {
                    type: "answer_submitted",
                    data: {
                        playerId: rejectingPlayer.id,
                        userId: rejectingPlayer.user_id,
                        player_name: rejectingPlayer.player_name,
                        answer: message.data?.answer,
                        correct: false,
                        reason: 'already_answered',
                        elapsed_ms: message.data?.elapsed_ms ?? 0,
                        prompt_id: state.current_prompt.id,
                    }
                });
            }
            return;
        }

        const isTimeout = message.data?.answer === "timeout";
        const isCorrect = !isTimeout && message.data?.answer === state.current_prompt.correct_answer;
        
        const answeringPlayer = state.players.find(p => p.user_id === Number(message.data?.user_id));
        if (!answeringPlayer) {
            console.log("Player not found:", message.data?.user_id);
            return;
        }

        console.log('[DERBY][Server] answer_received', {
            gameId,
            promptId: state.current_prompt.id,
            playerId: answeringPlayer.id,
            userId: answeringPlayer.user_id,
            answer: message.data?.answer,
            isCorrect,
            isTimeout,
        });

        // Calculate progress delta if correct
        if (isCorrect) {
            const config = DIFFICULTY_CONFIG[state.difficulty];
            const elapsedMs = message.data?.elapsed_ms || config.answer_window_ms;

            let delta = config.base_advance;
            
            // Time bonus
            if (elapsedMs < config.time_bonus_threshold_ms) {
                const bonusRatio = 1 - (elapsedMs / config.time_bonus_threshold_ms);
                delta += config.time_bonus_max * bonusRatio;
            }
            
            // Streak bonus
            answeringPlayer.streak = (answeringPlayer.streak || 0) + 1;
            if (answeringPlayer.streak >= config.streak_threshold) {
                delta *= (1 + config.streak_boost);
            }
            
            answeringPlayer.progress = Math.min(1.0, answeringPlayer.progress + delta);
            answeringPlayer.score += 1;

            // Record winner for this prompt to block further correct answers
            state.last_answer = {
                player_id: answeringPlayer.id,
                user_id: answeringPlayer.user_id,
                player_name: answeringPlayer.player_name,
                answer: message.data?.answer,
                correct: true,
                elapsed_ms: elapsedMs,
                prompt_id: state.current_prompt.id,
                reason: 'normal',
            } as any;
            console.log('[DERBY][Server] winner_recorded', {
                gameId,
                promptId: state.current_prompt.id,
                userId: answeringPlayer.user_id,
                answer: message.data?.answer,
            });
        } else {
            answeringPlayer.streak = 0;
            console.log('[DERBY][Server] wrong_answer', {
                gameId,
                promptId: state.current_prompt.id,
                userId: answeringPlayer.user_id,
                answer: message.data?.answer,
            });
        }

        // Broadcast answer result (always include prompt_id and reason)
        console.log('[DERBY][Server] broadcast_answer', {
            gameId,
            promptId: state.current_prompt.id,
            playerId: answeringPlayer.id,
            userId: answeringPlayer.user_id,
            isCorrect,
            isTimeout,
        });
        this.broadcast(room, {
            type: "answer_submitted",
            data: {
                playerId: answeringPlayer.id,
                userId: answeringPlayer.user_id,
                player_name: answeringPlayer.player_name,
                answer: message.data?.answer,
                correct: isCorrect,
                prompt_id: state.current_prompt.id,
                reason: isTimeout ? 'timeout' : (isCorrect ? 'normal' : 'normal'),
                elapsed_ms: message.data?.elapsed_ms ?? 0,
            }
        });

        // Broadcast progress update
        this.broadcast(room, {
            type: "progress_updated",
            data: {
                playerId: answeringPlayer.id,
                progress: answeringPlayer.progress,
            }
        });

        // Broadcast updated state
        this.broadcast(room, {
            type: "derby_game_state_updated",
            data: {
                players: state.players,
            }
        });

        // Check if someone finished (distance mode)
        if (state.race_mode === 'distance' && answeringPlayer.progress >= 1.0) {
            this.handleRaceEnd(gameId);
            return;
        }

        // Advance behavior: only advance early if someone answered correctly.
        if (isCorrect) {
            // Clear the running prompt timer and schedule next prompt after a short delay for UI feedback
            const promptTimer = this.promptTimers.get(gameId);
            if (promptTimer) {
                clearTimeout(promptTimer);
                this.promptTimers.delete(gameId);
            }
            console.log('[DERBY][Server] advance_after_correct', { gameId, promptId: state.current_prompt.id });
            setTimeout(() => {
                this.spawnPrompt(gameId);
            }, 2000);
        }
    }

    private handleRaceEnd(gameId: string): void {
        const state = this.getState(gameId);
        const room = this.getRoom(gameId);
        if (!state || !room) return;

        state.status = 'completed';
        
        // Sort players by progress
        state.players.sort((a, b) => b.progress - a.progress);

        this.broadcast(room, {
            type: 'derby_game_state_updated',
            data: {
                players: state.players,
                status: "completed",
            }
        });

        this.cleanup(gameId);
    }

    private handleGameEnd(gameId: string): void {
        const state = this.getState(gameId);
        if (state) {
            state.status = 'completed';
            this.broadcastState(gameId);

            setTimeout(() => {
                this.cleanupCompletely(gameId);
            }, 10000);
        }
    }

    private handleRestart(message: DerbyGameMessage): void {
        const gameId = message.derbyGameId || message.gameId;
        const room = this.getRoom(gameId);
        if (!room) return;

        this.cleanup(gameId);

        const newState: DerbyGameState = {
            id: gameId,
            status: "waiting",
            players: (message.data?.players || []).map((p: any) => ({ 
                ...p, 
                score: 0, 
                progress: 0, 
                is_ready: false,
                streak: 0,
                powerups: []
            })),
            difficulty: message.data?.difficulty || 'medium',
            max_players: message.data?.max_players || 4,
            race_mode: message.data?.race_mode || 'time',
            race_duration_s: message.data?.race_duration_s || 120,
            total_segments: message.data?.total_segments || 20,
            language_name: message.data?.language_name || '',
            filters: message.data?.filters || { language_pair_id: 0 },
            current_prompt: null,
            last_answer: null,
            hostId: message.data?.hostId || message.userId || '',
            prompts: message.data?.prompts || [],
        };
        this.setState(gameId, newState);
        this.broadcastState(gameId);
    }

    private clearTimers(gameId: string): void {
        const raceTimer = this.raceTimers.get(gameId);
        if (raceTimer) {
            clearTimeout(raceTimer);
            this.raceTimers.delete(gameId);
        }

        const promptTimer = this.promptTimers.get(gameId);
        if (promptTimer) {
            clearTimeout(promptTimer);
            this.promptTimers.delete(gameId);
        }

        const playerLockouts = this.lockouts.get(gameId);
        if (playerLockouts) {
            for (const timer of playerLockouts.values()) {
                clearTimeout(timer);
            }
            this.lockouts.delete(gameId);
        }
    }

    cleanup(gameId: string): void {
        super.cleanup(gameId);
        this.clearTimers(gameId);
    }

    cleanupCompletely(gameId: string): void {
        this.clearTimers(gameId);
        super.cleanupCompletely(gameId);
    }
}
