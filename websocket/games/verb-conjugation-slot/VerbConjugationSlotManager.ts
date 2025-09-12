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

    console.log('[VCS WS] handleMessage', { type: message.type, gameId, userId: message.userId });

    switch (message.type) {
      case 'verb_conjugation_slot_join_game':
        console.log('[VCS WS] join_game received', { gameId, userId: message.userId, data: { players: message.data?.players?.length, prompts: message.data?.prompts?.length, max_players: message.data?.max_players, total_rounds: message.data?.total_rounds } });
        this.handleJoinGame(ws, message);
        break;
      case 'verb_conjugation_slot_game_created':
        console.log('[VCS WS] game_created broadcast', { gameId });
        this.handleGameCreated(message);
        break;
      case 'verb_conjugation_slot_player_ready':
        console.log('[VCS WS] player_ready', { gameId, userId: message.userId, data: message.data });
        this.handlePlayerReady(message);
        break;
      case 'verb_conjugation_slot_start_spin':
        console.log('[VCS WS] start_spin', { gameId, userId: message.userId });
        this.handleStartSpin(message);
        break;
      case 'verb_conjugation_slot_submit_conjugation':
        console.log('[VCS WS] submit_conjugation', { gameId, userId: message.userId, answer: (message.data as any)?.answer });
        this.handleSubmitConjugation(message);
        break;
      case 'verb_conjugation_slot_restart_game':
        console.log('[VCS WS] restart_game', { gameId, userId: message.userId });
        this.handleRestart(message);
        break;
      case 'verb_conjugation_slot_leave_game':
        console.log('[VCS WS] leave_game', { gameId, userId: message.userId });
        this.handlePlayerLeft(ws, message);
        break;
      case 'verb_conjugation_slot_game_end':
        console.log('[VCS WS] game_end', { gameId });
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
      console.log('[VCS WS] creating room', { gameId });
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
      console.log('[VCS WS] adding ws to room', { gameId });
      room.add(ws);

      // Merge incoming player (if provided) into existing state
      const state = this.getState(gameId);
      if (state && message.data?.players && message.data.players.length > 0) {
        const incoming = message.data.players[0];
        const exists = state.players.some(p => p.user_id === incoming.user_id || p.id === incoming.id);
        if (!exists) {
          console.log('[VCS WS] merging incoming player', { incoming });
          state.players.push(incoming);
          this.setState(gameId, state);
        }
      }

      console.log('[VCS WS] broadcasting state after join', { players: this.getState(gameId)?.players?.length });
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
    console.log('[VCS WS] broadcasting player_ready', { gameId, data: message.data });
    this.broadcast(room, { type: 'player_ready', data: message.data } as any);

    // mark player
    state.players = state.players.map(p => {
      if (p.id === message.data?.player_id || p.user_id === message.userId) {
        return { ...p, is_ready: true };
      }
      return p;
    });

    const allReady = state.max_players === 1 || (state.players.length >= 1 && state.players.every(p => p.is_ready));
    console.log('[VCS WS] ready status', { allReady, status: state.status, playersReady: state.players.map(p => ({ id: p.id, user_id: p.user_id, is_ready: p.is_ready })) });
    if (allReady && state.status === 'waiting') {
      state.status = 'in_progress';
      // set first prompt
      state.current_round = 0;
      state.current_prompt = state.prompts[state.current_round] ?? null;
      this.setState(gameId, state);
      console.log('[VCS WS] all ready -> in_progress, broadcasting state', { current_round: state.current_round });
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
    console.log('[VCS WS] spin_result', { gameId, current_round: state.current_round, prompt });
    this.broadcast(room, { type: 'spin_result', data: { prompt } } as any);
  }

  private handleSubmitConjugation(message: VerbConjugationSlotGameMessage): void {
    const gameId = message.gameId;
    const room = this.getRoom(gameId);
    const state = this.getState(gameId);
    if (!room || !state) return;

    const expectedRaw = state.current_prompt?.normalized_expected ?? '';
    const submitted = (message.data as any)?.answer ?? '';
    const expectedNorm = (expectedRaw ?? '').toString().normalize('NFKC').trim().toLowerCase();
    const submittedNorm = (submitted ?? '').toString().normalize('NFKC').trim().toLowerCase();
    const correct = submittedNorm === expectedNorm;
    console.log('[VCS WS] compare', { expectedNorm, submittedNorm, correct });

    // Find player record
    const player = state.players.find(p => p.user_id === (message.data as any)?.userId || p.id === (message.data as any)?.player_id);
    console.log('[VCS WS] submit result', { correct, expectedNorm, submittedNorm, player: player ? { id: player.id, user_id: player.user_id } : null });
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
        console.log('[VCS WS] game completed, broadcasting and cleaning up', { gameId });
        this.broadcast(room, { type: 'verb_conjugation_slot_game_state_updated', data: { players: state.players, status: state.status } } as any);
        this.cleanup(gameId);
      } else {
        state.current_round += 1;
        state.current_prompt = state.prompts[state.current_round] ?? null;
        this.setState(gameId, state);
        // clear last answer
        console.log('[VCS WS] advancing round', { current_round: state.current_round });
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
    console.log('[VCS WS] cleanup called', { gameId });
  }

  cleanupCompletely(gameId: string): void {
    this.clearTimers(gameId);
    super.cleanupCompletely(gameId);
    console.log('[VCS WS] cleanupCompletely called', { gameId });
  }
}
