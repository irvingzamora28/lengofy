<?php

namespace App\Events;

use App\Models\Game;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class PlayerLeft implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Game $game,
        public int $playerId,
        public int $userId
    ) {
        Log::info('PlayerLeft event constructed', [
            'game_id' => $game->id,
            'player_id' => $playerId,
            'user_id' => $userId
        ]);
    }

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel("game.{$this->game->id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'player-left';
    }

    public function broadcastWith(): array
    {
        Log::info('PlayerLeft broadcasting data', [
            'game_id' => $this->game->id,
            'player_id' => $this->playerId,
            'user_id' => $this->userId
        ]);
        return [
            'game_id' => $this->game->id,
            'player_id' => $this->playerId,
            'user_id' => $this->userId
        ];
    }
}
