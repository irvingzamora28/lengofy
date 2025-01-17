<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\LanguagePair;
use App\Models\MemoryTranslationGame;
use App\Services\LanguageService;
use App\Services\MemoryTranslationGameService;
use App\Services\NounService;
use Illuminate\Http\Request;
use Inertia\Response;
use Inertia\Inertia;

class MemoryTranslationGameController extends Controller
{
    public function __construct(
        private NounService $nounService,
        private LanguageService $languageService,
        private MemoryTranslationGameService $memoryTranslationGameService,
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
                ->map(function ($memoryTranslationGame) {
                    return [
                        'id' => $memoryTranslationGame->id,
                        'players' => $memoryTranslationGame->players,
                        'max_players' => $memoryTranslationGame->max_players,
                        'language_name' => "{$memoryTranslationGame->languagePair->sourceLanguage->name} → {$memoryTranslationGame->languagePair->targetLanguage->name}",
                        'source_language' => [
                            'id' => $memoryTranslationGame->languagePair->source_language_id,
                            'code' => $memoryTranslationGame->languagePair->sourceLanguage->code,
                            'name' => $memoryTranslationGame->languagePair->sourceLanguage->name,
                            'flag' => $this->languageService->getFlag($memoryTranslationGame->languagePair->sourceLanguage->code),
                        ],
                        'target_language' => [
                            'id' => $memoryTranslationGame->languagePair->target_language_id,
                            'code' => $memoryTranslationGame->languagePair->targetLanguage->code,
                            'name' => $memoryTranslationGame->languagePair->targetLanguage->name,
                            'flag' => $this->languageService->getFlag($memoryTranslationGame->languagePair->targetLanguage->code),
                        ],
                        'category' => $memoryTranslationGame->category_id === 0
                            ? (object) ['id' => 0, 'key' => 'all']
                            : Category::find($memoryTranslationGame->category_id),
                    ];
                }),
            'wsEndpoint' => config('websocket.game_endpoint'),
        ]);
    }

    public function create(Request $request)
    {
        $validated = $request->validate([
            'language_pair_id' => 'required|exists:language_pairs,id',
            'max_players' => 'required|integer|min:2|max:8',
            'difficulty' => 'required|in:easy,medium,hard',
            'category' => 'required|integer|in:0,' . implode(',', Category::pluck('id')->toArray()), // Allow 0 or existing category IDs
        ]);

        $game = $this->memoryTranslationGameService->createGame(auth()->user(), $validated['language_pair_id'], $validated['max_players'], $validated['difficulty'], $validated['category']);

        return redirect()->route('games.memory-translation.show', [
            'memoryTranslationGame' => $game,
            'justCreated' => true,
        ]);
    }

    public function practice(Request $request)
    {
        $validated = $request->validate([
            'difficulty' => 'required|in:easy,medium,hard',
            'category' => 'nullable|exists:categories,id',
        ]);

        $user = auth()->user();
        $languagePair = LanguagePair::findOrFail($user->language_pair_id);

        return Inertia::render('MemoryTranslationGame/Practice', [
            'difficulty' => $validated['difficulty'],
            'category' => $validated['category'] === 0
                    ? (object) ['id' => 0, 'key' => 'all']
                    : Category::find($validated['category']),
            'languagePair' => [
                'source_language' => [
                    'id' => $languagePair->source_language_id,
                    'code' => $languagePair->sourceLanguage->code,
                    'name' => $languagePair->sourceLanguage->name,
                ],
                'target_language' => [
                    'id' => $languagePair->target_language_id,
                    'code' => $languagePair->targetLanguage->code,
                    'name' => $languagePair->targetLanguage->name,
                ],
            ],
        ]);
    }

    public function getMemoryTranslationWords(Request $request)
    {
        $validated = $request->validate([
            'difficulty' => 'required|in:easy,medium,hard',
            'category' => 'nullable|exists:categories,id',
        ]);

        $user = auth()->user();
        $languagePair = LanguagePair::findOrFail($user->language_pair_id);

        $words = $this->nounService->getNouns(
            languageId: $languagePair->target_language_id,
            translationLanguageId: $languagePair->source_language_id,
            categoryId: $validated['category'],
            totalRounds: 8
        );

        return response()->json($words);
    }

    public function show(MemoryTranslationGame $memoryTranslationGame, Request $request)
    {
        // Load game data with relationships
        $memoryTranslationGame->load(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage']);

        // Get words for the game
        $words = $this->nounService->getNouns(
            languageId: $memoryTranslationGame->languagePair->target_language_id,
            translationLanguageId: $memoryTranslationGame->languagePair->source_language_id,
            categoryId: $memoryTranslationGame->category_id,
            totalRounds: 8
        );

        // Refresh the game instance to get the latest state
        $memoryTranslationGame->refresh();

        return Inertia::render('MemoryTranslationGame/Show', [
            'justCreated' => $request->boolean('justCreated', false),
            'memory_translation_game' => [
                'id' => $memoryTranslationGame->id,
                'status' => $memoryTranslationGame->status,
                'players' => $memoryTranslationGame->players->map(fn($player) => [
                    'id' => $player->id,
                    'user_id' => $player->user_id,
                    'player_name' => $player->player_name,
                    'score' => $player->score,
                    'moves' => $player->moves,
                    'time' => $player->time,
                    'is_ready' => $player->is_ready,
                ]),
                'max_players' => $memoryTranslationGame->max_players,
                'difficulty' => $memoryTranslationGame->difficulty,
                'category' => $memoryTranslationGame->category_id === 0
                    ? (object) ['id' => 0, 'key' => 'all']
                    : Category::find($memoryTranslationGame->category_id),
                'words' => $words,
                'language_pair' => [
                    'source_language' => [
                        'id' => $memoryTranslationGame->languagePair->sourceLanguage->id,
                        'code' => $memoryTranslationGame->languagePair->sourceLanguage->code,
                        'name' => $memoryTranslationGame->languagePair->sourceLanguage->name,
                        'flag' => $this->languageService->getFlag($memoryTranslationGame->languagePair->sourceLanguage->code),
                    ],
                    'target_language' => [
                        'id' => $memoryTranslationGame->languagePair->targetLanguage->id,
                        'code' => $memoryTranslationGame->languagePair->targetLanguage->code,
                        'name' => $memoryTranslationGame->languagePair->targetLanguage->name,
                        'flag' => $this->languageService->getFlag($memoryTranslationGame->languagePair->targetLanguage->code),
                    ],
                ],
            ],
            'wsEndpoint' => config('websocket.game_endpoint'),
        ]);
    }

    public function join(MemoryTranslationGame $memoryTranslationGame)
    {
        $user = auth()->user();

        if ($memoryTranslationGame->language_pair_id !== $user->language_pair_id) {
            return back()->with('error', 'You can only join games that match your selected language pair.');
        }

        if ($memoryTranslationGame->players()->count() >= $memoryTranslationGame->max_players) {
            return back()->with('error', 'This memoryTranslationGame is full.');
        }

        if ($memoryTranslationGame->players()->where('user_id', $user->id)->exists()) {
            return back()->with('error', 'You are already in this memoryTranslationGame.');
        }

        try {
            $this->memoryTranslationGameService->joinGame($memoryTranslationGame, auth()->user());
            return redirect()->route('games.memory-translation.show', $memoryTranslationGame);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function ready(MemoryTranslationGame $memoryTranslationGame)
    {
        try {
            $this->memoryTranslationGameService->markPlayerReady($memoryTranslationGame, auth()->id());
            return to_route('games.memory-translation.show', $memoryTranslationGame);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function leave(MemoryTranslationGame $memoryTranslationGame)
    {
        $this->memoryTranslationGameService->leaveGame($memoryTranslationGame, auth()->user());
        return redirect()->route('games.memory-translation.lobby');
    }
}
