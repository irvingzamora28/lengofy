<?php

namespace App\Services;

use App\Events\GenderDuelGameCreated;
use App\Events\GenderDuelGameEnded;
use App\Enums\GenderDuelGameStatus;
use App\Models\GenderDuelGame;
use App\Models\LanguagePair;
use App\Models\Noun;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GenderDuelGameService
{
    private const POINTS_CORRECT = 10;
    private const POINTS_INCORRECT = -5;

    public function createGame(?User $user, string $language_pair_id, int $max_players): GenderDuelGame
    {
        return DB::transaction(function () use ($user, $language_pair_id, $max_players) {
            $genderDuelGame = GenderDuelGame::create([
                'status' => GenderDuelGameStatus::WAITING,
                'max_players' => $max_players,
                'total_rounds' => 10,
                'language_pair_id' => $language_pair_id,
                'creator_id' => $user?->id,
            ]);

            $this->addPlayer($genderDuelGame, $user);
            $genderDuelGame->load(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage']);
            broadcast(new GenderDuelGameCreated($genderDuelGame));

            return $genderDuelGame;
        });
    }

    public function joinGame(GenderDuelGame $genderDuelGame, ?User $user): void
    {
        if ($genderDuelGame->players()->count() >= $genderDuelGame->max_players) {
            throw new \Exception('Game is full');
        }

        $this->addPlayer($genderDuelGame, $user);
    }

    private function addPlayer(GenderDuelGame $genderDuelGame, ?User $user): void
    {
        Log::info('Adding player to game: ' . $genderDuelGame->id . ' for user: ' . ($user ? $user->name : 'guest'));
        $player = $genderDuelGame->players()->create([
            'user_id' => $user?->id,
            'guest_id' => $user ? null : Str::uuid(),
            'player_name' => $user?->name ?? 'Guest ' . Str::random(6),
            'score' => 0,
            'is_ready' => false,
        ]);
    }

    public function markPlayerReady(GenderDuelGame $genderDuelGame, int $userId): void
    {
        $player = $genderDuelGame->players()->where('user_id', $userId)->first();

        if (!$player) {
            throw new \Exception('Player not found in this game');
        }

        $player->update(['is_ready' => true]);

        // Check if all players are ready to start the game
        if ($this->areAllPlayersReady($genderDuelGame)) {
            $this->startGame($genderDuelGame);
        }
    }

    private function areAllPlayersReady(GenderDuelGame $genderDuelGame): bool
    {
        return !$genderDuelGame->players()->where('is_ready', false)->exists();
    }

    private function startGame(GenderDuelGame $genderDuelGame): void
    {
        // Only start games that are in waiting status
        if ($genderDuelGame->status !== GenderDuelGameStatus::WAITING) {
            return;
        }

        // Start the game
        $genderDuelGame->update([
            'status' => GenderDuelGameStatus::IN_PROGRESS,
            'current_round' => 1,
        ]);

        // Get first word for the game
        $word = $this->getNextWord($genderDuelGame);
        $genderDuelGame->update(['current_word' => $word]);

        return;
    }

    private function endGame(GenderDuelGame $genderDuelGame): void
    {
        $genderDuelGame->update(['status' => GenderDuelGameStatus::ENDED]);

        broadcast(new GenderDuelGameEnded($genderDuelGame));
    }

    public function leaveGame(GenderDuelGame $genderDuelGame, User $user): void
    {
        Log::info('Player leaving game', [
            'game_id' => $genderDuelGame->id,
            'user_id' => $user->id
        ]);

        $player = $genderDuelGame->players()->where('user_id', $user->id)->first();

        if (!$player) {
            Log::warning('Player not found in game', [
                'game_id' => $genderDuelGame->id,
                'user_id' => $user->id
            ]);
            return;
        }

        // Remove the player
        $playerId = $player->id;
        $player->delete();

        // If this was the last player, end the game
        if ($genderDuelGame->players()->count() === 0) {
            $this->endGame($genderDuelGame);
        }
        // If game was in progress and not enough players, end it
        else if ($genderDuelGame->status === GenderDuelGameStatus::IN_PROGRESS && $genderDuelGame->players()->count() < 2) {
            $this->endGame($genderDuelGame);
        }
    }

    private function getNextWord(GenderDuelGame $genderDuelGame): array
    {
        $languagePair = LanguagePair::with('targetLanguage')->findOrFail($genderDuelGame->language_pair_id);

        // Get a random noun from the target language
        $word = Noun::where('language_id', $languagePair->target_language_id)
                   ->inRandomOrder()
                   ->first();

        if (!$word) {
            throw new \RuntimeException("No words found for target language");
        }

        return [
            'id' => $word->id,
            'word' => $word->word,
            'gender' => $word->gender,
            'translation' => $word->getTranslation($languagePair->source_language_id),
        ];
    }

    public function getGameWords(GenderDuelGame $genderDuelGame): array
    {
        $languagePair = LanguagePair::with('targetLanguage')->findOrFail($genderDuelGame->language_pair_id);

        return Noun::where('language_id', $languagePair->target_language_id)
            ->inRandomOrder()
            ->limit($genderDuelGame->total_rounds)
            ->get()
            ->map(fn($noun) => [
                'id' => $noun->id,
                'word' => $noun->word,
                'gender' => $noun->gender,
                'translation' => $noun->translation,
            ])
            ->toArray();
    }
}