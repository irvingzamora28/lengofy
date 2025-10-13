<?php

namespace App\Http\Controllers;

use App\Http\Middleware\EnsurePlayerInGame;
use App\Models\Category;
use App\Models\LanguagePair;
use App\Models\VerbConjugationSlotGame;
use App\Services\LanguageService;
use App\Services\VerbConjugationSlotGameService;
use App\Services\VerbService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VerbConjugationSlotGameController extends Controller
{
    public function __construct(
        private readonly VerbConjugationSlotGameService $gameService,
        private readonly LanguageService $languageService,
        private readonly VerbService $verbService,
    ) {
    }

    public function lobby(): Response
    {
        $user = auth()->user();

        return Inertia::render('VerbConjugationSlotGame/Lobby', [
            'activeGames' => VerbConjugationSlotGame::where('status', 'waiting')
                ->where('language_pair_id', $user->language_pair_id)
                ->with(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage'])
                ->get()
                ->map(function ($game) {
                    return [
                        'id' => $game->id,
                        'hostId' => $game->creator_id,
                        'players' => $game->players,
                        'max_players' => $game->max_players,
                        'language_name' => "{$game->languagePair->sourceLanguage->name} → {$game->languagePair->targetLanguage->name}",
                        'source_language' => [
                            'id' => $game->languagePair->source_language_id,
                            'code' => $game->languagePair->sourceLanguage->code,
                            'name' => $game->languagePair->sourceLanguage->name,
                            'flag' => $this->languageService->getFlag($game->languagePair->sourceLanguage->code),
                        ],
                        'target_language' => [
                            'id' => $game->languagePair->target_language_id,
                            'code' => $game->languagePair->targetLanguage->code,
                            'name' => $game->languagePair->targetLanguage->name,
                            'flag' => $this->languageService->getFlag($game->languagePair->targetLanguage->code),
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
            'max_players' => 'required|integer|min:2|max:10',
            'difficulty' => 'required|in:easy,medium,hard',
            'category' => 'required|integer|in:0,' . implode(',', Category::pluck('id')->toArray()),
            'verb_list_id' => 'nullable|integer|exists:verb_lists,id',
        ]);

        $game = $this->gameService->createGame(
            auth()->user(),
            $validated['language_pair_id'],
            $validated['max_players'],
            $validated['difficulty'],
            $validated['category'],
            $validated['verb_list_id'] ?? null,
        );

        return redirect()->route('games.verb-conjugation-slot.show', [
            'verbConjugationSlotGame' => $game,
            'justCreated' => true,
        ]);
    }

    public function show(VerbConjugationSlotGame $verbConjugationSlotGame, Request $request)
    {
        $verbConjugationSlotGame->load(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage']);

        $prompts = $this->gameService->getGamePrompts($verbConjugationSlotGame);
        $verbConjugationSlotGame->refresh();

        return Inertia::render('VerbConjugationSlotGame/Show', [
            'justCreated' => $request->boolean('justCreated', false),
            'game' => [
                'id' => $verbConjugationSlotGame->id,
                'status' => $verbConjugationSlotGame->status,
                'players' => $verbConjugationSlotGame->players->map(fn ($player) => [
                    'id' => $player->id,
                    'user_id' => $player->user_id,
                    'player_name' => $player->player_name,
                    'score' => $player->score,
                    'is_ready' => $player->is_ready,
                    'is_guest' => $player->guest_id !== null,
                ]),
                'max_players' => $verbConjugationSlotGame->max_players,
                'total_rounds' => $verbConjugationSlotGame->total_rounds,
                'difficulty' => $verbConjugationSlotGame->difficulty ?? 'medium',
                'language_name' => "{$verbConjugationSlotGame->languagePair->sourceLanguage->name} → {$verbConjugationSlotGame->languagePair->targetLanguage->name}",
                'source_language' => [
                    'id' => $verbConjugationSlotGame->languagePair->sourceLanguage->id,
                    'code' => $verbConjugationSlotGame->languagePair->sourceLanguage->code,
                    'name' => $verbConjugationSlotGame->languagePair->sourceLanguage->name,
                    'flag' => $this->languageService->getFlag($verbConjugationSlotGame->languagePair->sourceLanguage->code),
                ],
                'target_language' => [
                    'id' => $verbConjugationSlotGame->languagePair->targetLanguage->id,
                    'code' => $verbConjugationSlotGame->languagePair->targetLanguage->code,
                    'name' => $verbConjugationSlotGame->languagePair->targetLanguage->name,
                    'flag' => $this->languageService->getFlag($verbConjugationSlotGame->languagePair->targetLanguage->code),
                    'special_characters' => $verbConjugationSlotGame->languagePair->targetLanguage->special_characters ?? [],
                ],
                'prompts' => $prompts,
                'hostId' => $verbConjugationSlotGame->creator_id,
                'category' => $verbConjugationSlotGame->category_id === 0
                    ? (object) ['id' => 0, 'key' => 'all']
                    : Category::find($verbConjugationSlotGame->category_id),
            ],
            'wsEndpoint' => config('websocket.game_endpoint'),
        ]);
    }

    public function join(VerbConjugationSlotGame $verbConjugationSlotGame)
    {
        return $this->handleJoinGame($verbConjugationSlotGame);
    }

    public function joinFromInvite(VerbConjugationSlotGame $verbConjugationSlotGame)
    {
        return $this->handleJoinGame($verbConjugationSlotGame);
    }

    private function handleJoinGame(VerbConjugationSlotGame $game)
    {
        $user = auth()->user();

        if ($game->language_pair_id !== $user->language_pair_id) {
            return back()->with('error', 'You can only join games that match your selected language pair.');
        }

        if ($game->players()->count() >= $game->max_players) {
            return back()->with('error', 'This game is full.');
        }

        if ($game->players()->where('user_id', $user->id)->exists()) {
            return back()->with('error', 'You are already in this game.');
        }

        try {
            $this->gameService->joinGame($game, auth()->user());
            return redirect()->route('games.verb-conjugation-slot.show', $game);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function ready(VerbConjugationSlotGame $verbConjugationSlotGame)
    {
        try {
            $this->gameService->markPlayerReady($verbConjugationSlotGame, auth()->id());
            return to_route('games.verb-conjugation-slot.show', $verbConjugationSlotGame);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function leave(VerbConjugationSlotGame $verbConjugationSlotGame)
    {
        $this->gameService->leaveGame($verbConjugationSlotGame, auth()->user());
        return redirect()->route('games.verb-conjugation-slot.lobby');
    }

    public function end(VerbConjugationSlotGame $verbConjugationSlotGame)
    {
        // Only the creator/host can end the game
        if ($verbConjugationSlotGame->creator_id !== auth()->user()->id) {
            abort(403, 'Only the game creator can end this game.');
        }

        $this->gameService->endGame($verbConjugationSlotGame);

        return redirect()->route('games.verb-conjugation-slot.lobby');
    }

    public function practice(Request $request)
    {
        $validated = $request->validate([
            'difficulty' => 'required|in:easy,medium,hard',
            'category' => 'required|integer|in:0,' . implode(',', Category::pluck('id')->toArray()),
            'verb_list_id' => 'nullable|integer|exists:verb_lists,id',
        ]);

        $user = auth()->user();
        $languagePair = LanguagePair::with('targetLanguage')->findOrFail($user->language_pair_id);
        $prompts = [];
        for ($i = 0; $i < 10; $i++) {
            $p = $this->verbService->getRandomPrompt(
                $languagePair->id, 
                $validated['difficulty'],
                $validated['verb_list_id'] ?? null
            );
            if ($p) { $prompts[] = $p; }
        }

        return Inertia::render('VerbConjugationSlotGame/Practice', [
            'prompts' => $prompts,
            'difficulty' => $validated['difficulty'],
            'category' => $validated['category'],
            'verbListId' => $validated['verb_list_id'] ?? null,
            'targetLanguage' => $languagePair->targetLanguage->code,
            'specialCharacters' => $languagePair->targetLanguage->special_characters ?? [],
        ]);
    }

    public function getPrompts(Request $request)
    {
        $validated = $request->validate([
            'count' => 'sometimes|integer|min:1|max:50',
            'difficulty' => 'required|in:easy,medium,hard',
        ]);
        $count = $validated['count'] ?? 10;

        $user = auth()->user();
        $languagePair = LanguagePair::with('targetLanguage')->findOrFail($user->language_pair_id);
        $prompts = [];
        for ($i = 0; $i < $count; $i++) {
            $p = $this->verbService->getRandomPrompt($languagePair->id, $validated['difficulty']);
            if ($p) { $prompts[] = $p; }
        }
        return response()->json($prompts);
    }
}
