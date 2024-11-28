<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GamePlayer extends Model
{
    protected $fillable = [
        'game_id',
        'user_id',
        'guest_id',
        'player_name',
        'score',
        'is_ready',
        'answered_round',
    ];

    protected $casts = [
        'is_ready' => 'boolean',
        'score' => 'integer',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
