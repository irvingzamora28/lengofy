<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeatureCategory extends Model
{
    protected $fillable = ['name', 'slug', 'description'];

    public function features(): HasMany
    {
        return $this->hasMany(UpcomingFeature::class);
    }
}
