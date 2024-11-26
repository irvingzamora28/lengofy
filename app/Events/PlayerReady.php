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

class PlayerReady implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Game $game,
        public int $player_id
    ) {
        Log::info('PlayerReady event constructed', [
            'game_id' => $game->id,
            'player_id' => $player_id
        ]);
    }

    public function broadcastOn(): array
    {
        Log::info('PlayerReady broadcasting on channel', [
            'channel' => "game.{$this->game->id}"
        ]);
        
        return [
            new PresenceChannel("game.{$this->game->id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'player-ready';
    }

    public function broadcastWith(): array
    {
        return [
            'player_id' => $this->player_id,
            'game_id' => $this->game->id
        ];
    }
}
