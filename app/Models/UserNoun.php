<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNoun extends Model
{
    use HasFactory;

    protected $table = 'user_nouns';

    protected $fillable = [
        'user_id',
        'noun_id',
        'priority',
        'notes',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function noun(): BelongsTo
    {
        return $this->belongsTo(Noun::class);
    }
}
