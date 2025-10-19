<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DerbyGamePlayer extends Model
{
    protected $table = 'derby_game_players';

    protected $fillable = [
        'game_id',
        'user_id',
        'guest_id',
        'player_name',
        'score',
        'progress',
        'is_ready',
    ];

    protected $casts = [
        'is_ready' => 'boolean',
        'score' => 'integer',
        'progress' => 'float',
    ];

    public function derbyGame(): BelongsTo
    {
        return $this->belongsTo(DerbyGame::class, 'game_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
