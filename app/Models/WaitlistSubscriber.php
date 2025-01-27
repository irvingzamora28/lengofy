<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class WaitlistSubscriber extends Model
{
    protected $fillable = ['email'];

    public function features(): BelongsToMany
    {
        return $this->belongsToMany(UpcomingFeature::class, 'subscriber_feature_interests', 'subscriber_id', 'feature_id')
            ->withTimestamps();
    }
}
