<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WordSearchPuzzlePlayer extends Model
{
    use HasFactory;

    protected $fillable = [
        'word_search_puzzle_game_id',
        'user_id',
        'score',
        'is_ready',
    ];

    protected $casts = [
        'is_ready' => 'boolean',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(WordSearchPuzzleGame::class, 'word_search_puzzle_game_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
