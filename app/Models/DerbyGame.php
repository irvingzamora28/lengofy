<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DerbyGame extends Model
{
    use HasFactory;

    protected $table = 'derby_games';

    protected $with = ['players', 'languagePair.sourceLanguage', 'languagePair.targetLanguage'];

    protected $fillable = [
        'status',
        'max_players',
        'race_mode',
        'race_duration_s',
        'total_segments',
        'language_pair_id',
        'creator_id',
        'difficulty',
        'category_id',
        'noun_list_ids',
        'verb_list_ids',
        'lesson_ids',
    ];

    protected $casts = [
        'noun_list_ids' => 'array',
        'verb_list_ids' => 'array',
        'lesson_ids' => 'array',
    ];

    public function languagePair(): BelongsTo
    {
        return $this->belongsTo(LanguagePair::class);
    }

    public function players(): HasMany
    {
        return $this->hasMany(DerbyGamePlayer::class, 'game_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }
}
