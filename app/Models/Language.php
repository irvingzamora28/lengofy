<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\NounTranslation;

class Language extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'is_active',
        'special_characters',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'special_characters' => 'array',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(NounTranslation::class);
    }
}
