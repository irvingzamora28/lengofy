<?php

namespace Database\Seeders;

use App\Models\FeatureCategory;
use App\Models\UpcomingFeature;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UpcomingFeaturesSeeder extends Seeder
{
    public function run()
    {
        $categories = [
            [
                'name' => 'Interactive Vocabulary Builder 📚',
                'features' => [
                    'Flashcard system with spaced repetition 🔁',
                    'Progress tracking and personalized review sessions 📊',
                    'Audio pronunciation for words 🔊',
                ]
            ],
            [
                'name' => 'Conversation Practice 💬',
                'features' => [
                    'AI-powered chat scenarios 🤖',
                    'Role-playing exercises 🎭',
                    'Speech recognition for pronunciation 🎤',
                    'Dialogue completion exercises 🗣️',
                    'Real-time feedback on grammar ✅',
                ]
            ],
            [
                'name' => 'Grammar Challenges 🧠',
                'features' => [
                    'Interactive grammar exercises ✍️',
                    'Progressive difficulty levels 📈',
                    'Grammar rule explanations 📖',
                    'Sentence construction exercises 🏗️',
                    'Error correction challenges ❌',
                ]
            ],
            [
                'name' => 'Reading Comprehension 📖',
                'features' => [
                    'Short stories at different levels 📚',
                    'News articles in target language 📰',
                    'Interactive comprehension questions ❓',
                    'Vocabulary highlighting and translation 🔍',
                ]
            ],
            [
                'name' => 'Writing Workshop ✍️',
                'features' => [
                    'Guided writing exercises 📝',
                    'Sentence structure practice 🖋️',
                ]
            ],
            [
                'name' => 'Cultural Learning 🌍',
                'features' => [
                    'Cultural facts and traditions 🎎',
                    'Traditional songs and music 🎶',
                    'Cultural etiquette lessons 🎩',
                    'Holiday and celebration explanations 🎉',
                ]
            ],
            [
                'name' => 'Progress Tracking 📊',
                'features' => [
                    'Detailed progress dashboard 📈',
                    'Achievement badges and rewards 🏅',
                    'Daily streaks and challenges 🔥',
                    'Learning path visualization 🗺️',
                    'Competitive leaderboards 🏆',
                ]
            ],
            [
                'name' => 'Social Learning 👥',
                'features' => [
                    'Community forums 💬',
                    'Shared progress celebrations 🎉',
                    'Multiplayer learning games 🎮',
                ]
            ],
            [
                'name' => 'Mobile Learning 📱',
                'features' => [
                    'Offline learning capabilities 📴',
                    'Push notifications for reminders 🔔',
                    'Quick practice sessions ⏱️',
                    'Cross-device synchronization 🔄',
                ]
            ],
        ];

        foreach ($categories as $categoryData) {
            $category = FeatureCategory::create([
                'name' => $categoryData['name'],
                'slug' => Str::slug($categoryData['name']),
            ]);

            foreach ($categoryData['features'] as $featureName) {
                UpcomingFeature::create([
                    'feature_category_id' => $category->id,
                    'name' => $featureName,
                    'slug' => Str::slug($featureName),
                ]);
            }
        }
    }
}
