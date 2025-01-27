<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class UpcomingFeature extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'category_id'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(FeatureCategory::class);
    }

    public function subscribers(): BelongsToMany
    {
        return $this->belongsToMany(WaitlistSubscriber::class, 'subscriber_feature_interests', 'feature_id', 'subscriber_id')
            ->withTimestamps();
    }
}
