<?php

namespace App\Events;

use App\Models\GenderDuelGame;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenderDuelGameEnded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public GenderDuelGame $genderDuelGame
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('gender-duel-game'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'gender-duel-game-ended';
    }

    public function broadcastWith(): array
    {
        Log::info('GenderDuelGameEnded broadcasting data', [
            'game_id' => $this->genderDuelGame->id,
        ]);
        return [
            'gameId' => $this->genderDuelGame->id,
        ];
    }
}
