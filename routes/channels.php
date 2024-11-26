<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Game;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('game.{gameId}', function ($user, $gameId) {
    $game = Game::with('players')->find($gameId);
    if (!$game) {
        return false;
    }

    $player = $game->players->where('user_id', $user->id)->first();
    if (!$player) {
        return false;
    }

    return [
        'id' => $user->id, // Use user_id for consistency
        'name' => $player->player_name,
        'player_id' => $player->id // Also include the player_id if needed
    ];
});
