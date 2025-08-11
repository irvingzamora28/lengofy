<?php

namespace App\Services;

use App\Models\Exercise;
use App\Models\Lesson;
use App\Models\ExerciseType;
use Illuminate\Support\Facades\DB;

class ExerciseService
{
    /**
     * Create a new exercise for a lesson.
     */
    public function create(array $data): Exercise
    {
        return DB::transaction(function () use ($data) {
            return Exercise::create($data);
        });
    }

    /**
     * Update an existing exercise.
     */
    public function update(Exercise $exercise, array $data): Exercise
    {
        $exercise->update($data);
        return $exercise;
    }

    /**
     * Delete an exercise.
     */
    public function delete(Exercise $exercise): void
    {
        $exercise->delete();
    }

    /**
     * Get all exercises for a lesson.
     */
    public function getByLesson(Lesson $lesson)
    {
        return $lesson->exercises()->with('exerciseType')->orderBy('order')->get();
    }
}
