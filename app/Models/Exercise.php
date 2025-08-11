<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Exercise extends Model
{
    protected $fillable = [
        'lesson_id',
        'exercise_type_id',
        'title',
        'instructions',
        'data',
        'order',
        'is_active',
    ];

    protected $casts = [
        'data' => 'array',
        'is_active' => 'boolean',
    ];

    public function exerciseType()
    {
        return $this->belongsTo(ExerciseType::class);
    }

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }
}
