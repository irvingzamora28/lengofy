<?php

namespace App\Events;

use App\Models\Game;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameStarted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Game $game
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('game.' . $this->game->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'game-started';
    }

    public function broadcastWith(): array
    {
        $game = $this->game->load('players.user');

        return [
            'game' => [
                'id' => $game->id,
                'players' => $game->players->map(fn($player) => [
                    'id' => $player->id,
                    'user_id' => $player->user_id,
                    'player_name' => $player->player_name,
                    'is_ready' => $player->is_ready,
                    'score' => $player->score
                ]),
                'current_round' => $game->current_round,
                'current_word' => $game->current_word,
                'status' => $game->status,
                'max_players' => $game->max_players,
                'language_name' => "{$game->languagePair->sourceLanguage->name} → {$game->languagePair->targetLanguage->name}",
            ]
        ];
    }

}
