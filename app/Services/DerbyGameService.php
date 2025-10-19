<?php

namespace App\Services;

use App\Models\DerbyGame;
use App\Models\LanguagePair;
use App\Models\Noun;
use App\Models\User;
use App\Services\Contracts\GameService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * @implements GameService<DerbyGame>
 */
class DerbyGameService implements GameService
{
    public function createGame(
        ?User $user,
        string $language_pair_id,
        int $max_players,
        string $difficulty,
        string $race_mode = 'time',
        int $race_duration_s = 120,
        int $total_segments = 20,
        ?array $noun_list_ids = null,
        ?array $verb_list_ids = null,
        ?array $lesson_ids = null
    ): Model {
        return DB::transaction(function () use (
            $user,
            $language_pair_id,
            $max_players,
            $difficulty,
            $race_mode,
            $race_duration_s,
            $total_segments,
            $noun_list_ids,
            $verb_list_ids,
            $lesson_ids
        ) {
            $game = DerbyGame::create([
                'status' => 'waiting',
                'max_players' => $max_players,
                'race_mode' => $race_mode,
                'race_duration_s' => $race_duration_s,
                'total_segments' => $total_segments,
                'language_pair_id' => $language_pair_id,
                'creator_id' => $user?->id,
                'difficulty' => $difficulty,
                'noun_list_ids' => $noun_list_ids,
                'verb_list_ids' => $verb_list_ids,
                'lesson_ids' => $lesson_ids,
            ]);

            $this->addPlayer($game, $user);
            $game->load(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage']);

            return $game;
        });
    }

    public function createPracticeGame(?User $user, string $language_pair_id, string $difficulty, string $category): Model
    {
        return DB::transaction(function () use ($user, $language_pair_id, $difficulty) {
            $game = DerbyGame::create([
                'status' => 'waiting',
                'max_players' => 1,
                'race_mode' => 'time',
                'race_duration_s' => 120,
                'total_segments' => 20,
                'language_pair_id' => $language_pair_id,
                'creator_id' => $user?->id,
                'difficulty' => $difficulty,
                'noun_list_ids' => null,
                'verb_list_ids' => null,
                'lesson_ids' => null,
            ]);

            $this->addPlayer($game, $user);
            $this->markPlayerReady($game, $user->id);

            return $game;
        });
    }

    public function joinGame(Model $game, ?User $user): void
    {
        if (!$game instanceof DerbyGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }

        if ($game->players()->count() >= $game->max_players) {
            throw new \Exception('Game is full');
        }

        $this->addPlayer($game, $user);
    }

    public function addPlayer(Model $game, ?User $user): void
    {
        if (!$game instanceof DerbyGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }

        Log::info('Adding player to derby game: ' . $game->id . ' for user: ' . ($user ? $user->name : 'guest'));

        $game->players()->create([
            'user_id' => $user?->id,
            'player_name' => $user?->name ?? 'Guest ' . Str::random(6),
            'score' => 0,
            'progress' => 0.0,
            'is_ready' => false,
        ]);
    }

    public function markPlayerReady(Model $game, int $userId): void
    {
        if (!$game instanceof DerbyGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }

        $player = $game->players()->where('user_id', $userId)->first();

        if (!$player) {
            throw new \Exception('Player not found in this game');
        }

        $player->update(['is_ready' => true]);

        // Check if all players are ready to start the game
        if ($game->players()->where('is_ready', false)->doesntExist()) {
            $game->update(['status' => 'in_progress']);
        }
    }

    public function endGame(Model $game): void
    {
        if (!$game instanceof DerbyGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }

        $game->update(['status' => 'completed']);
    }

    public function leaveGame(Model $game, User $user): bool
    {
        if (!$game instanceof DerbyGame) {
            throw new \InvalidArgumentException('Invalid game type');
        }

        $this->removePlayer($game, $user);

        // Check if the game should end
        if ($game->players()->count() === 0) {
            $this->endGame($game);
            return true;
        }
        // If game was in progress and not enough players, end it
        else if ($game->status === 'in_progress' && $game->players()->count() < 2) {
            $this->endGame($game);
            return true;
        }

        return false;
    }

    private function removePlayer(DerbyGame $game, User $user): void
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

    /**
     * Get prompts for the derby game based on filters
     */
    public function getGamePrompts(DerbyGame $game, int $count = 50, array $taskTypes = ['article_gender', 'translation', 'verb_conjugation'], ?array $tenseIds = null): array
    {
        $languagePair = LanguagePair::with('targetLanguage', 'sourceLanguage')->findOrFail($game->language_pair_id);

        $query = Noun::where('language_id', $languagePair->target_language_id)
            ->whereNotNull('gender'); // Only get nouns with gender/article

        // Apply category filter if provided
        if (!empty($game->category_id)) {
            $query->whereHas('categories', function ($q) use ($game) {
                $q->where('category_id', $game->category_id);
            });
        }

        // Apply noun list filters if provided
        if (!empty($game->noun_list_ids)) {
            $query->whereHas('nounLists', function ($q) use ($game) {
                $q->whereIn('noun_list_id', $game->noun_list_ids);
            });
        }

        // Apply lesson filters if provided
        if (!empty($game->lesson_ids)) {
            $query->whereHas('lessons', function ($q) use ($game) {
                $q->whereIn('lesson_id', $game->lesson_ids);
            });
        }

        // Get nouns for noun-based tasks
        $nouns = collect();
        if (in_array('article_gender', $taskTypes) || in_array('translation', $taskTypes)) {
            $nouns = $query->with(['translations' => function ($query) use ($languagePair) {
                    $query->where('language_id', $languagePair->source_language_id);
                }])
                ->inRandomOrder()
                ->limit($count * 2)
                ->get();
        }

        // Get verbs for verb conjugation tasks
        $verbs = collect();
        if (in_array('verb_conjugation', $taskTypes)) {
            $verbQuery = \App\Models\Verb::where('language_id', $languagePair->target_language_id);
            
            // Apply verb list filter if provided
            if (!empty($game->verb_list_ids)) {
                // Filter by the related VerbList model id
                $ids = is_array($game->verb_list_ids) ? $game->verb_list_ids : [$game->verb_list_ids];
                $verbQuery->whereHas('verbLists', function ($q) use ($ids) {
                    $q->whereIn('verb_lists.id', $ids);
                });
            }
            
            $verbs = $verbQuery->with(['conjugations.tense', 'conjugations.pronoun'])
                ->inRandomOrder()
                ->limit($count)
                ->get();
        }

        $prompts = [];
        $genderOptions = $languagePair->grammar_rules['gender_options'] ?? [];
        $taskTypesCycle = array_values($taskTypes);
        $taskIndex = 0;
        $nounIndex = 0;
        $verbIndex = 0;
        $maxAttempts = $count * 20; // Prevent infinite loops
        $attempts = 0;
        $skippedTasks = []; // Track which tasks have been exhausted
        
        // Track used tense/pronoun combinations to ensure variety
        $usedCombinations = [];
        
        while (count($prompts) < $count && $attempts < $maxAttempts) {
            $attempts++;
            $currentTaskType = $taskTypesCycle[$taskIndex % count($taskTypesCycle)];
            $taskIndex++;
            
            // Skip if this task type is exhausted
            if (in_array($currentTaskType, $skippedTasks)) {
                continue;
            }
            
            if ($currentTaskType === 'article_gender') {
                if ($nounIndex >= $nouns->count()) {
                    continue;
                }
                
                $noun = $nouns[$nounIndex++];
                $translation = $noun->translations->first()?->translation ?? null;
                
                if (!$translation || empty($genderOptions)) {
                    continue;
                }
                
                $correctArticle = $noun->gender;
                if (!in_array($correctArticle, $genderOptions)) {
                    continue;
                }
                
                $wrongArticles = array_diff($genderOptions, [$correctArticle]);
                $wrongArticles = array_values($wrongArticles);
                shuffle($wrongArticles);
                $options = array_slice($wrongArticles, 0, min(2, count($wrongArticles)));
                $options[] = $correctArticle;
                shuffle($options);
                
                $prompts[] = [
                    'id' => $noun->id,
                    'word' => $noun->word,
                    'gender' => $noun->gender,
                    'translation' => $translation,
                    'mode' => 'article_gender',
                    'options' => $options,
                    'correct_answer' => $correctArticle,
                ];
            } elseif ($currentTaskType === 'translation') {
                if ($nounIndex >= $nouns->count()) {
                    continue;
                }
                
                $noun = $nouns[$nounIndex++];
                $translation = $noun->translations->first()?->translation ?? null;
                
                if (!$translation) {
                    continue;
                }
                
                $wrongTranslations = $nouns
                    ->where('id', '!=', $noun->id)
                    ->filter(fn($n) => $n->translations->first()?->translation !== null)
                    ->map(fn($n) => $n->translations->first()->translation)
                    ->unique()
                    ->values()
                    ->shuffle()
                    ->take(2)
                    ->toArray();
                
                if (count($wrongTranslations) < 2) {
                    continue;
                }
                
                $options = $wrongTranslations;
                $options[] = $translation;
                shuffle($options);
                
                $prompts[] = [
                    'id' => $noun->id,
                    'word' => $noun->word,
                    'gender' => $noun->gender,
                    'translation' => $translation,
                    'mode' => 'translation',
                    'options' => $options,
                    'correct_answer' => $translation,
                ];
            } elseif ($currentTaskType === 'verb_conjugation') {
                if ($verbIndex >= $verbs->count()) {
                    continue;
                }
                
                $verb = $verbs[$verbIndex++];
                
                if ($verb->conjugations->isEmpty()) {
                    continue;
                }
                
                // Filter conjugations by selected tenses if provided
                $availableConjugations = $verb->conjugations;
                if (!empty($tenseIds)) {
                    $availableConjugations = $availableConjugations->whereIn('tense_id', $tenseIds);
                }
                
                if ($availableConjugations->isEmpty()) {
                    continue;
                }
                
                // Try to find a conjugation with an unused tense/pronoun combination
                $unusedConjugations = $availableConjugations->filter(function($conj) use ($usedCombinations) {
                    $key = $conj->tense_id . '_' . $conj->pronoun_id;
                    return !in_array($key, $usedCombinations);
                });
                
                // If all combinations have been used, reset and use any
                if ($unusedConjugations->isEmpty()) {
                    $usedCombinations = [];
                    $conjugation = $availableConjugations->random();
                } else {
                    $conjugation = $unusedConjugations->random();
                }
                
                // Track this combination
                $combinationKey = $conjugation->tense_id . '_' . $conjugation->pronoun_id;
                $usedCombinations[] = $combinationKey;
                
                // Build wrong options with preference order:
                // (1) Same verb, same tense, different pronouns
                $wrongConjugations = $verb->conjugations
                    ->where('tense_id', $conjugation->tense_id)
                    ->where('pronoun_id', '!=', $conjugation->pronoun_id)
                    ->pluck('form')
                    ->unique()
                    ->shuffle()
                    ->take(2)
                    ->toArray();

                // (2) If still not enough, same verb, other tenses (respect selected tenses if provided)
                if (count($wrongConjugations) < 2) {
                    $needed = 2 - count($wrongConjugations);
                    $pool = $verb->conjugations
                        ->when(!empty($tenseIds), function ($c) use ($tenseIds) {
                            return $c->whereIn('tense_id', $tenseIds);
                        })
                        ->where('id', '!=', $conjugation->id)
                        ->pluck('form')
                        ->unique()
                        ->shuffle()
                        ->take($needed)
                        ->toArray();
                    $wrongConjugations = array_values(array_unique(array_merge($wrongConjugations, $pool)));
                }

                // (3) Fallback: other verbs with same tense+pronoun (previous behavior)
                if (count($wrongConjugations) < 2) {
                    $needed = 2 - count($wrongConjugations);
                    $fallback = $verbs
                        ->where('id', '!=', $verb->id)
                        ->flatMap(fn($v) => $v->conjugations)
                        ->where('tense_id', $conjugation->tense_id)
                        ->where('pronoun_id', $conjugation->pronoun_id)
                        ->pluck('form')
                        ->unique()
                        ->shuffle()
                        ->take($needed)
                        ->toArray();
                    $wrongConjugations = array_values(array_unique(array_merge($wrongConjugations, $fallback)));
                }
                
                if (count($wrongConjugations) < 2) {
                    continue;
                }
                
                $options = $wrongConjugations;
                $options[] = $conjugation->form;
                shuffle($options);
                
                // Get pronoun display text from person and number
                $pronounText = $this->getPronounText($conjugation->pronoun);
                
                $prompts[] = [
                    'id' => $verb->id,
                    'word' => $verb->infinitive,
                    'mode' => 'verb_conjugation',
                    'tense' => $conjugation->tense->name ?? $conjugation->tense_id,
                    'person' => $pronounText,
                    'options' => $options,
                    'correct_answer' => $conjugation->form,
                ];
            }
            
            // Safety break if we run out of content
            if ($nounIndex >= $nouns->count() && $verbIndex >= $verbs->count()) {
                break;
            }
        }
        
        return $prompts;
    }
    
    /**
     * Get pronoun text from pronoun object
     */
    private function getPronounText($pronoun): string
    {
        if (!$pronoun) {
            return '';
        }
        
        // Use the display field from the pronouns table
        return $pronoun->display ?? $pronoun->code ?? '';
    }
}
