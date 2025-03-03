<?php

namespace App\Services;

use App\Models\Lesson;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class LessonService
{
    /**
     * Get lessons for a user based on their language pair
     *
     * @param User $user
     * @return array|null Returns null if user has no language pair
     */
    public function getLessonsForUser(User $user): ?array
    {
        $languagePair = $user->languagePair;

        if (!$languagePair) {
            return null;
        }

        // Eager load lesson progress for the user's language pair
        $progress = $user->lessonProgress()
            ->where('language_pair_id', $languagePair->id)
            ->select('language_pair_id', 'level', 'lesson_number', 'completed')
            ->get()
            ->keyBy(function ($item) {
                return "{$item->language_pair_id}/{$item->level}/{$item->lesson_number}";
            });

        // Eager load lessons for the user's language pair
        $lessons = Lesson::where('language_pair_id', $languagePair->id)
            ->get();

        // Process lessons for rendering
        $lessonsArray = [];
        foreach ($lessons as $lesson) {
            // Add progress information to lessons
            $progressKey = "{$lesson->language_pair_id}/{$lesson->level}/{$lesson->lesson_number}";
            $lesson->completed = $progress->has($progressKey) ? $progress[$progressKey]->completed : false;

            // Handle json_decode for topics with error handling
            try {
                $lesson->topics = json_decode($lesson->topics, true, 512, JSON_THROW_ON_ERROR);
            } catch (\JsonException $e) {
                // Log the error and set topics to an empty array
                Log::error("Failed to decode JSON for lesson topics: " . $e->getMessage());
                $lesson->topics = [];
            }

            $lessonsArray[] = $lesson;
        }

        return $lessonsArray;
    }
}
