<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\MemoryTranslationGame;
use App\Models\GenderDuelGame;
use App\Models\WordSearchPuzzleGame;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlayerInGame
{
    /**
     * Game configurations for easy addition of new games
     */
    private const GAME_CONFIGS = [
        'memory-translation' => [
            'model' => MemoryTranslationGame::class,
            'route_param' => 'memoryTranslationGame',
        ],
        'word-search-puzzle' => [
            'model' => WordSearchPuzzleGame::class,
            'route_param' => 'wordSearchPuzzleGame',
        ],
        'gender-duel' => [
            'model' => GenderDuelGame::class,
            'route_param' => 'genderDuelGame',
        ],
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $gameType = $this->determineGameType($request);
        $config = self::GAME_CONFIGS[$gameType];

        $game = $request->route($config['route_param']);

        // Check game instance type
        if (!($game instanceof $config['model'])) {
            abort(404);
        }

        // If user is not logged in, redirect to invite page
        if (!auth()->check()) {
            return $this->redirectToInvite($gameType, $config['route_param'], $game);
        }

        // Check if logged-in user is in game
        if (!$game->players()->where('user_id', auth()->id())->exists()) {
            return $this->redirectToJoinFromInvite($gameType, $config['route_param'], $game);
        }

        return $next($request);
    }

    /**
     * Determine the game type from the route name
     */
    private function determineGameType(Request $request): string
    {
        $routeName = $request->route()->getName();

        foreach (array_keys(self::GAME_CONFIGS) as $gameType) {
            if (str_contains($routeName, $gameType)) {
                return $gameType;
            }
        }

        return 'gender-duel'; // Default fallback
    }

    /**
     * Generate redirect response to invite page
     */
    private function redirectToInvite(string $gameType, string $routeParam, $game): Response
    {
        return redirect()->route("games.{$gameType}.invite", [
            $routeParam => $game->id
        ]);
    }

    /**
     * Generate redirect response to join from invite page
     */
    private function redirectToJoinFromInvite(string $gameType, string $routeParam, $game): Response
    {
        return redirect()->route("games.{$gameType}.join-from-invite", [
            $routeParam => $game->id
        ]);
    }
}
