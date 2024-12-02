<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GenderDuelGamePlayer extends Model
{

    protected $table = 'gender_duel_game_players';

    protected $fillable = [
        'game_id',
        'user_id',
        'guest_id',
        'player_name',
        'score',
        'is_ready',
    ];

    protected $casts = [
        'is_ready' => 'boolean',
        'score' => 'integer',
    ];

    public function genderDuelGame(): BelongsTo
    {
        return $this->belongsTo(GenderDuelGame::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
