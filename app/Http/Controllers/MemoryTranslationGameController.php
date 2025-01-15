<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\LanguagePair;
use App\Models\MemoryTranslationGame;
use App\Services\LanguageService;
use App\Services\NounService;
use Illuminate\Http\Request;
use Inertia\Response;
use Inertia\Inertia;

class MemoryTranslationGameController extends Controller
{
    public function __construct(
        private NounService $nounService,
        private LanguageService $languageService,
    ) {
    }

    public function lobby(): Response
    {
        $user = auth()->user();

        return Inertia::render('MemoryTranslationGame/Lobby', [
            'activeGames' => MemoryTranslationGame::where('status', 'waiting')
                ->where('language_pair_id', $user->language_pair_id)
                ->with(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage'])
                ->get()
                ->map(function ($genderDuelGame) {
                    return [
                        'id' => $genderDuelGame->id,
                        'players' => $genderDuelGame->players,
                        'max_players' => $genderDuelGame->max_players,
                        'language_name' => "{$genderDuelGame->languagePair->sourceLanguage->name} → {$genderDuelGame->languagePair->targetLanguage->name}",
                        'source_language' => [
                            'id' => $genderDuelGame->languagePair->source_language_id,
                            'code' => $genderDuelGame->languagePair->sourceLanguage->code,
                            'name' => $genderDuelGame->languagePair->sourceLanguage->name,
                            'flag' => $this->languageService->getFlag($genderDuelGame->languagePair->sourceLanguage->code),
                        ],
                        'target_language' => [
                            'id' => $genderDuelGame->languagePair->target_language_id,
                            'code' => $genderDuelGame->languagePair->targetLanguage->code,
                            'name' => $genderDuelGame->languagePair->targetLanguage->name,
                            'flag' => $this->languageService->getFlag($genderDuelGame->languagePair->targetLanguage->code),
                        ],
                    ];
                }),
            'wsEndpoint' => config('websocket.game_endpoint'),
        ]);
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
