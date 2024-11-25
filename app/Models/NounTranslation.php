<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NounTranslation extends Model
{
    protected $fillable = [
        'noun_id',
        'language_pair_id',
        'translation',
    ];

    public function noun(): BelongsTo
    {
        return $this->belongsTo(Noun::class);
    }

    public function languagePair(): BelongsTo
    {
        return $this->belongsTo(LanguagePair::class);
    }
}
