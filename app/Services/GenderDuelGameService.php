<?php

namespace App\Services;

use App\Enums\GenderDuelGameStatus;
use App\Models\GenderDuelGame;
use App\Models\LanguagePair;
use App\Models\Noun;
use App\Models\User;
use App\Services\Contracts\GameService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * @implements GameService<GenderDuelGame>
 */
class GenderDuelGameService implements GameService
{
    private const POINTS_CORRECT = 10;
    private const POINTS_INCORRECT = -5;

    public function createGame(?User $user, string $language_pair_id, int $max_players, string $difficulty, string $category): Model
    {
        return DB::transaction(function () use ($user, $language_pair_id, $max_players, $difficulty, $category) {
            $game = GenderDuelGame::create([
                'status' => GenderDuelGameStatus::WAITING,
                'max_players' => $max_players,
                'total_rounds' => 10,
                'language_pair_id' => $language_pair_id,
                'creator_id' => $user?->id,
                'difficulty' => $difficulty,
                'category_id' => $category,
            ]);

            $this->addPlayer($game, $user);
            // TODO: Check if this is needed or redundant
            $game->load(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage']);

            return $game;
        });
    }

    public function createPracticeGame(?User $user, string $language_pair_id, string $difficulty, string $category): Model
    {
        return DB::transaction(function () use ($user, $language_pair_id, $difficulty, $category) {
            $game = GenderDuelGame::create([
                'status' => GenderDuelGameStatus::WAITING,
                'max_players' => 1,
                'total_rounds' => 10,
                'language_pair_id' => $language_pair_id,
                'creator_id' => $user?->id,
                'difficulty' => $difficulty,
                'category_id' => $category,
            ]);

            $this->addPlayer($game, $user);
            $this->markPlayerReady($game, $user->id);

            return $game;
        });
    }

    public function joinGame(Model $game, ?User $user): void
    {
        if (!$game instanceof GenderDuelGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }

        if ($game->players()->count() >= $game->max_players) {
            throw new \Exception('Game is full');
        }

        $this->addPlayer($game, $user);
    }

    public function addPlayer(Model $game, ?User $user): void
    {
        if (!$game instanceof GenderDuelGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }

        Log::info('Adding player to gender duel game: ' . $game->id . ' for user: ' . ($user ? $user->name : 'guest'));

        $game->players()->create([
            'user_id' => $user?->id,
            'player_name' => $user?->name ?? 'Guest ' . Str::random(6),
            'score' => 0,
            'is_ready' => false,
        ]);
    }

    public function markPlayerReady(Model $game, int $userId): void
    {
        if (!$game instanceof GenderDuelGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }

        $player = $game->players()->where('user_id', $userId)->first();

        if (!$player) {
            throw new \Exception('Player not found in this game');
        }

        $player->update(['is_ready' => true]);

        // Check if all players are ready to start the game
        if ($game->players()->where('is_ready', false)->doesntExist()) {
            $game->update(['status' => GenderDuelGameStatus::IN_PROGRESS]);
        }
    }

    public function endGame(Model $game): void
    {
        if (!$game instanceof GenderDuelGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }

        $game->update(['status' => GenderDuelGameStatus::ENDED]);
    }

    public function leaveGame(Model $game, User $user): bool
    {
        if (!$game instanceof GenderDuelGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }

        // Logic for a user leaving the game
        $this->removePlayer($game, $user);

        // Check if the game should end
        if ($game->players()->count() === 0) {
            $this->endGame($game);
            return true; // Game has ended
        }
        // If game was in progress and not enough players, end it
        else if ($game->status === GenderDuelGameStatus::IN_PROGRESS && $game->players()->count() < 2) {
            $this->endGame($game);
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

    /**
     * Get words for the gender duel game
     */
    public function getGameWords(GenderDuelGame $game): array
    {
        $languagePair = LanguagePair::with('targetLanguage')->findOrFail($game->language_pair_id);

        $query = Noun::where('language_id', $languagePair->target_language_id);
        if ($game->category_id !== 0) {
            $query->whereHas('categories', function ($query) use ($game) {
                $query->where('category_id', $game->category_id);
            });
        }

        return $query->inRandomOrder()
            ->limit($game->total_rounds)
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
