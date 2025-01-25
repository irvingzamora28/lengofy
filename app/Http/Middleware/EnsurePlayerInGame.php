<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\MemoryTranslationGame;
use App\Models\GenderDuelGame;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlayerInGame
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $routeName = $request->route()->getName();
        $gameType = str_contains($routeName, 'memory-translation') ? 'memory-translation' : 'gender-duel';
        
        // Get game model from route parameters
        if ($gameType === 'memory-translation') {
            $game = $request->route('memoryTranslationGame');
            if (!$game instanceof MemoryTranslationGame) {
                abort(404);
            }
        } else {
            $game = $request->route('genderDuelGame');
            if (!$game instanceof GenderDuelGame) {
                abort(404);
            }
        }

        // If user is not logged in, redirect to invite page
        if (!auth()->check()) {
            return redirect()->route("games.{$gameType}.invite", [
                $gameType === 'memory-translation' ? 'memoryTranslationGame' : 'genderDuelGame' => $game->id
            ]);
        }

        // Check if logged-in user is in game
        $isInGame = $game->players()->where('user_id', auth()->id())->exists();
        
        if (!$isInGame) {
            // Redirect to join-from-invite route
            return redirect()->route("games.{$gameType}.join-from-invite", [
                $gameType === 'memory-translation' ? 'memoryTranslationGame' : 'genderDuelGame' => $game->id
            ]);
        }

        return $next($request);
    }
}
