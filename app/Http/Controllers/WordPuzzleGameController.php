<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\WordPuzzleGame;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WordPuzzleGameController extends Controller
{
    public function lobby()
    {
        $user = auth()->user();

        return Inertia::render('Games/WordPuzzle/Lobby', [
            'activeGames' => WordPuzzleGame::where('status', 'waiting')
                ->where('language_pair_id', $user->language_pair_id)
                ->with(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage'])
                ->get()
                ->map(function ($wordPuzzleGame) {
                    return [
                        'id' => $wordPuzzleGame->id,
                        'players' => $wordPuzzleGame->players,
                        'max_players' => $wordPuzzleGame->max_players,
                        'language_name' => "{$wordPuzzleGame->languagePair->sourceLanguage->name} → {$wordPuzzleGame->languagePair->targetLanguage->name}",
                        'source_language' => [
                            'id' => $wordPuzzleGame->languagePair->source_language_id,
                            'code' => $wordPuzzleGame->languagePair->sourceLanguage->code,
                            'name' => $wordPuzzleGame->languagePair->sourceLanguage->name,
                        ],
                        'target_language' => [
                            'id' => $wordPuzzleGame->languagePair->target_language_id,
                            'code' => $wordPuzzleGame->languagePair->targetLanguage->code,
                            'name' => $wordPuzzleGame->languagePair->targetLanguage->name,
                        ],
                        'difficulty' => $wordPuzzleGame->difficulty,
                        'category_id' => $wordPuzzleGame->category_id,
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

        $game = WordPuzzleGame::create([
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
            'player_name' => auth()->user()->name,
            'is_host' => true,
            'is_ready' => false,
            'score' => 0,
        ]);

        return redirect()->route('games.word-puzzle.show', [
            'wordPuzzleGame' => $game,
            'justCreated' => true,
        ]);
    }

    public function show(WordPuzzleGame $wordPuzzleGame, Request $request)
    {
        $wordPuzzleGame->load(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage']);

        return Inertia::render('Games/WordPuzzle/Show', [
            'justCreated' => $request->boolean('justCreated', false),
            'word_puzzle_game' => [
                'id' => $wordPuzzleGame->id,
                'status' => $wordPuzzleGame->status,
                'players' => $wordPuzzleGame->players->map(fn($player) => [
                    'id' => $player->id,
                    'user_id' => $player->user_id,
                    'player_name' => $player->player_name,
                    'score' => $player->score,
                    'is_ready' => $player->is_ready,
                    'is_host' => $player->is_host,
                ]),
                'max_players' => $wordPuzzleGame->max_players,
                'difficulty' => $wordPuzzleGame->difficulty,
                'category_id' => $wordPuzzleGame->category_id,
                'language_pair' => [
                    'source_language' => [
                        'id' => $wordPuzzleGame->languagePair->sourceLanguage->id,
                        'code' => $wordPuzzleGame->languagePair->sourceLanguage->code,
                        'name' => $wordPuzzleGame->languagePair->sourceLanguage->name,
                    ],
                    'target_language' => [
                        'id' => $wordPuzzleGame->languagePair->targetLanguage->id,
                        'code' => $wordPuzzleGame->languagePair->targetLanguage->code,
                        'name' => $wordPuzzleGame->languagePair->targetLanguage->name,
                    ],
                ],
            ],
            'wsEndpoint' => config('websocket.game_endpoint'),
        ]);
    }
}
