<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LanguagePair extends Model
{
    protected $fillable = [
        'source_language_id',
        'target_language_id',
        'is_active',
        'grammar_rules',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'grammar_rules' => 'array',
    ];

    public function sourceLanguage(): BelongsTo
    {
        return $this->belongsTo(Language::class, 'source_language_id');
    }

    public function targetLanguage(): BelongsTo
    {
        return $this->belongsTo(Language::class, 'target_language_id');
    }

    public function translations(): HasMany
    {
        return $this->hasMany(WordTranslation::class);
    }

    public function games(): HasMany
    {
        return $this->hasMany(Game::class);
    }
}
