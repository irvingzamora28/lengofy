import { ServerWebSocket } from "bun";
import { BaseGameManager } from '../../core/BaseGameManager';
import { VerbConjugationSlotGameState, VerbConjugationSlotGameMessage, VCSPrompt } from './types';

export class VerbConjugationSlotManager extends BaseGameManager<VerbConjugationSlotGameState> {
  private transitionTimers: Map<string, Map<number, NodeJS.Timeout>>;

  constructor(lobbyConnections: Set<ServerWebSocket>) {
    super('verb_conjugation_slot', lobbyConnections);
    this.transitionTimers = new Map();
  }

  private handleGameEnd(message: VerbConjugationSlotGameMessage): void {
    const gameId = message.gameId;
    const room = this.getRoom(gameId);
    const state = this.getState(gameId);
    if (!room || !state) return;

    state.status = 'completed';
    this.setState(gameId, state);
    this.broadcast(room, { type: 'verb_conjugation_slot_game_state_updated', data: { status: state.status, players: state.players } } as any);
    this.cleanup(gameId);
  }

  handleMessage(ws: ServerWebSocket, message: VerbConjugationSlotGameMessage): void {
    const gameId = message.gameId;
    if (!gameId) {
      console.error('No gameId provided in message:', message);
      return;
    }

    switch (message.type) {
      case 'verb_conjugation_slot_join_game':
        this.handleJoinGame(ws, message);
        break;
      case 'verb_conjugation_slot_game_created':
        this.handleGameCreated(message);
        break;
      case 'verb_conjugation_slot_player_ready':
        this.handlePlayerReady(message);
        break;
      case 'verb_conjugation_slot_start_spin':
        this.handleStartSpin(message);
        break;
      case 'verb_conjugation_slot_submit_conjugation':
        this.handleSubmitConjugation(message);
        break;
      case 'verb_conjugation_slot_restart_game':
        this.handleRestart(message);
        break;
      case 'verb_conjugation_slot_leave_game':
        this.handlePlayerLeft(ws, message);
        break;
      case 'verb_conjugation_slot_game_end':
        this.handleGameEnd(message);
        break;
      default:
        console.log(`Unhandled VCSM message type: ${message.type}`);
    }
  }

  private handleGameCreated(message: VerbConjugationSlotGameMessage): void {
    this.broadcastToLobby({
      type: 'verb_conjugation_slot_game_created',
      game: message.game,
    } as any);
  }

  private handleJoinGame(ws: ServerWebSocket, message: VerbConjugationSlotGameMessage): void {
    const gameId = message.gameId;
    if (!this.rooms.has(gameId)) {
      this.rooms.set(gameId, new Set());
      this.setState(gameId, {
        id: gameId,
        status: 'waiting',
        players: message.data?.players || [],
        hostId: message.data?.hostId || message.userId,
        prompts: message.data?.prompts || [],
        current_round: 0,
        total_rounds: message.data?.total_rounds || (message.data?.prompts?.length ?? 10),
        current_prompt: null,
        last_answer: null,
        max_players: message.data?.max_players || 2,
      });
    }

    const room = this.rooms.get(gameId)!;
    if (!room.has(ws)) {
      room.add(ws);

      // Merge incoming player (if provided) into existing state
      const state = this.getState(gameId);
      if (state && message.data?.players && message.data.players.length > 0) {
        const incoming = message.data.players[0];
        const exists = state.players.some(p => p.user_id === incoming.user_id || p.id === incoming.id);
        if (!exists) {
          state.players.push(incoming);
          this.setState(gameId, state);
        }
      }

      this.broadcastState(gameId);
    }
  }

  private handlePlayerLeft(ws: ServerWebSocket, message: VerbConjugationSlotGameMessage): void {
    const gameId = message.gameId;
    const room = this.getRoom(gameId);
    if (room) {
      room.delete(ws);
      const state = this.getState(gameId);
      if (state && message.userId) {
        state.players = state.players.filter(p => p.user_id !== message.userId);
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

  private handlePlayerReady(message: VerbConjugationSlotGameMessage): void {
    const gameId = message.gameId;
    const state = this.getState(gameId);
    const room = this.getRoom(gameId);
    if (!state || !room) return;

    // broadcast ready
    this.broadcast(room, { type: 'player_ready', data: message.data } as any);

    // mark player
    state.players = state.players.map(p => {
      if (p.id === message.data?.player_id || p.user_id === message.userId) {
        return { ...p, is_ready: true };
      }
      return p;
    });

    const allReady = state.max_players === 1 || (state.players.length >= 1 && state.players.every(p => p.is_ready));
    if (allReady && state.status === 'waiting') {
      state.status = 'in_progress';
      // set first prompt
      state.current_round = 0;
      state.current_prompt = state.prompts[state.current_round] ?? null;
      this.setState(gameId, state);
      this.broadcastState(gameId);
    }
  }

  private handleStartSpin(message: VerbConjugationSlotGameMessage): void {
    const gameId = message.gameId;
    const room = this.getRoom(gameId);
    const state = this.getState(gameId);
    if (!room || !state) return;

    // For now, spin selects current round prompt and echoes result
    const prompt: VCSPrompt | null = state.prompts[state.current_round] ?? null;
    this.broadcast(room, { type: 'spin_result', data: { prompt } } as any);
  }

  private handleSubmitConjugation(message: VerbConjugationSlotGameMessage): void {
    const gameId = message.gameId;
    const room = this.getRoom(gameId);
    const state = this.getState(gameId);
    if (!room || !state) return;

    const expectedNorm = state.current_prompt?.normalized_expected ?? '';
    const submitted = (message.data as any)?.answer ?? '';
    const submittedNorm = (submitted ?? '').toString().trim().toLowerCase();
    const correct = submittedNorm === expectedNorm;

    // Find player record
    const player = state.players.find(p => p.user_id === (message.data as any)?.userId || p.id === (message.data as any)?.player_id);
    if (player) {
      if (correct) player.score = (player.score || 0) + 1;
    }

    state.last_answer = {
      playerId: player?.id ?? (message.data as any)?.player_id ?? 0,
      userId: player?.user_id ?? (message.data as any)?.userId ?? 0,
      player_name: player?.player_name ?? 'Player',
      answer: submitted,
      correct,
    };

    this.setState(gameId, state);

    // broadcast answer result
    this.broadcast(room, { type: 'answer_submitted', data: state.last_answer } as any);

    // then state update (scores etc.)
    this.broadcast(room, { type: 'verb_conjugation_slot_game_state_updated', data: { players: state.players } } as any);

    // progress to next round after short delay
    if (!this.transitionTimers.has(gameId)) this.transitionTimers.set(gameId, new Map());
    const timers = this.transitionTimers.get(gameId)!;
    const existing = timers.get(state.current_round);
    if (existing) clearTimeout(existing);

    const isLastRound = state.current_round >= state.total_rounds - 1 || state.current_round >= state.prompts.length - 1;

    const timer = setTimeout(() => {
      if (isLastRound) {
        state.status = 'completed';
        this.setState(gameId, state);
        this.broadcast(room, { type: 'verb_conjugation_slot_game_state_updated', data: { players: state.players, status: state.status } } as any);
        this.cleanup(gameId);
      } else {
        state.current_round += 1;
        state.current_prompt = state.prompts[state.current_round] ?? null;
        this.setState(gameId, state);
        // clear last answer
        this.broadcast(room, { type: 'answer_submitted', data: null } as any);
        // send updated state
        this.broadcast(room, { type: 'verb_conjugation_slot_game_state_updated', data: { players: state.players, current_round: state.current_round, current_prompt: state.current_prompt, status: 'in_progress' } } as any);
      }
      timers.delete(state.current_round - 1);
      if (timers.size === 0) this.transitionTimers.delete(gameId);
    }, 2000);

    timers.set(state.current_round, timer);
  }

  private handleRestart(message: VerbConjugationSlotGameMessage): void {
    const gameId = message.gameId;
    const room = this.getRoom(gameId);
    if (!room) return;

    const newState: VerbConjugationSlotGameState = {
      id: gameId,
      status: 'waiting',
      players: (message.data?.players || []).map((p: any) => ({ ...p, score: 0, is_ready: false })),
      hostId: message.data?.hostId || message.userId,
      prompts: message.data?.prompts || [],
      current_round: 0,
      total_rounds: message.data?.total_rounds || (message.data?.prompts?.length ?? 10),
      current_prompt: null,
      last_answer: null,
      max_players: message.data?.max_players || 2,
    };
    this.setState(gameId, newState);
    this.broadcastState(gameId);
  }

  private clearTimers(gameId: string): void {
    const timers = this.transitionTimers.get(gameId);
    if (timers) {
      for (const t of timers.values()) clearTimeout(t);
      this.transitionTimers.delete(gameId);
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
