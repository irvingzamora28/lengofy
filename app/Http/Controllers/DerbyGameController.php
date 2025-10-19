<?php

namespace App\Http\Controllers;

use App\Models\DerbyGame;
use App\Models\LanguagePair;
use App\Services\DerbyGameService;
use App\Services\LanguageService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DerbyGameController extends Controller
{
    public function __construct(
        private DerbyGameService $derbyGameService,
        private LanguageService $languageService,
    ) {
    }

    public function lobby(): Response
    {
        $user = auth()->user();

        return Inertia::render('DerbyGame/Lobby', [
            'activeGames' => DerbyGame::where('status', 'waiting')
                ->where('language_pair_id', $user->language_pair_id)
                ->with(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage'])
                ->get()
                ->map(function ($derbyGame) {
                    return [
                        'id' => $derbyGame->id,
                        'hostId' => $derbyGame->creator_id,
                        'players' => $derbyGame->players,
                        'max_players' => $derbyGame->max_players,
                        'difficulty' => $derbyGame->difficulty,
                        'race_mode' => $derbyGame->race_mode,
                        'language_name' => "{$derbyGame->languagePair->sourceLanguage->name} → {$derbyGame->languagePair->targetLanguage->name}",
                        'source_language' => [
                            'id' => $derbyGame->languagePair->source_language_id,
                            'code' => $derbyGame->languagePair->sourceLanguage->code,
                            'name' => $derbyGame->languagePair->sourceLanguage->name,
                            'flag' => $this->languageService->getFlag($derbyGame->languagePair->sourceLanguage->code),
                        ],
                        'target_language' => [
                            'id' => $derbyGame->languagePair->target_language_id,
                            'code' => $derbyGame->languagePair->targetLanguage->code,
                            'name' => $derbyGame->languagePair->targetLanguage->name,
                            'flag' => $this->languageService->getFlag($derbyGame->languagePair->targetLanguage->code),
                        ],
                    ];
                }),
            'wsEndpoint' => config('websocket.game_endpoint'),
        ]);
    }

    public function create(Request $request)
    {
        $validated = $request->validate([
            'language_pair_id' => 'required|exists:language_pairs,id',
            'max_players' => 'required|integer|min:2|max:6',
            'difficulty' => 'required|in:easy,medium,hard',
            'race_mode' => 'nullable|in:time,distance',
            'race_duration_s' => 'nullable|integer|min:30|max:300',
            'total_segments' => 'nullable|integer|min:10|max:50',
            'noun_list_ids' => 'nullable|array',
            'noun_list_ids.*' => 'exists:noun_lists,id',
            'verb_list_ids' => 'nullable|array',
            'verb_list_ids.*' => 'exists:verb_lists,id',
            'lesson_ids' => 'nullable|array',
        ]);

        $derbyGame = $this->derbyGameService->createGame(
            auth()->user(),
            $validated['language_pair_id'],
            $validated['max_players'],
            $validated['difficulty'],
            $validated['race_mode'] ?? 'time',
            $validated['race_duration_s'] ?? 120,
            $validated['total_segments'] ?? 20,
            $validated['noun_list_ids'] ?? null,
            $validated['verb_list_ids'] ?? null,
            $validated['lesson_ids'] ?? null,
        );

        return redirect()->route('games.derby.show', [
            'derbyGame' => $derbyGame,
            'justCreated' => true
        ]);
    }

    public function practice(Request $request)
    {
        $validated = $request->validate([
            'difficulty' => 'required|in:easy,medium,hard',
            // Allow 0 or null ("All"), don't enforce exists here; we'll coerce below
            'category' => 'nullable|integer',
            'verb_list' => 'nullable|integer|exists:verb_lists,id',
            'tenses' => 'nullable|string',
            'task_types' => 'nullable|string',
        ]);

        $user = auth()->user();
        $languagePair = LanguagePair::with(['sourceLanguage', 'targetLanguage'])->findOrFail($user->language_pair_id);
        
        // Parse task types from comma-separated string
        $taskTypes = !empty($validated['task_types']) 
            ? explode(',', $validated['task_types'])
            : ['article_gender', 'translation', 'verb_conjugation'];
        
        // Parse tenses from comma-separated string
        $tenseIds = !empty($validated['tenses'])
            ? array_map('intval', explode(',', $validated['tenses']))
            : null;
        
        // Coerce category: 0 or null -> null (means All categories)
        $categoryId = isset($validated['category']) && (int) $validated['category'] > 0
            ? (int) $validated['category']
            : null;

        // Create a temporary game object to get prompts
        $tempGame = new DerbyGame([
            'language_pair_id' => $languagePair->id,
            'difficulty' => $validated['difficulty'],
            'race_mode' => 'time',
            'race_duration_s' => 120,
            'total_segments' => 20,
            'noun_list_ids' => null,
            'verb_list_ids' => !empty($validated['verb_list']) ? [$validated['verb_list']] : null,
            'lesson_ids' => null,
            'category_id' => $categoryId,
        ]);
        
        $prompts = $this->derbyGameService->getGamePrompts($tempGame, 50, $taskTypes, $tenseIds);

        return Inertia::render('DerbyGame/Practice', [
            'prompts' => $prompts,
            'difficulty' => $validated['difficulty'],
            'race_duration_s' => 120,
            'total_segments' => 20,
            'language_name' => "{$languagePair->sourceLanguage->name} → {$languagePair->targetLanguage->name}",
        ]);
    }

    public function show(DerbyGame $derbyGame, Request $request)
    {
        $derbyGame->load(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage']);

        // Get prompts for the game (WS manager will handle spawning, but we can provide initial pool)
        $prompts = $this->derbyGameService->getGamePrompts($derbyGame);

        $derbyGame->refresh();

        return Inertia::render('DerbyGame/Show', [
            'justCreated' => $request->boolean('justCreated', false),
            'derby_game' => [
                'id' => $derbyGame->id,
                'status' => $derbyGame->status,
                'players' => $derbyGame->players->map(fn($player) => [
                    'id' => $player->id,
                    'user_id' => $player->user_id,
                    'player_name' => $player->player_name,
                    'score' => $player->score,
                    'progress' => $player->progress,
                    'is_ready' => $player->is_ready,
                    'is_guest' => $player->guest_id !== null,
                ]),
                'max_players' => $derbyGame->max_players,
                'race_mode' => $derbyGame->race_mode,
                'race_duration_s' => $derbyGame->race_duration_s,
                'total_segments' => $derbyGame->total_segments,
                'difficulty' => $derbyGame->difficulty ?? 'medium',
                'language_name' => "{$derbyGame->languagePair->sourceLanguage->name} → {$derbyGame->languagePair->targetLanguage->name}",
                'source_language' => [
                    'id' => $derbyGame->languagePair->sourceLanguage->id,
                    'code' => $derbyGame->languagePair->sourceLanguage->code,
                    'name' => $derbyGame->languagePair->sourceLanguage->name,
                    'flag' => $this->languageService->getFlag($derbyGame->languagePair->sourceLanguage->code),
                ],
                'target_language' => [
                    'id' => $derbyGame->languagePair->targetLanguage->id,
                    'code' => $derbyGame->languagePair->targetLanguage->code,
                    'name' => $derbyGame->languagePair->targetLanguage->name,
                    'flag' => $this->languageService->getFlag($derbyGame->languagePair->targetLanguage->code),
                ],
                'prompts' => $prompts,
                'hostId' => $derbyGame->creator_id,
                'filters' => [
                    'noun_list_ids' => $derbyGame->noun_list_ids,
                    'verb_list_ids' => $derbyGame->verb_list_ids,
                    'lesson_ids' => $derbyGame->lesson_ids,
                ],
            ],
            'wsEndpoint' => config('websocket.game_endpoint'),
        ]);
    }

    public function join(DerbyGame $derbyGame)
    {
        return $this->handleJoinGame($derbyGame);
    }

    public function joinFromInvite(DerbyGame $derbyGame)
    {
        return $this->handleJoinGame($derbyGame);
    }

    private function handleJoinGame(DerbyGame $derbyGame)
    {
        $user = auth()->user();

        if ($derbyGame->language_pair_id !== $user->language_pair_id) {
            return back()->with('error', 'You can only join games that match your selected language pair.');
        }

        if ($derbyGame->players()->count() >= $derbyGame->max_players) {
            return back()->with('error', 'This game is full.');
        }

        if ($derbyGame->players()->where('user_id', $user->id)->exists()) {
            return back()->with('error', 'You are already in this game.');
        }

        try {
            $this->derbyGameService->joinGame($derbyGame, auth()->user());
            return redirect()->route('games.derby.show', $derbyGame);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function ready(DerbyGame $derbyGame)
    {
        try {
            $this->derbyGameService->markPlayerReady($derbyGame, auth()->id());
            return to_route('games.derby.show', $derbyGame);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function leave(DerbyGame $derbyGame)
    {
        $this->derbyGameService->leaveGame($derbyGame, auth()->user());
        return redirect()->route('games.derby.lobby');
    }

    public function end(DerbyGame $derbyGame)
    {
        // Only the creator/host can end the game
        if ($derbyGame->creator_id !== auth()->user()->id) {
            abort(403, 'Only the game creator can end this game.');
        }

        $this->derbyGameService->endGame($derbyGame);

        return redirect()->route('games.derby.lobby');
    }
}
