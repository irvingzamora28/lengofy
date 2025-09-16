<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Verb extends Model
{
    use HasFactory;
    protected $fillable = [
        'language_id',
        'infinitive',
        'is_irregular',
        'frequency_rank',
        'translation',
        'metadata',
    ];

    protected $casts = [
        'is_irregular' => 'boolean',
        'metadata' => 'array',
    ];

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }

    public function conjugations(): HasMany
    {
        return $this->hasMany(Conjugation::class);
    }
}
