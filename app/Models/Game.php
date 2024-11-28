<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;
use App\Models\LanguagePair;
use App\Models\GamePlayer;
use App\Enums\GameStatus;

class Game extends Model
{
    protected $fillable = [
        'status',
        'max_players',
        'current_round',
        'total_rounds',
        'current_word',
        'language_pair_id',
        'creator_id',
    ];

    protected $casts = [
        'current_word' => 'array',
        'status' => GameStatus::class,
    ];

    public function languagePair(): BelongsTo
    {
        return $this->belongsTo(LanguagePair::class);
    }

    public function players(): HasMany
    {
        return $this->hasMany(GamePlayer::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }
}
