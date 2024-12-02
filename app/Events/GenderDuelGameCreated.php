<?php

namespace App\Events;

use App\Models\GenderDuelGame;
use App\Services\LanguageService;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenderDuelGameCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public GenderDuelGame $genderDuelGame,
        private LanguageService $languageService = new LanguageService(),
    ) {
        Log::info('GenderDuelGameCreated event constructed', [
            'game_id' => $genderDuelGame->id
        ]);
    }

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('gender-duel-game'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'gender-duel-game-created';
    }

    public function broadcastWith(): array
    {
        $genderDuelGame = $this->genderDuelGame->load('players.user');

        return [
            'game' => [
                'id' => $genderDuelGame->id,
                'players' => $genderDuelGame->players->map(fn($player) => [
                    'id' => $player->id,
                    'user_id' => $player->user_id,
                    'player_name' => $player->player_name,
                    'is_ready' => $player->is_ready,
                ]),
                'max_players' => $genderDuelGame->max_players,
                'language_name' => "{$genderDuelGame->languagePair->sourceLanguage->name} → {$genderDuelGame->languagePair->targetLanguage->name}",
                'source_language' => [
                    'code' => $genderDuelGame->languagePair->sourceLanguage->code,
                    'name' => $genderDuelGame->languagePair->sourceLanguage->name,
                    'flag' => $this->languageService->getFlag($genderDuelGame->languagePair->sourceLanguage->code),
                ],
                'target_language' => [
                    'code' => $genderDuelGame->languagePair->targetLanguage->code,
                    'name' => $genderDuelGame->languagePair->targetLanguage->name,
                    'flag' => $this->languageService->getFlag($genderDuelGame->languagePair->targetLanguage->code),
                ],
            ],
        ];
    }
}
