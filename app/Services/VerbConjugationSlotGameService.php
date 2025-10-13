<?php

namespace App\Services;

use App\Enums\VerbConjugationSlotGameStatus;
use App\Models\LanguagePair;
use App\Models\User;
use App\Models\VerbConjugationSlotGame;
use App\Services\Contracts\GameService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * @implements GameService<VerbConjugationSlotGame>
 */
class VerbConjugationSlotGameService implements GameService
{
    public function __construct(private readonly VerbService $verbService)
    {
    }

    public function createGame(?User $user, string $language_pair_id, int $max_players, string $difficulty, string $category, ?int $verbListId = null): Model
    {
        return DB::transaction(function () use ($user, $language_pair_id, $max_players, $difficulty, $category, $verbListId) {
            $game = VerbConjugationSlotGame::create([
                'status' => VerbConjugationSlotGameStatus::WAITING,
                'max_players' => $max_players,
                'total_rounds' => 10,
                'language_pair_id' => $language_pair_id,
                'creator_id' => $user?->id,
                'difficulty' => $difficulty,
                'category_id' => $category,
                'verb_list_id' => $verbListId,
            ]);

            $this->addPlayer($game, $user);
            $game->load(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage']);

            return $game;
        });
    }

    public function createPracticeGame(?User $user, string $language_pair_id, string $difficulty, string $category): Model
    {
        return DB::transaction(function () use ($user, $language_pair_id, $difficulty, $category) {
            $game = VerbConjugationSlotGame::create([
                'status' => VerbConjugationSlotGameStatus::WAITING,
                'max_players' => 1,
                'total_rounds' => 10,
                'language_pair_id' => $language_pair_id,
                'creator_id' => $user?->id,
                'difficulty' => $difficulty,
                'category_id' => $category,
            ]);

            $this->addPlayer($game, $user);
            if ($user) {
                $this->markPlayerReady($game, $user->id);
            }

            return $game;
        });
    }

    public function joinGame(Model $game, ?User $user): void
    {
        if (!$game instanceof VerbConjugationSlotGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }

        if ($game->players()->count() >= $game->max_players) {
            throw new \Exception('Game is full');
        }

        $this->addPlayer($game, $user);
    }

    public function addPlayer(Model $game, ?User $user): void
    {
        if (!$game instanceof VerbConjugationSlotGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }

        Log::info('Adding player to verb conjugation slot game: ' . $game->id . ' for user: ' . ($user ? $user->name : 'guest'));

        $game->players()->create([
            'user_id' => $user?->id,
            'player_name' => $user?->name ?? 'Guest ' . Str::random(6),
            'score' => 0,
            'is_ready' => false,
        ]);
    }

    public function markPlayerReady(Model $game, int $userId): void
    {
        if (!$game instanceof VerbConjugationSlotGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }

        $player = $game->players()->where('user_id', $userId)->first();
        if (!$player) {
            throw new \Exception('Player not found in this game');
        }

        $player->update(['is_ready' => true]);

        if ($game->players()->where('is_ready', false)->doesntExist()) {
            $game->update(['status' => VerbConjugationSlotGameStatus::IN_PROGRESS]);
        }
    }

    public function leaveGame(Model $game, User $user): bool
    {
        if (!$game instanceof VerbConjugationSlotGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }

        $player = $game->players()->where('user_id', $user->id)->first();
        if ($player) {
            $player->delete();
        }

        if ($game->players()->count() === 0) {
            $this->endGame($game);
            return true;
        } elseif ($game->status === VerbConjugationSlotGameStatus::IN_PROGRESS && $game->players()->count() < 2) {
            $this->endGame($game);
            return true;
        }

        return false;
    }

    public function endGame(Model $game): void
    {
        if (!$game instanceof VerbConjugationSlotGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }
        $game->update(['status' => VerbConjugationSlotGameStatus::ENDED]);
    }

    /**
     * Pre-generate prompts for the given game using VerbService.
     */
    public function getGamePrompts(VerbConjugationSlotGame $game): array
    {
        // Ensure language pair exists
        LanguagePair::findOrFail($game->language_pair_id);

        $prompts = [];
        $tries = 0;
        while (count($prompts) < $game->total_rounds && $tries < ($game->total_rounds * 10)) {
            $prompt = $this->verbService->getRandomPrompt(
                (int) $game->language_pair_id, 
                (string) $game->difficulty,
                $game->verb_list_id
            );
            $tries++;
            if ($prompt) {
                $prompts[] = $prompt;
            }
        }
        return $prompts;
    }
}
