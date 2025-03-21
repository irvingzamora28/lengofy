<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\LanguagePair;
use App\Models\WordSearchPuzzleGame;
use App\Services\LanguageService;
use App\Services\NounService;
use App\Services\WordSearchPuzzleGameService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WordSearchPuzzleGameController extends Controller
{

    public function __construct(
        private NounService $nounService,
        private WordSearchPuzzleGameService $wordSearchPuzzleGameService,
        private LanguageService $languageService,
    ) {}
    public function lobby()
    {
        $user = auth()->user();

        return Inertia::render('Games/WordSearchPuzzle/Lobby', [
            'activeGames' => WordSearchPuzzleGame::where('status', 'waiting')
                ->where('language_pair_id', $user->language_pair_id)
                ->with(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage'])
                ->get()
                ->map(function ($WordSearchPuzzleGame) {
                    return [
                        'id' => $WordSearchPuzzleGame->id,
                        'players' => $WordSearchPuzzleGame->players,
                        'max_players' => $WordSearchPuzzleGame->max_players,
                        'language_name' => "{$WordSearchPuzzleGame->languagePair->sourceLanguage->name} → {$WordSearchPuzzleGame->languagePair->targetLanguage->name}",
                        'source_language' => [
                            'id' => $WordSearchPuzzleGame->languagePair->source_language_id,
                            'code' => $WordSearchPuzzleGame->languagePair->sourceLanguage->code,
                            'name' => $WordSearchPuzzleGame->languagePair->sourceLanguage->name,
                            'flag' => $this->languageService->getFlag($WordSearchPuzzleGame->languagePair->sourceLanguage->code),
                        ],
                        'target_language' => [
                            'id' => $WordSearchPuzzleGame->languagePair->target_language_id,
                            'code' => $WordSearchPuzzleGame->languagePair->targetLanguage->code,
                            'name' => $WordSearchPuzzleGame->languagePair->targetLanguage->name,
                            'flag' => $this->languageService->getFlag($WordSearchPuzzleGame->languagePair->targetLanguage->code),
                        ],
                        'difficulty' => $WordSearchPuzzleGame->difficulty,
                        'category_id' => $WordSearchPuzzleGame->category_id,
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
            'category' => 'required|integer|in:0,' . implode(',', Category::pluck('id')->toArray()),
        ]);

        $game = WordSearchPuzzleGame::create([
            'creator_id' => auth()->id(),
            'language_pair_id' => $validated['language_pair_id'],
            'max_players' => $validated['max_players'],
            'difficulty' => $validated['difficulty'],
            'category_id' => $validated['category'],
            'status' => 'waiting',
        ]);

        // Create the first player (the host)
        $game->players()->create([
            'user_id' => auth()->id(),
            'is_ready' => false,
            'score' => 0,
        ]);

        return redirect()->route('games.word-search-puzzle.show', [
            'wordSearchPuzzleGame' => $game,
            'justCreated' => true,
        ]);
    }

    public function show(WordSearchPuzzleGame $wordSearchPuzzleGame, Request $request)
    {
        $wordSearchPuzzleGame->load(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage']);

        $amountOfWords = match ($wordSearchPuzzleGame->difficulty) {
            'easy' => 5,
            'medium' => 8,
            'hard' => 12,
        };

        // Get words for the game
        $words = $this->nounService->getNouns(
            languageId: $wordSearchPuzzleGame->languagePair->target_language_id,
            translationLanguageId: $wordSearchPuzzleGame->languagePair->source_language_id,
            categoryId: $wordSearchPuzzleGame->category_id,
            totalRounds: $amountOfWords,
        );

        // Refresh the game instance to get the latest state
        $wordSearchPuzzleGame->refresh();

        return Inertia::render('Games/WordSearchPuzzle/Show', [
            'justCreated' => $request->boolean('justCreated', false),
            'word_search_puzzle_game' => [
                'id' => $wordSearchPuzzleGame->id,
                'status' => $wordSearchPuzzleGame->status,
                'players' => $wordSearchPuzzleGame->players->map(fn($player) => [
                    'id' => $player->id,
                    'user_id' => $player->user_id,
                    'player_name' => $player->player_name,
                    'score' => $player->score,
                    'is_ready' => $player->is_ready,
                    'is_host' => $player->is_host,
                ]),
                'max_players' => $wordSearchPuzzleGame->max_players,
                'difficulty' => $wordSearchPuzzleGame->difficulty,
                'category_id' => $wordSearchPuzzleGame->category_id,
                'source_language' => [
                    'id' => $wordSearchPuzzleGame->languagePair->sourceLanguage->id,
                    'code' => $wordSearchPuzzleGame->languagePair->sourceLanguage->code,
                    'name' => $wordSearchPuzzleGame->languagePair->sourceLanguage->name,
                    'flag' => $this->languageService->getFlag($wordSearchPuzzleGame->languagePair->sourceLanguage->code),
                ],
                'target_language' => [
                    'id' => $wordSearchPuzzleGame->languagePair->targetLanguage->id,
                    'code' => $wordSearchPuzzleGame->languagePair->targetLanguage->code,
                    'name' => $wordSearchPuzzleGame->languagePair->targetLanguage->name,
                    'flag' => $this->languageService->getFlag($wordSearchPuzzleGame->languagePair->targetLanguage->code),
                ],
                'words' => $words,
            ],
            'wsEndpoint' => config('websocket.game_endpoint'),
        ]);
    }

    public function practice(Request $request)
    {
        $validated = $request->validate([
            'difficulty' => 'required|in:easy,medium,hard',
            'category' => 'required|integer|in:0,' . implode(',', Category::pluck('id')->toArray()),
        ]);

        $amountOfWords = match ($validated['difficulty']) {
            'easy' => 5,
            'medium' => 8,
            'hard' => 12,
        };

        $user = auth()->user();
        $languagePair = LanguagePair::with('targetLanguage')->findOrFail($user->language_pair_id);
        $words = $this->nounService->getNouns(
            languageId: $languagePair->target_language_id,
            translationLanguageId: $languagePair->source_language_id,
            categoryId: $validated['category'],
            totalRounds: $amountOfWords
        );


        return Inertia::render('Games/WordSearchPuzzle/Practice', [
            'words' => $words,
            'difficulty' => $validated['difficulty'],
            'category' => $validated['category'],
            'targetLanguage' => $languagePair->targetLanguage->code,
        ]);
    }

    public function join(WordSearchPuzzleGame $wordSearchPuzzleGame)
    {
        return $this->handleJoinGame($wordSearchPuzzleGame);
    }

    public function joinFromInvite(WordSearchPuzzleGame $wordSearchPuzzleGame)
    {
        return $this->handleJoinGame($wordSearchPuzzleGame);
    }

    private function handleJoinGame(WordSearchPuzzleGame $wordSearchPuzzleGame)
    {
        $user = auth()->user();

        if ($wordSearchPuzzleGame->language_pair_id !== $user->language_pair_id) {
            return back()->with('error', 'You can only join games that match your selected language pair.');
        }

        if ($wordSearchPuzzleGame->players()->count() >= $wordSearchPuzzleGame->max_players) {
            return back()->with('error', 'This game is full.');
        }

        if ($wordSearchPuzzleGame->players()->where('user_id', $user->id)->exists()) {
            return back()->with('error', 'You are already in this game.');
        }

        try {
            $this->wordSearchPuzzleGameService->joinGame($wordSearchPuzzleGame, $user);
            return redirect()->route('games.word-search-puzzle.show', $wordSearchPuzzleGame);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function leave(WordSearchPuzzleGame $wordSearchPuzzleGame)
    {
        $this->wordSearchPuzzleGameService->leaveGame($wordSearchPuzzleGame, auth()->user());
        return redirect()->route('games.word-search-puzzle.lobby');
    }
}
