<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;
use App\Models\LanguagePair;
use App\Models\VerbConjugationSlotGamePlayer;
use App\Enums\VerbConjugationSlotGameStatus;

class VerbConjugationSlotGame extends Model
{
    use HasFactory;

    protected $table = 'verb_conjugation_slot_games';

    protected $with = ['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage'];

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
        'status' => VerbConjugationSlotGameStatus::class,
        'difficulty' => 'string',
    ];

    public function languagePair(): BelongsTo
    {
        return $this->belongsTo(LanguagePair::class);
    }

    public function players(): HasMany
    {
        return $this->hasMany(VerbConjugationSlotGamePlayer::class, 'game_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }
}
