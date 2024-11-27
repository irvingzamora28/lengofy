<?php

namespace App\Http\Controllers;

use App\Events\GameCreated;
use App\Events\PlayerJoined;
use App\Events\PlayerReady;
use App\Models\Game;
use App\Models\LanguagePair;
use App\Services\GameService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class GameController extends Controller
{
    public function __construct(
        private GameService $gameService
    ) {}

    public function lobby(): Response
    {
        // Get active language pairs and format them for the frontend
        $languagePairs = LanguagePair::where('is_active', true)
            ->with(['sourceLanguage', 'targetLanguage'])
            ->get()
            ->map(function ($pair) {
                return [
                    'id' => $pair->id,
                    'name' => "{$pair->sourceLanguage->name} → {$pair->targetLanguage->name}",
                ];
            })
            ->pluck('name', 'id');

        return Inertia::render('Game/Lobby', [
            'activeGames' => Game::where('status', 'waiting')
                ->with(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage'])
                ->get()
                ->map(function ($game) {
                    return [
                        'id' => $game->id,
                        'players' => $game->players,
                        'max_players' => $game->max_players,
                        'language_name' => "{$game->languagePair->sourceLanguage->name} → {$game->languagePair->targetLanguage->name}",
                    ];
                }),
            'languagePairs' => $languagePairs,
        ]);
    }

    public function create(Request $request)
    {
        $validated = $request->validate([
            'language_pair_id' => [
                'required',
                Rule::exists('language_pairs', 'id')->where('is_active', true),
            ],
            'max_players' => ['required', 'integer', 'min:2', 'max:8'],
        ]);

        $game = $this->gameService->createGame(
            $request->user(),
            $validated['language_pair_id'],
            $validated['max_players']
        );

        broadcast(new GameCreated($game->load('languagePair.sourceLanguage', 'languagePair.targetLanguage')));

        return redirect()->route('games.show', $game);
    }

    public function show(Game $game): Response
    {
        $game->load(['players' => function ($query) {
            $query->select('id', 'game_id', 'user_id', 'player_name', 'score', 'is_ready');
        }, 'languagePair.sourceLanguage', 'languagePair.targetLanguage']);

        return Inertia::render('Game/Show', [
            'game' => [
                'id' => $game->id,
                'status' => $game->status,
                'current_round' => $game->current_round,
                'total_rounds' => $game->total_rounds,
                'current_word' => $game->current_word,
                'language_name' => "{$game->languagePair->sourceLanguage->name} → {$game->languagePair->targetLanguage->name}",
                'players' => $game->players->map(fn($player) => [
                    'id' => $player->id,
                    'user_id' => $player->user_id,
                    'player_name' => $player->player_name,
                    'score' => $player->score,
                    'is_ready' => $player->is_ready,
                ]),
                'max_players' => $game->max_players,
            ],
            'isReady' => $game->players->where('user_id', auth()->id())->first()?->is_ready ?? false,
        ]);
    }

    public function join(Game $game, Request $request)
    {
        try {
            $this->gameService->joinGame($game, $request->user());
            broadcast(new PlayerJoined($game, $game->players->last()));
            return redirect()->route('games.show', $game);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function ready(Game $game, Request $request)
    {
        try {
            $this->gameService->markPlayerReady($game, $request->user()->id);
            broadcast(new PlayerReady($game, $game->players->where('user_id', $request->user()->id)->first()));
            return back();
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function submitAnswer(Game $game, Request $request)
    {
        try {
            $validated = $request->validate([
                'answer' => ['required', 'string'],
            ]);

            $result = $this->gameService->submitAnswer($game, $request->user()->id, $validated['answer']);
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function leave(Game $game, Request $request)
    {
        try {
            $this->gameService->leaveGame($game, $request->user());
            return redirect()->route('games.lobby');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
