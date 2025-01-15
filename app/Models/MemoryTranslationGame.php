<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MemoryTranslationGame extends Model
{
    protected $table = 'memory_translation_games';

    protected $fillable = [
        'creator_id',
        'language_pair_id',
        'status',
        'max_players',
        'total_words',
        'difficulty',
        'category_id',
    ];

    public function languagePair(): BelongsTo
    {
        return $this->belongsTo(LanguagePair::class);
    }

    public function players(): HasMany
    {
        return $this->hasMany(GenderDuelGamePlayer::class, 'game_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

}
