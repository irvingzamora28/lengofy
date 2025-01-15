<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\LanguagePair;
use App\Services\NounService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MemoryTranslationGameController extends Controller
{
    public function __construct(
        private NounService $nounService,
    ) {
    }

    public function practice(Request $request)
    {
        $validated = $request->validate([
            'difficulty' => 'required|in:easy,medium,hard',
            'category' => 'required|integer|in:0,' . implode(',', Category::pluck('id')->toArray()), // Allow 0 or existing category IDs
        ]);

        $amountOfNouns = match ($validated['difficulty']) {
            'easy' => 10,
            'medium' => 20,
            'hard' => 32,
        };

        $user = auth()->user();
        $languagePair = LanguagePair::with('targetLanguage')->findOrFail($user->language_pair_id);
        $nouns = $this->nounService->getNouns($languagePair->target_language_id, $languagePair->source_language_id, $validated['category'], $amountOfNouns);
        return Inertia::render('MemoryTranslationGame/Practice', [
            'nouns' => $nouns,
            'difficulty' => $validated['difficulty'],
            'category' => $validated['category'],
            'targetLanguage' => $languagePair->targetLanguage->code,
        ]);
    }

    public function getMemoryTranslationWords(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|integer|in:0,' . implode(',', Category::pluck('id')->toArray()), // Allow 0 or existing category IDs
        ]);

        $user = auth()->user();
        $languagePair = LanguagePair::with('targetLanguage')->findOrFail($user->language_pair_id);
        $nouns = $this->nounService->getNouns($languagePair->target_language_id, $languagePair->source_language_id, $validated['category'], 10);
        return response()->json($nouns);
    }
}
