<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;
use App\Models\LanguagePair;
use App\Models\GenderDuelGamePlayer;
use App\Enums\GenderDuelGameStatus;

class GenderDuelGame extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'gender_duel_games';

    /**
     * The relationships that should always be loaded.
     *
     * @var array
     */
    protected $with = ['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage'];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'status',
        'max_players',
        'total_rounds',
        'language_pair_id',
        'creator_id',
        'difficulty',
        'category_id',
    ];

    protected $casts = [
        'current_word' => 'array',
        'status' => GenderDuelGameStatus::class,
        'difficulty' => 'string',
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
