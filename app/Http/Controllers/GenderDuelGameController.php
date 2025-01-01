<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\GenderDuelGame;
use App\Models\LanguagePair;
use App\Services\GenderDuelGameService;
use App\Services\LanguageService;
use App\Services\NounService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GenderDuelGameController extends Controller
{
    public function __construct(
        private GenderDuelGameService $genderDuelGameService,
        private LanguageService $languageService,
        private NounService $nounService,
    ) {
    }

    public function lobby(): Response
    {
        $user = auth()->user();
        $locale = app()->getLocale();

        return Inertia::render('GenderDuelGame/Lobby', [
            'activeGames' => GenderDuelGame::where('status', 'waiting')
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
                            'code' => $genderDuelGame->languagePair->sourceLanguage->code,
                            'name' => $genderDuelGame->languagePair->sourceLanguage->name,
                            'flag' => $this->languageService->getFlag($genderDuelGame->languagePair->sourceLanguage->code),
                        ],
                        'target_language' => [
                            'code' => $genderDuelGame->languagePair->targetLanguage->code,
                            'name' => $genderDuelGame->languagePair->targetLanguage->name,
                            'flag' => $this->languageService->getFlag($genderDuelGame->languagePair->targetLanguage->code),
                        ],
                    ];
                }),
            'translations' => [
                'categories' => __('categories', [], $locale),
            ],
        ]);
    }


    public function create(Request $request)
    {
        $validated = $request->validate([
            'language_pair_id' => 'required|exists:language_pairs,id',
            'max_players' => 'required|integer|min:2|max:10',
            'difficulty' => 'required|in:easy,medium,hard',
            'category' => 'required|integer|in:0,' . implode(',', Category::pluck('id')->toArray()), // Allow 0 or existing category IDs
        ]);

        $genderDuelGame = $this->genderDuelGameService->createGame(
            auth()->user(),
            $validated['language_pair_id'],
            $validated['max_players'],
            $validated['difficulty'],
            $validated['category'],
        );
        return redirect()->route('games.gender-duel.show', ['genderDuelGame' => $genderDuelGame]);
    }

    public function show(GenderDuelGame $genderDuelGame)
    {
        // Load genderDuelGame data with relationships
        $genderDuelGame->load(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage']);

        // Get words for the genderDuelGame
        $words = $this->genderDuelGameService->getGameWords($genderDuelGame);

        // Refresh the genderDuelGame instance to get the latest state
        $genderDuelGame->refresh();
        $locale = app()->getLocale();

        return Inertia::render('GenderDuelGame/Show', [
            'gender_duel_game' => [
                'id' => $genderDuelGame->id,
                'status' => $genderDuelGame->status,
                'players' => $genderDuelGame->players->map(fn($player) => [
                    'id' => $player->id,
                    'user_id' => $player->user_id,
                    'player_name' => $player->player_name,
                    'score' => $player->score,
                    'is_ready' => $player->is_ready,
                    'is_guest' => $player->guest_id !== null,
                ]),
                'max_players' => $genderDuelGame->max_players,
                'total_rounds' => $genderDuelGame->total_rounds,
                'difficulty' => $genderDuelGame->difficulty ?? 'medium',
                'language_name' => "{$genderDuelGame->languagePair->sourceLanguage->name} → {$genderDuelGame->languagePair->targetLanguage->name}",
                'words' => $words,
                'hostId' => $genderDuelGame->creator_id,
                'category' => $genderDuelGame->category_id === 0
                    ? (object) ['id' => 0, 'key' => 'all']
                    : Category::find($genderDuelGame->category_id)
            ],
            'translations' => [
                'categories' => __('categories', [], $locale),
            ],
            'wsEndpoint' => config('websocket.game_endpoint'),
        ]);
    }

    public function join(GenderDuelGame $genderDuelGame)
    {
        $user = auth()->user();

        if ($genderDuelGame->language_pair_id !== $user->language_pair_id) {
            return back()->with('error', 'You can only join games that match your selected language pair.');
        }

        if ($genderDuelGame->players()->count() >= $genderDuelGame->max_players) {
            return back()->with('error', 'This genderDuelGame is full.');
        }

        if ($genderDuelGame->players()->where('user_id', $user->id)->exists()) {
            return back()->with('error', 'You are already in this genderDuelGame.');
        }

        try {
            $this->genderDuelGameService->joinGame($genderDuelGame, auth()->user());
            return redirect()->route('games.gender-duel.show', $genderDuelGame);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function ready(GenderDuelGame $genderDuelGame)
    {
        try {
            $this->genderDuelGameService->markPlayerReady($genderDuelGame, auth()->id());
            return to_route('games.gender-duel.show', $genderDuelGame);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function leave(GenderDuelGame $genderDuelGame)
    {
        $this->genderDuelGameService->leaveGame($genderDuelGame, auth()->user());
        return redirect()->route('games.gender-duel.lobby');
    }

    public function practice(Request $request)
    {
        $validated = $request->validate([
            'difficulty' => 'required|in:easy,medium,hard',
            'category' => 'required|integer|in:0,' . implode(',', Category::pluck('id')->toArray()), // Allow 0 or existing category IDs
        ]);

        $user = auth()->user();
        $languagePair = LanguagePair::with('targetLanguage')->findOrFail($user->language_pair_id);
        $nouns = $this->nounService->getNouns($languagePair->target_language_id, $languagePair->source_language_id, $validated['category'], 10);
        return Inertia::render('GenderDuelGame/Practice', [
            'nouns' => $nouns,
            'difficulty' => $validated['difficulty'],
            'category' => $validated['category'],
            'targetLanguage' => $languagePair->targetLanguage->code,
        ]);
    }

    public function getGenderDuelWords(Request $request)
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
