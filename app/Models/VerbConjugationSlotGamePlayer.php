<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerbConjugationSlotGamePlayer extends Model
{
    protected $table = 'verb_conjugation_slot_game_players';

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

    public function game(): BelongsTo
    {
        return $this->belongsTo(VerbConjugationSlotGame::class, 'game_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
