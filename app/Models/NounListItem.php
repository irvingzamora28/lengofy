<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NounListItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'noun_list_id',
        'noun_id',
        'order_index',
        'notes',
    ];

    public function nounList(): BelongsTo
    {
        return $this->belongsTo(NounList::class);
    }

    public function noun(): BelongsTo
    {
        return $this->belongsTo(Noun::class);
    }
}
