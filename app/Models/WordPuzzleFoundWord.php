<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WordPuzzleFoundWord extends Model
{
    protected $fillable = [
        'word_puzzle_game_id',
        'player_id',
        'word',
        'points',
        'found_at',
    ];

    protected $casts = [
        'found_at' => 'datetime',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(WordPuzzleGame::class, 'word_puzzle_game_id');
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(User::class, 'player_id');
    }
}
