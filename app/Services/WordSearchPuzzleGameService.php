<?php

namespace App\Services;

use App\Models\User;
use App\Models\WordSearchPuzzleGame;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WordSearchPuzzleGameService
{
    /**
     * Joins a Word Search Puzzle game.
     *
     * @param Model $game The game to join.
     * @param User|null $user The user joining the game, or null for a guest.
     * @throws \Exception If the game is full.
     */
    public function joinGame(Model $game, ?User $user): void
    {
        if (!$game instanceof WordSearchPuzzleGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }

        if ($game->players()->count() >= $game->max_players) {
            throw new \Exception('Game is full');
        }

        $this->addPlayer($game, $user);
    }

    /**
     * Adds a player to a Word Search Puzzle game.
     *
     * @param Model $game The game to add the player to.
     * @param User|null $user The user to add, or null for a guest.
     */
    private function addPlayer(Model $game, ?User $user): void
    {
        if (!$game instanceof WordSearchPuzzleGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }

        Log::info('Adding player to word search puzzle game: ' . $game->id . ' for user: ' . ($user ? $user->name : 'guest'));

        $game->players()->create([
            'user_id' => $user?->id,
            'is_ready' => false,
            'score' => 0,
        ]);
    }

    /**
     * Marks a player as ready in a Word Search Puzzle game.
     *
     * @param WordSearchPuzzleGame $game The game.
     * @param int $userId The user ID.
     * @throws \Exception If player is not found in the game.
     */
    public function markPlayerReady(WordSearchPuzzleGame $game, int $userId): void
    {
        $player = $game->players()->where('user_id', $userId)->first();

        if (!$player) {
            throw new \Exception('Player not found in game');
        }

        $player->update(['is_ready' => true]);
    }

    /**
     * Handles a player leaving the game.
     *
     * @param WordSearchPuzzleGame $game The game.
     * @param User $user The user leaving the game.
     * @return bool Whether the game has ended.
     */
    public function leaveGame(WordSearchPuzzleGame $game, User $user): bool
    {
        $this->removePlayer($game, $user);

        // If game was in progress and not enough players, end it
        if ($game->status === 'in_progress' && $game->players()->count() < 2) {
            $game->update(['status' => 'completed']);
            return true;
        }

        return false;
    }

    /**
     * Removes a player from a Word Search Puzzle game.
     *
     * @param WordSearchPuzzleGame $game The game.
     * @param User $user The user to remove.
     */
    private function removePlayer(WordSearchPuzzleGame $game, User $user): void
    {
        Log::info('Player leaving game', [
            'game_id' => $game->id,
            'user_id' => $user->id
        ]);

        $player = $game->players()->where('user_id', $user->id)->first();

        if (!$player) {
            Log::warning('Player not found in game', [
                'game_id' => $game->id,
                'user_id' => $user->id
            ]);
            return;
        }

        $player->delete();
    }
}
