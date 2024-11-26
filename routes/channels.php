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
    $game = Game::find($gameId);
    if (!$game) {
        return false;
    }

    return [
        'id' => $user->id,
        'name' => $user->name
    ];
});
