<?php

namespace App\Http\Middleware;

use App\Models\Game;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Inertia\Inertia;

class CheckGameAvailability
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if (!$user || !$user->language_pair_id) {
            return redirect()->route('dashboard')
                ->with('error', trans('games.errors.select_language_pair'));
        }

        // Extract game slug from the URL path
        $path = $request->path();
        $gameSlug = explode('/', $path)[1] ?? null; // games/{gameSlug}/...

        if (!$gameSlug) {
            return redirect()->route('dashboard')
                ->with('error', trans('games.errors.invalid_game'));
        }

        // Load the game and check if it exists
        $game = Game::where('slug', $gameSlug)->first();
        if (!$game) {
            return redirect()->route('dashboard')
                ->with('error', trans('games.errors.game_not_found'));
        }

        // Load user's language pair with its relationships
        $languagePair = $user->languagePair()->with(['sourceLanguage', 'targetLanguage'])->first();
        if (!$languagePair) {
            return redirect()->route('dashboard')
                ->with('error', trans('games.errors.language_pair_not_found'));
        }

        // Create the language pair code (e.g., "en-de")
        $languagePairCode = $languagePair->sourceLanguage->code . '-' . $languagePair->targetLanguage->code;

        // Check if the game is available for this language pair
        if (!empty($game->supported_language_pairs) && !in_array($languagePairCode, $game->supported_language_pairs)) {
            return redirect()->route('dashboard')
                ->with('error', trans('games.errors.game_not_available_for_pair', [
                    'game' => $game->name,
                    'source' => $languagePair->sourceLanguage->name,
                    'target' => $languagePair->targetLanguage->name
                ]));
        }

        // Add the game to the request so controllers can use it
        $request->merge(['game' => $game]);

        return $next($request);
    }
}
