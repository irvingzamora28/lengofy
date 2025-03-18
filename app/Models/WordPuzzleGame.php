<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WordPuzzleGame extends Model
{
    protected $fillable = [
        'creator_id',
        'status',
        'language_pair_id',
        'max_players',
        'winner_id',
        'round_time',
        'difficulty',
        'category_id',
    ];

    protected $casts = [
        'max_players' => 'integer',
        'round_time' => 'integer',
    ];

    public function languagePair(): BelongsTo
    {
        return $this->belongsTo(LanguagePair::class);
    }

    public function players(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'word_puzzle_players')
            ->withPivot(['score', 'is_ready'])
            ->withTimestamps();
    }

    public function foundWords(): HasMany
    {
        return $this->hasMany(WordPuzzleFoundWord::class, 'word_puzzle_game_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function winner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'winner_id');
    }
}
