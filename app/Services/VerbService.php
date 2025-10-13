<?php

namespace App\Services;

use App\Models\Conjugation;
use App\Models\LanguagePair;
use App\Models\Pronoun;
use App\Models\Tense;
use App\Models\Verb;
use Illuminate\Support\Arr;

class VerbService
{
    /**
     * Return verb pools (easy/medium/hard) for a given language.
     * Heuristic using frequency_rank when available.
     */
    public function getVerbPoolsByDifficulty(int $languageId): array
    {
        // Easy: common verbs (rank <= 50) or top 50 when ranks are missing
        $easy = Verb::where('language_id', $languageId)
            ->when(true, fn ($q) => $q->orderByRaw('CASE WHEN frequency_rank IS NULL THEN 999999 ELSE frequency_rank END ASC'))
            ->limit(50)
            ->get();

        // Medium: next slice (top 200)
        $medium = Verb::where('language_id', $languageId)
            ->when(true, fn ($q) => $q->orderByRaw('CASE WHEN frequency_rank IS NULL THEN 999999 ELSE frequency_rank END ASC'))
            ->limit(200)
            ->get();

        // Hard: all verbs in language
        $hard = Verb::where('language_id', $languageId)->get();

        return [
            'easy' => $easy,
            'medium' => $medium,
            'hard' => $hard,
        ];
    }

    /**
     * Return tense pools (easy/medium/hard) based on order_index
     * Easy: lowest order_index (typically present)
     * Medium: include a couple basics (e.g., present + past)
     * Hard: all available
     */
    public function getTensePoolsByDifficulty(int $languageId): array
    {
        $tenses = Tense::where('language_id', $languageId)
            ->orderBy('order_index')
            ->get();

        if ($tenses->isEmpty()) {
            return ['easy' => collect(), 'medium' => collect(), 'hard' => collect()];
        }

        $minIndex = $tenses->min('order_index');
        $secondIndex = $tenses->pluck('order_index')->unique()->sort()->skip(1)->first();

        $easy = $tenses->where('order_index', $minIndex);
        $medium = $tenses->whereIn('order_index', Arr::where([
            $minIndex,
            $secondIndex,
        ], fn ($v) => $v !== null));
        $hard = $tenses;

        return [
            'easy' => $easy->values(),
            'medium' => $medium->values(),
            'hard' => $hard->values(),
        ];
    }

    /**
     * Get a random prompt within difficulty constraints for the target language in the pair.
     * Returns: [pronoun, verb, tense, expected, translation]
     */
    public function getRandomPrompt(int $languagePairId, string $difficulty, ?int $verbListId = null): ?array
    {
        $pair = LanguagePair::findOrFail($languagePairId);
        $languageId = $pair->target_language_id; // practice on target language

        // If a verb list is specified, use only verbs from that list
        if ($verbListId) {
            $verbs = \App\Models\VerbList::findOrFail($verbListId)
                ->verbs()
                ->where('language_id', $languageId)
                ->get();
        } else {
            $verbPools = $this->getVerbPoolsByDifficulty($languageId);
            $difficulty = in_array($difficulty, ['easy', 'medium', 'hard']) ? $difficulty : 'medium';
            $verbs = $verbPools[$difficulty] ?? collect();
        }

        $tensePools = $this->getTensePoolsByDifficulty($languageId);
        $pronouns = Pronoun::where('language_id', $languageId)->orderBy('order_index')->get();

        $difficulty = in_array($difficulty, ['easy', 'medium', 'hard']) ? $difficulty : 'medium';
        $tenses = $tensePools[$difficulty] ?? collect();

        if ($verbs->isEmpty() || $tenses->isEmpty() || $pronouns->isEmpty()) {
            return null;
        }

        // Try a handful of times to find a conjugation that exists
        for ($i = 0; $i < 25; $i++) {
            $verb = $verbs->random();
            $tense = $tenses->random();
            $pronoun = $pronouns->random();

            $conj = Conjugation::where('verb_id', $verb->id)
                ->where('tense_id', $tense->id)
                ->where('pronoun_id', $pronoun->id)
                ->first();

            if ($conj) {
                return [
                    'pronoun' => [
                        'id' => $pronoun->id,
                        'code' => $pronoun->code,
                        'display' => $pronoun->display,
                    ],
                    'verb' => [
                        'id' => $verb->id,
                        'infinitive' => $verb->infinitive,
                        'translation' => $verb->translation,
                    ],
                    'tense' => [
                        'id' => $tense->id,
                        'code' => $tense->code,
                        'name' => $tense->name,
                    ],
                    'expected' => $conj->form,
                    'normalized_expected' => $conj->normalized_form,
                ];
            }
        }

        return null;
    }

    /**
     * Normalize a text for matching user input to expected forms.
     */
    public function normalize(string $text): string
    {
        return Conjugation::normalize($text);
    }
}
