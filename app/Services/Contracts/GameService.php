<?php

namespace App\Services\Contracts;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * @template TGame of Model
 */
interface GameService
{
    /**
     * Create a new game instance
     * @param User|null $user
     * @param string $language_pair_id
     * @param int $max_players
     * @param string $difficulty
     * @param string $category
     * @return Model
     */
    public function createGame(?User $user, string $language_pair_id, int $max_players, string $difficulty, string $category): Model;

    /**
     * Create a practice game instance
     * @param User|null $user
     * @param string $language_pair_id
     * @param string $difficulty
     * @param string $category
     * @return Model
     */
    public function createPracticeGame(?User $user, string $language_pair_id, string $difficulty, string $category): Model;

    /**
     * Add a player to an existing game
     * @param Model $game
     * @param User|null $user
     */
    public function joinGame(Model $game, ?User $user): void;

    /**
     * Mark a player as ready in a game
     * @param Model $game
     * @param int $userId
     */
    public function markPlayerReady(Model $game, int $userId): void;

    /**
     * Remove a player from a game
     * @param Model $game
     * @param User $user
     * @return bool
     */
    public function leaveGame(Model $game, User $user): bool;

    /**
     * Add a player to the game
     * @param Model $game
     * @param User|null $user
     */
    public function addPlayer(Model $game, ?User $user): void;

    /**
     * End the game
     * @param Model $game
     */
    public function endGame(Model $game): void;
}
