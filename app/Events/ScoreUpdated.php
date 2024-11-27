<?php

namespace App\Events;

use App\Models\Game;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ScoreUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Game $game,
        public array $player
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('game.' . $this->game->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'score-updated';
    }

    public function broadcastWith(): array
    {
        return [
            'player' => $this->player,
        ];
    }
}
