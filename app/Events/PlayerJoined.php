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

class PlayerJoined implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Game $game,
        public GamePlayer $player
    ) {
        Log::info('PlayerJoined event constructed', [
            'game_id' => $game->id,
            'player_id' => $player->id,
            'user_id' => $player->user_id
        ]);
    }

    public function broadcastOn(): array
    {
        Log::info('PlayerJoined broadcasting on channel', [
            'channel' => "game.{$this->game->id}"
        ]);
        
        return [
            new PresenceChannel("game.{$this->game->id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'player-joined';
    }

    public function broadcastWith(): array
    {
        Log::info('PlayerJoined broadcasting data', [
            'player' => [
                'id' => $this->player->id,
                'user_id' => $this->player->user_id,
                'player_name' => $this->player->player_name,
                'score' => $this->player->score,
                'is_ready' => $this->player->is_ready,
            ],
            'game_id' => $this->game->id
        ]);

        return [
            'player' => [
                'id' => $this->player->id,
                'user_id' => $this->player->user_id,
                'player_name' => $this->player->player_name,
                'score' => $this->player->score,
                'is_ready' => $this->player->is_ready,
            ],
            'game_id' => $this->game->id
        ];
    }
}
