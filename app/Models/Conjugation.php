<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Conjugation extends Model
{
    protected $fillable = [
        'verb_id',
        'tense_id',
        'pronoun_id',
        'form',
        'normalized_form',
        'notes',
    ];

    public function verb(): BelongsTo
    {
        return $this->belongsTo(Verb::class);
    }

    public function tense(): BelongsTo
    {
        return $this->belongsTo(Tense::class);
    }

    public function pronoun(): BelongsTo
    {
        return $this->belongsTo(Pronoun::class);
    }

    public function setFormAttribute($value): void
    {
        $this->attributes['form'] = $value;
        // Keep normalized_form in sync when form is set
        $this->attributes['normalized_form'] = self::normalize($value);
    }

    public static function normalize(string $text): string
    {
        $lower = mb_strtolower($text, 'UTF-8');
        // Remove diacritics using iconv if available
        $normalized = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $lower);
        if ($normalized === false) {
            // Fallback: return lowercased text
            return $lower;
        }
        // Remove remaining non-spacing marks and trim
        return preg_replace('/[^a-z0-9\s\-\']+/i', '', $normalized) ?? $lower;
    }
}
