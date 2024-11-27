<?php

namespace App\Events;

use App\Models\Game;
use App\Models\GamePlayer;
use Illuminate\Broadcasting\Channel;
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
        public GamePlayer $player
    ) {
        Log::info('PlayerLeft event constructed', [
            'game_id' => $game->id,
            'player_id' => $player->id,
            'user_id' => $player->user_id
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
        return [
            'game_id' => $this->game->id,
            'player_id' => $this->player->id,
            'user_id' => $this->player->user_id
        ];
    }
}
