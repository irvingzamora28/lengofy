<?php

namespace App\Http\Controllers;

use App\Events\GameStarted;
use App\Events\PlayerJoined;
use App\Events\PlayerReady;
use App\Models\Game;
use App\Models\GamePlayer;
use App\Models\Language;
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
        ]);

        $game = Game::create([
            'language_pair_id' => $validated['language_pair_id'],
            'status' => 'waiting',
            'max_players' => 8,
            'total_rounds' => 10,
        ]);

        $player = GamePlayer::create([
            'game_id' => $game->id,
            'user_id' => $request->user()->id,
            'player_name' => $request->user()->name,
            'score' => 0,
        ]);

        broadcast(new PlayerJoined($game, $player));

        return redirect()->route('games.show', $game);
    }

    public function show(Game $game): Response
    {
        $game->load(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage']);
        
        return Inertia::render('Game/Show', [
            'game' => [
                'id' => $game->id,
                'players' => $game->players,
                'max_players' => $game->max_players,
                'language_name' => "{$game->languagePair->sourceLanguage->name} → {$game->languagePair->targetLanguage->name}",
                'current_word' => $game->current_word,
                'status' => $game->status,
                'current_round' => $game->current_round,
                'total_rounds' => $game->total_rounds,
            ],
            'isReady' => $game->players->where('user_id', auth()->id())->first()?->is_ready ?? false,
        ]);
    }

    public function join(Game $game, Request $request)
    {
        if ($game->players->count() >= $game->max_players) {
            return back()->with('error', 'Game is full');
        }

        $player = GamePlayer::create([
            'game_id' => $game->id,
            'user_id' => $request->user()->id,
            'player_name' => $request->user()->name,
            'score' => 0,
        ]);

        broadcast(new PlayerJoined($game, $player));

        return redirect()->route('games.show', $game);
    }

    public function ready(Game $game)
    {
        $player = $game->players()->where('user_id', auth()->id())->first();
        if ($player) {
            $player->update(['is_ready' => true]);
            broadcast(new PlayerReady($game, $player->id));
        }

        // If all players are ready, start the game
        if ($game->players->count() > 1 && $game->players->every(fn($p) => $p->is_ready)) {
            $game->update(['status' => 'in_progress']);
            broadcast(new GameStarted($game));
        }

        return back();
    }

    public function submit(Game $game, Request $request)
    {
        $validated = $request->validate([
            'gender' => ['required', 'string'],
        ]);

        $player = $game->players()->where('user_id', auth()->id())->first();
        if (!$player) {
            return response()->json(['error' => 'Player not found'], 404);
        }

        $isCorrect = $game->current_word['gender'] === $validated['gender'];
        if ($isCorrect) {
            $player->increment('score');
        }

        return response()->json([
            'correct' => $isCorrect,
            'score' => $player->score,
        ]);
    }
}
