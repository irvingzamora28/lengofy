<?php

namespace App\Services;

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

    public function __construct()
    {
    }

    public function createGame(?User $user, string $language_pair_id, int $max_players, string $difficulty, string $category): GenderDuelGame
    {
        return DB::transaction(function () use ($user, $language_pair_id, $max_players, $difficulty, $category) {
            $genderDuelGame = GenderDuelGame::create([
                'status' => GenderDuelGameStatus::WAITING,
                'max_players' => $max_players,
                'total_rounds' => 10,
                'language_pair_id' => $language_pair_id,
                'creator_id' => $user?->id,
                'difficulty' => $difficulty,
                'category_id' => $category,
            ]);

            $this->addPlayer($genderDuelGame, $user);
            $genderDuelGame->load(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage']);

            return $genderDuelGame;
        });
    }

    public function createPracticeGame(?User $user, string $language_pair_id, string $difficulty, string $category): GenderDuelGame
    {
        return DB::transaction(function () use ($user, $language_pair_id, $difficulty, $category) {
            // Create a practice game with a single player
            $genderDuelGame = GenderDuelGame::create([
                'status' => GenderDuelGameStatus::WAITING,
                'max_players' => 1,
                'total_rounds' => 10,
                'language_pair_id' => $language_pair_id,
                'creator_id' => $user?->id,
                'difficulty' => $difficulty,
                'category_id' => $category,
            ]);

            $this->addPlayer($genderDuelGame, $user);
            $this->markPlayerReady($genderDuelGame, $user->id);

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
    }

    private function endGame(GenderDuelGame $genderDuelGame): void
    {
        $genderDuelGame->update(['status' => GenderDuelGameStatus::ENDED]);
    }

    public function leaveGame(GenderDuelGame $genderDuelGame, User $user): bool
    {
        // Logic for a user leaving the game
        $this->removePlayer($genderDuelGame, $user);

        // Check if the game should end
        if ($genderDuelGame->players()->count() === 0) {
            $this->endGame($genderDuelGame);
            return true; // Game has ended
        }
        // If game was in progress and not enough players, end it
        else if ($genderDuelGame->status === GenderDuelGameStatus::IN_PROGRESS && $genderDuelGame->players()->count() < 2) {
            $this->endGame($genderDuelGame);
            return true; // Game has ended
        }

        return false; // Game is still ongoing
    }

    private function removePlayer(GenderDuelGame $genderDuelGame, User $user): void
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

    }

    public function getGameWords(GenderDuelGame $genderDuelGame): array
    {
        $languagePair = LanguagePair::with('targetLanguage')->findOrFail($genderDuelGame->language_pair_id);

        $query = Noun::where('language_id', $languagePair->target_language_id);
        if ($genderDuelGame->category_id !== 0) {
            $query->whereHas('categories', function ($query) use ($genderDuelGame) {
                $query->where('category_id', $genderDuelGame->category_id);
            });
        }
        return $query->inRandomOrder()
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
