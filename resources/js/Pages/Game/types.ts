export interface Player {
    id: number;
    player_name: string;
    score: number;
    is_ready: boolean;
    user_id: number;
}

export interface Game {
    id: number;
    players: Player[];
    max_players: number;
    language_name: string;
    language_pair_id: number;
    status: string;
    current_word?: {
        id: number;
        word: string;
        gender: string;
    };
    current_round: number;
    total_rounds: number;
}
