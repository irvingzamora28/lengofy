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

class PlayerReady implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Game $game,
        public GamePlayer $player
    ) {
        Log::info('PlayerReady event constructed', [
            'game_id' => $game->id,
            'player_id' => $player->id
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
        $player = $this->game->players()->find($this->player->id);
        Log::info('PlayerReady broadcasting data', [
            'player_id' => $this->player->id,
            'game_id' => $this->game->id,
            'player' => $player ? [
                'id' => $player->id,
                'user_id' => $player->user_id,
                'player_name' => $player->player_name
            ] : null
        ]);

        return [
            'player_id' => $this->player->id,
            'game_id' => $this->game->id
        ];
    }
}
