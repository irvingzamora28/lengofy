<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tense extends Model
{
    use HasFactory;
    protected $fillable = [
        'language_id',
        'code',
        'name',
        'is_compound',
        'order_index',
    ];

    protected $casts = [
        'is_compound' => 'boolean',
        'order_index' => 'integer',
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
