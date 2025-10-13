<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerbListItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'verb_list_id',
        'verb_id',
        'order_index',
        'notes',
    ];

    public function verbList(): BelongsTo
    {
        return $this->belongsTo(VerbList::class);
    }

    public function verb(): BelongsTo
    {
        return $this->belongsTo(Verb::class);
    }
}
