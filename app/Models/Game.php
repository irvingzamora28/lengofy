<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug'];
    protected $casts = [
        'supported_language_pairs' => 'array',
    ];

    public function scores()
    {
        return $this->hasMany(Score::class);
    }
}
