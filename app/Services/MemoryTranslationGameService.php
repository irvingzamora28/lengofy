<?php

namespace App\Services;

use App\Enums\MemoryTranslationGameStatus;
use App\Models\MemoryTranslationGame;
use App\Models\User;
use App\Services\Contracts\GameService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * @implements GameService<MemoryTranslationGame>
 */
class MemoryTranslationGameService implements GameService
{
    private const POINTS_CORRECT = 10;
    private const POINTS_INCORRECT = -5;

    /**
     * Creates a new Memory Translation game.
     *
     * @param User|null $user The user creating the game, or null for a guest.
     * @param string $language_pair_id The ID of the language pair for the game.
     * @param int $max_players The maximum number of players for the game.
     * @param string $difficulty The difficulty level of the game.
     * @param string $category The category of the game.
     * @return Model The newly created game.
     */
    public function createGame(?User $user, string $language_pair_id, int $max_players, string $difficulty, string $category): Model
    {
        return DB::transaction(function () use ($user, $language_pair_id, $max_players, $difficulty, $category) {
            $game = MemoryTranslationGame::create([
                'status' => 'waiting',
                'max_players' => $max_players,
                'language_pair_id' => $language_pair_id,
                'creator_id' => $user?->id,
                'difficulty' => $difficulty,
                'category_id' => $category,
            ]);

            $this->addPlayer($game, $user);
            $game->load(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage']);

            return $game;
        });
    }

    /**
     * Creates a new practice Memory Translation game.
     *
     * @param User|null $user The user creating the game, or null for a guest.
     * @param string $language_pair_id The ID of the language pair for the game.
     * @param string $difficulty The difficulty level of the game.
     * @param string $category The category of the game.
     * @return Model The newly created game.
     */
    public function createPracticeGame(?User $user, string $language_pair_id, string $difficulty, string $category): Model
    {
        return DB::transaction(function () use ($user, $language_pair_id, $difficulty, $category) {
            $game = MemoryTranslationGame::create([
                'status' => 'waiting',
                'max_players' => 1,
                'language_pair_id' => $language_pair_id,
                'creator_id' => $user?->id,
                'difficulty' => $difficulty,
                'category_id' => $category,
            ]);

            $this->addPlayer($game, $user);
            return $game;
        });
    }

    /**
     * Joins a Memory Translation game.
     *
     * @param Model $game The game to join.
     * @param User|null $user The user joining the game, or null for a guest.
     * @throws \Exception If the game is full.
     */
    public function joinGame(Model $game, ?User $user): void
    {
        if (!$game instanceof MemoryTranslationGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }

        if ($game->players()->count() >= $game->max_players) {
            throw new \Exception('Game is full');
        }

        $this->addPlayer($game, $user);
    }

    /**
     * Adds a player to a Memory Translation game.
     *
     * @param Model $game The game to add the player to.
     * @param User|null $user The user to add, or null for a guest.
     */
    public function addPlayer(Model $game, ?User $user): void
    {
        if (!$game instanceof MemoryTranslationGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }

        Log::info('Adding player to memory translation game: ' . $game->id . ' for user: ' . ($user ? $user->name : 'guest'));

        $game->players()->create([
            'user_id' => $user?->id,
            'player_name' => $user?->name ?? 'Guest ' . Str::random(6),
            'score' => 0,
            'moves' => 0,
            'time' => 0,
            'is_ready' => false,
        ]);
    }

    /**
     * Marks a player as ready in a Memory Translation game.
     *
     * @param Model $game The game to mark the player as ready in.
     * @param int $userId The ID of the user to mark as ready.
     * @throws \Exception If the player is not found in the game.
     */
    public function markPlayerReady(Model $game, int $userId): void
    {
        if (!$game instanceof MemoryTranslationGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }

        $player = $game->players()->where('user_id', $userId)->first();

        if (!$player) {
            throw new \Exception('Player not found in this game');
        }

        $player->update(['is_ready' => true]);

        // Check if all players are ready to start the game
        if ($game->players()->where('is_ready', false)->doesntExist()) {
            $game->update(['status' => MemoryTranslationGameStatus::IN_PROGRESS]);
        }
    }

    /**
     * Ends a Memory Translation game.
     *
     * @param Model $game The game to end.
     */
    public function endGame(Model $game): void
    {
        if (!$game instanceof MemoryTranslationGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }

        $game->update(['status' => MemoryTranslationGameStatus::ENDED]);
    }

    /**
     * Leaves a Memory Translation game.
     *
     * @param Model $game The game to leave.
     * @param User $user The user leaving the game.
     * @return bool Whether the game was ended as a result of the user leaving.
     */
    public function leaveGame(Model $game, User $user): bool
    {
        if (!$game instanceof MemoryTranslationGame) {
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
        else if ($game->status === MemoryTranslationGameStatus::IN_PROGRESS && $game->players()->count() < 2) {
            $this->endGame($game);
            return true; // Game has ended
        }

        return false; // Game is still ongoing
    }

    private function removePlayer(MemoryTranslationGame $memoryTranslationGame, User $user): void
    {
        Log::info('Player leaving game', [
            'game_id' => $memoryTranslationGame->id,
            'user_id' => $user->id
        ]);

        $player = $memoryTranslationGame->players()->where('user_id', $user->id)->first();

        if (!$player) {
            Log::warning('Player not found in game', [
                'game_id' => $memoryTranslationGame->id,
                'user_id' => $user->id
            ]);
            return;
        }

        // Remove the player
        $playerId = $player->id;
        $player->delete();

    }

    /**
     * Updates a player's score in a Memory Translation game.
     *
     * @param MemoryTranslationGame $game The game to update the score in.
     * @param int $userId The ID of the user to update the score for.
     * @param int $score The new score.
     * @param int $moves The new number of moves.
     * @param int $time The new time.
     */
    public function updatePlayerScore(MemoryTranslationGame $game, int $userId, int $score, int $moves, int $time): void
    {
        $player = $game->players()->where('user_id', $userId)->first();
        if ($player) {
            $player->update([
                'score' => $score,
                'moves' => $moves,
                'time' => $time,
            ]);
        }
    }
}
