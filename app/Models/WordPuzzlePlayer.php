<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WordPuzzlePlayer extends Model
{
    use HasFactory;

    protected $fillable = [
        'word_puzzle_game_id',
        'user_id',
        'player_name',
        'score',
        'is_ready',
        'is_host',
    ];

    protected $casts = [
        'is_ready' => 'boolean',
        'is_host' => 'boolean',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(WordPuzzleGame::class, 'word_puzzle_game_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}