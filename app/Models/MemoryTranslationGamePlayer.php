<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemoryTranslationGamePlayer extends Model
{
    protected $table = 'memory_translation_game_players';

    protected $fillable = [
        'game_id',
        'user_id',
        'player_name',
        'score',
        'moves',
        'time',
        'is_ready',
    ];

    public function memoryTranslationGame(): BelongsTo
    {
        return $this->belongsTo(MemoryTranslationGame::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
