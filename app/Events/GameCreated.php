<?php

namespace App\Events;

use App\Models\Game;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GameCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Game $game
    ) {
        Log::info('GameCreated event constructed', [
            'game_id' => $game->id
        ]);
    }

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('games'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'game-created';
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
                ]),
                'max_players' => $game->max_players,
                'language_name' => "{$game->languagePair->sourceLanguage->name} → {$game->languagePair->targetLanguage->name}",
            ]
        ];
    }
}
