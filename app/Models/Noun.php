<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Noun extends Model
{
    protected $fillable = [
        'word',
        'language_id',
        'gender',
        'difficulty_level',
    ];

    protected $casts = [
        'difficulty_level' => 'string',
    ];

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }

    public function translations(): HasMany
    {
        return $this->hasMany(NounTranslation::class, 'noun_id');
    }

    public function getTranslation(string $languagePairId): ?string
    {
        return $this->translations()
            ->where('language_pair_id', $languagePairId)
            ->first()
            ?->translation;
    }

    public function scopeByDifficulty($query, string $level)
    {
        return $query->where('difficulty_level', $level);
    }
}
