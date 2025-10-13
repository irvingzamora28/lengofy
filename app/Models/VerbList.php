<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class VerbList extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'order_index',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(VerbListItem::class);
    }

    public function verbs(): BelongsToMany
    {
        return $this->belongsToMany(Verb::class, 'verb_list_items')
            ->withPivot(['order_index', 'notes'])
            ->withTimestamps()
            ->orderBy('verb_list_items.order_index');
    }
}
