<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Game extends Model
{
    protected $fillable = [
        'status',
        'max_players',
        'current_round',
        'total_rounds',
        'current_word',
        'language_pair_id',
    ];

    protected $casts = [
        'current_word' => 'array',
    ];

    public function languagePair(): BelongsTo
    {
        return $this->belongsTo(LanguagePair::class);
    }

    public function players(): HasMany
    {
        return $this->hasMany(GamePlayer::class);
    }
}
