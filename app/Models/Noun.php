<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Noun extends Model
{
    use HasFactory;

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

    public function categories()
    {
        return $this->belongsToMany(Category::class, 'noun_category', 'noun_id', 'category_id');
    }

    public function translations(): HasMany
    {
        return $this->hasMany(NounTranslation::class, 'noun_id');
    }

    public function getTranslation(string $translation_language_id): ?string
    {
        return $this->translations()
            ->where('language_id', $translation_language_id)
            ->first()
            ?->translation;
    }

    public function scopeByDifficulty($query, string $level)
    {
        return $query->where('difficulty_level', $level);
    }
}
