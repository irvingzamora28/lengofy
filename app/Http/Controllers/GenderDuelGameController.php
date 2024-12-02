<?php

namespace App\Http\Controllers;

use App\Models\GenderDuelGame;
use App\Services\GenderDuelGameService;
use App\Services\LanguageService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GenderDuelGameController extends Controller
{
    public function __construct(
        private GenderDuelGameService $genderDuelGameService,
        private LanguageService $languageService,
    ) {
    }

    public function lobby(): Response
    {
        $user = auth()->user();

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
        ]);
    }

    public function create(Request $request)
    {
        $validated = $request->validate([
            'language_pair_id' => 'required|exists:language_pairs,id',
            'max_players' => 'required|integer|min:2|max:10',
        ]);

        $genderDuelGame = $this->genderDuelGameService->createGame(
            auth()->user(),
            $validated['language_pair_id'],
            $validated['max_players']
        );
        return redirect()->route('gender-duel-game.show', ['genderDuelGame' => $genderDuelGame]);
    }

    public function show(GenderDuelGame $genderDuelGame)
    {
        // Load genderDuelGame data with relationships
        $genderDuelGame->load(['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage']);

        // Get words for the genderDuelGame
        $words = $this->genderDuelGameService->getGameWords($genderDuelGame);

        // Refresh the genderDuelGame instance to get the latest state
        $genderDuelGame->refresh();
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
                'current_round' => $genderDuelGame->current_round,
                'total_rounds' => $genderDuelGame->total_rounds,
                'current_word' => $genderDuelGame->current_word,
                'language_name' => "{$genderDuelGame->languagePair->sourceLanguage->name} → {$genderDuelGame->languagePair->targetLanguage->name}",
                'words' => $words,
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
            return redirect()->route('gender-duel-game.show', $genderDuelGame);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function ready(GenderDuelGame $genderDuelGame)
    {
        try {
            $this->genderDuelGameService->markPlayerReady($genderDuelGame, auth()->id());
            return to_route('gender-duel-game.show', $genderDuelGame);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function leave(GenderDuelGame $genderDuelGame)
    {
        $this->genderDuelGameService->leaveGame($genderDuelGame, auth()->user());
        return redirect()->route('gender-duel-game.lobby');
    }
}
