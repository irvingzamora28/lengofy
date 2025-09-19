<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserVerb extends Model
{
    use HasFactory;

    protected $table = 'user_verbs';

    protected $fillable = [
        'user_id',
        'verb_id',
        'priority',
        'notes',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verb(): BelongsTo
    {
        return $this->belongsTo(Verb::class);
    }
}
