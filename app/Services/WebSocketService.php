<?php

namespace App\Services;

use App\Models\GenderDuelGame;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;

class WebSocketService
{
    private string $wsServerEndpoint;

    public function __construct()
    {
        // Convert WebSocket endpoint to HTTP endpoint for server-side communication
        $wsEndpoint = Config::get('websocket.game_endpoint');
        // Replace ws:// or wss:// with http:// or https:// respectively
        $this->wsServerEndpoint = preg_replace('/^ws(s)?:\/\//', 'http$1://', $wsEndpoint);
        Log::debug('WebSocket server endpoint:', ['endpoint' => $this->wsServerEndpoint]);
    }

    public function broadcastGameCreated(GenderDuelGame $genderDuelGame): void
    {
        try {
            Log::debug('Broadcasting game created event', [
                'game_id' => $genderDuelGame->id,
                'endpoint' => $this->wsServerEndpoint . '/broadcast'
            ]);

            $response = Http::post($this->wsServerEndpoint . '/broadcast', [
                'type' => 'gender-duel-game-created',
                'game' => [
                    'id' => $genderDuelGame->id,
                    'players' => $genderDuelGame->players->map(fn($player) => [
                        'id' => $player->id,
                        'user_id' => $player->user_id,
                        'player_name' => $player->player_name,
                        'score' => $player->score,
                        'is_ready' => $player->is_ready,
                        'is_guest' => $player->guest_id !== null,
                    ]),
                    'max_players' => $genderDuelGame->max_players,
                    'language_name' => "{$genderDuelGame->languagePair->sourceLanguage->name} → {$genderDuelGame->languagePair->targetLanguage->name}",
                    'source_language' => [
                        'id' => $genderDuelGame->languagePair->source_language_id,
                        'code' => $genderDuelGame->languagePair->sourceLanguage->code,
                        'name' => $genderDuelGame->languagePair->sourceLanguage->name,
                    ],
                    'target_language' => [
                        'id' => $genderDuelGame->languagePair->target_language_id,
                        'code' => $genderDuelGame->languagePair->targetLanguage->code,
                        'name' => $genderDuelGame->languagePair->targetLanguage->name,
                    ],
                ]
            ]);

            if (!$response->successful()) {
                Log::error('Failed to broadcast game created event', [
                    'game_id' => $genderDuelGame->id,
                    'response' => $response->body(),
                    'status' => $response->status()
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error broadcasting game created event', [
                'game_id' => $genderDuelGame->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    public function broadcastGameEnded(GenderDuelGame $genderDuelGame): void
    {
        try {
            $response = Http::post($this->wsServerEndpoint . '/broadcast', [
                'type' => 'gender-duel-game-ended',
                'gameId' => $genderDuelGame->id
            ]);

            if (!$response->successful()) {
                Log::error('Failed to broadcast game ended event', [
                    'game_id' => $genderDuelGame->id,
                    'response' => $response->body()
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error broadcasting game ended event', [
                'game_id' => $genderDuelGame->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}
