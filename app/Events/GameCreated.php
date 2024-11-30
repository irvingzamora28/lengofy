<?php

namespace App\Events;

use App\Models\Game;
use App\Services\LanguageService;
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
        public Game $game,
        private LanguageService $languageService = new LanguageService(),
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
                'source_language' => [
                    'code' => $game->languagePair->sourceLanguage->code,
                    'name' => $game->languagePair->sourceLanguage->name,
                    'flag' => $this->languageService->getFlag($game->languagePair->sourceLanguage->code),
                ],
                'target_language' => [
                    'code' => $game->languagePair->targetLanguage->code,
                    'name' => $game->languagePair->targetLanguage->name,
                    'flag' => $this->languageService->getFlag($game->languagePair->targetLanguage->code),
                ],
            ],
        ];
    }
}
