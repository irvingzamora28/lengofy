import { BaseGameMessage, BaseGameState } from '../../core/types';

export interface VCSPrompt {
  pronoun: { id: number; code: string; display: string };
  verb: { id: number; infinitive: string; translation?: string | null };
  tense: { id: number; code: string; name: string };
  expected: string;
  normalized_expected: string;
}

export interface VerbConjugationSlotGameState extends BaseGameState {
  status: 'waiting' | 'in_progress' | 'completed';
  players: {
    id: string;
    user_id: string;
    player_name: string;
    score: number;
    is_ready?: boolean;
    is_host?: boolean;
  }[];
  prompts: VCSPrompt[];
  current_round: number;
  total_rounds: number;
  current_prompt: VCSPrompt | null;
  last_answer: {
    playerId: string;
    userId: string;
    player_name: string;
    answer: string;
    correct: boolean;
  } | null;
  max_players: number;
  hostId: string;
}

export interface VerbConjugationSlotGameMessage extends BaseGameMessage {
  type:
    // incoming commands (prefixed)
    | 'verb_conjugation_slot_join_game'
    | 'verb_conjugation_slot_game_created'
    | 'verb_conjugation_slot_player_ready'
    | 'verb_conjugation_slot_start_spin'
    | 'verb_conjugation_slot_submit_conjugation'
    | 'verb_conjugation_slot_restart_game'
    | 'verb_conjugation_slot_round_timeout'
    | 'verb_conjugation_slot_leave_game'
    | 'verb_conjugation_slot_game_end'
    // outgoing events
    | 'spin_result'
    | 'answer_submitted'
    | 'verb_conjugation_slot_game_state_updated';
  gameId: string;
  userId: string;
  game?: VerbConjugationSlotGameState;
  data?: {
    player_id?: string;
    user_id?: string;
    player_name?: string;
    players?: any[];
    prompts?: VCSPrompt[];
    max_players?: number;
    total_rounds?: number;
    hostId?: string;
  };
}
