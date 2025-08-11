<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{

    protected $fillable = [
        'title',
        'description',
        'level',
        'language_pair_id',
    ];

    public function languagePair()
    {
        return $this->belongsTo(LanguagePair::class);
    }

    public function progress()
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function exercises()
    {
        return $this->hasMany(Exercise::class);
    }
}
