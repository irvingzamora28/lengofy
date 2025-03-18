<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\WordSearchPuzzleGame;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WordSearchPuzzleGameController extends Controller
{
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
                        ],
                        'target_language' => [
                            'id' => $WordSearchPuzzleGame->languagePair->target_language_id,
                            'code' => $WordSearchPuzzleGame->languagePair->targetLanguage->code,
                            'name' => $WordSearchPuzzleGame->languagePair->targetLanguage->name,
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
            'WordSearchPuzzleGame' => $game,
            'justCreated' => true,
        ]);
    }

    public function show(WordSearchPuzzleGame $WordSearchPuzzleGame, Request $request)
    {
        $WordSearchPuzzleGame->load(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage']);

        return Inertia::render('Games/WordSearchPuzzle/Show', [
            'justCreated' => $request->boolean('justCreated', false),
            'word_search_puzzle_game' => [
                'id' => $WordSearchPuzzleGame->id,
                'status' => $WordSearchPuzzleGame->status,
                'players' => $WordSearchPuzzleGame->players->map(fn($player) => [
                    'id' => $player->id,
                    'user_id' => $player->user_id,
                    'player_name' => $player->player_name,
                    'score' => $player->score,
                    'is_ready' => $player->is_ready,
                    'is_host' => $player->is_host,
                ]),
                'max_players' => $WordSearchPuzzleGame->max_players,
                'difficulty' => $WordSearchPuzzleGame->difficulty,
                'category_id' => $WordSearchPuzzleGame->category_id,
                'language_pair' => [
                    'source_language' => [
                        'id' => $WordSearchPuzzleGame->languagePair->sourceLanguage->id,
                        'code' => $WordSearchPuzzleGame->languagePair->sourceLanguage->code,
                        'name' => $WordSearchPuzzleGame->languagePair->sourceLanguage->name,
                    ],
                    'target_language' => [
                        'id' => $WordSearchPuzzleGame->languagePair->targetLanguage->id,
                        'code' => $WordSearchPuzzleGame->languagePair->targetLanguage->code,
                        'name' => $WordSearchPuzzleGame->languagePair->targetLanguage->name,
                    ],
                ],
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

        return Inertia::render('Games/WordSearchPuzzle/Practice', [
            'difficulty' => $validated['difficulty'],
            'category' => $validated['category'],
        ]);
    }
}
