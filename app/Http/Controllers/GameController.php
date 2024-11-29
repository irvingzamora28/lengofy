<?php

namespace App\Http\Controllers;

use App\Events\GameCreated;
use App\Events\GameStateUpdated;
use App\Events\NextRound;
use App\Models\Game;
use App\Models\LanguagePair;
use App\Services\GameService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GameController extends Controller
{
    public function __construct(private GameService $gameService)
    {
    }

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
            'language_pair_id' => 'required|exists:language_pairs,id',
            'max_players' => 'required|integer|min:2|max:10',
        ]);

        $game = $this->gameService->createGame(
            auth()->user(),
            $validated['language_pair_id'],
            $validated['max_players']
        );
        broadcast(new GameCreated($game->load('languagePair.sourceLanguage', 'languagePair.targetLanguage')));


        return redirect()->route('games.show', $game);
    }

    public function show(Game $game)
    {
        // Load game data with relationships
        $game->load(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage']);

        // Get words for the game
        $words = $this->gameService->getGameWords($game);

        // Refresh the game instance to get the latest state
        $game->refresh();

        return Inertia::render('Game/Show', [
            'game' => [
                'id' => $game->id,
                'status' => $game->status,
                'players' => $game->players->map(fn($player) => [
                    'id' => $player->id,
                    'user_id' => $player->user_id,
                    'player_name' => $player->player_name,
                    'score' => $player->score,
                    'is_ready' => $player->is_ready,
                    'is_guest' => $player->guest_id !== null,
                ]),
                'max_players' => $game->max_players,
                'current_round' => $game->current_round,
                'total_rounds' => $game->total_rounds,
                'current_word' => $game->current_word,
                'language_name' => "{$game->languagePair->sourceLanguage->name} → {$game->languagePair->targetLanguage->name}",
                'words' => $words,
            ],
            'wsEndpoint' => config('websocket.game_endpoint'),
        ]);
    }

    public function join(Game $game)
    {
        try {
            $this->gameService->joinGame($game, auth()->user());
            return redirect()->route('games.show', $game);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function ready(Game $game)
    {
        try {
            $this->gameService->markPlayerReady($game, auth()->id());
            return to_route('games.show', $game);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function submitAnswer(Request $request, Game $game)
    {
        $validated = $request->validate([
            'answer' => 'required|string|in:der,die,das',
        ]);

        try {
            $result = $this->gameService->submitAnswer($game, auth()->id(), $validated['answer']);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function leave(Game $game)
    {
        $this->gameService->leaveGame($game, auth()->user());
        return redirect()->route('games.lobby');
    }
}
