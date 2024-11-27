<?php

namespace App\Services;

use App\Events\GameEnded;
use App\Events\GameStarted;
use App\Events\NextRound;
use App\Events\PlayerLeft;
use App\Models\Game;
use App\Models\GamePlayer;
use App\Models\Noun;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GameService
{
    public function createGame(?User $user, string $language_pair_id, int $max_players): Game
    {
        return DB::transaction(function () use ($user, $language_pair_id, $max_players) {
            $game = Game::create([
                'status' => 'waiting',
                'max_players' => $max_players,
                'total_rounds' => 10,
                'language_pair_id' => $language_pair_id,
                'creator_id' => $user?->id,
            ]);

            $this->addPlayer($game, $user);

            return $game;
        });
    }

    public function joinGame(Game $game, ?User $user): void
    {
        if ($game->players()->count() >= $game->max_players) {
            throw new \Exception('Game is full');
        }

        $this->addPlayer($game, $user);
    }

    private function addPlayer(Game $game, ?User $user): void
    {
        Log::info('Adding player to game: ' . $game->id. ' for user: ' . ($user ? $user->name : 'guest'));
        $game->players()->create([
            'user_id' => $user?->id,
            'guest_id' => $user ? null : Str::uuid(),
            'player_name' => $user?->name ?? 'Guest ' . Str::random(6),
            'score' => 0,
            'is_ready' => false,
        ]);
    }

    public function markPlayerReady(Game $game, int $userId): void
    {
        $player = $game->players()->where('user_id', $userId)->firstOrFail();
        $player->update(['is_ready' => true]);

        if ($game->players()->count() >= 2 && $game->players()->where('is_ready', true)->count() === $game->players()->count()) {
            $this->startGame($game);
        }
    }

    private function startGame(Game $game): void
    {
        $game->update([
            'status' => 'in_progress',
            'current_round' => 1,
            'current_word' => $this->getRandomWord($game->language_pair_id),
        ]);

        broadcast(new GameStarted($game));
    }

    public function submitAnswer(Game $game, int $userId, string $answer): array
    {
        $player = $game->players()->where('user_id', $userId)->firstOrFail();
        $currentWord = $game->current_word;

        $isCorrect = $currentWord['gender'] === $answer;
        $points = $isCorrect ? 10 : -5;

        $player->increment('score', $points);

        $answeredCount = $game->players()->where('answered_round', $game->current_round)->count();
        if ($answeredCount === $game->players()->count()) {
            $this->nextRound($game);
        }

        return [
            'correct' => $isCorrect,
            'points' => $points,
            'newScore' => $player->score,
            'translation' => $currentWord['translation'], // Show translation after answering
        ];
    }

    private function nextRound(Game $game): void
    {
        if ($game->current_round >= $game->total_rounds) {
            $this->endGame($game);
            return;
        }

        $game->increment('current_round');
        $game->update(['current_word' => $this->getRandomWord($game->language_pair_id)]);

        broadcast(new NextRound($game));
    }

    private function endGame(Game $game): void
    {
        $game->update(['status' => 'completed']);

        broadcast(new GameEnded($game));
    }

    public function leaveGame(Game $game, User $user): void
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

        // Remove the player
        $player->delete();

        // Create and dispatch the event with just the IDs
        broadcast(new PlayerLeft($game, $player->id, $player->user_id));

        // If this was the last player, end the game
        if ($game->players()->count() === 0) {
            $game->update(['status' => 'completed']);
            broadcast(new GameEnded($game));
        }
        // If game was in progress and not enough players, end it
        else if ($game->status === 'in_progress' && $game->players()->count() < 2) {
            $game->update(['status' => 'completed']);
            broadcast(new GameEnded($game));
        }
    }

    private function getRandomWord(string $language_pair_id): array
    {
        $word = Noun::inRandomOrder()->first();
        return [
            'id' => $word->id,
            'word' => $word->word,
            'gender' => $word->gender,
            'translation' => $word->getTranslation($language_pair_id),
        ];
    }
}
