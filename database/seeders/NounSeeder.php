<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Language;
use App\Models\Noun;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NounSeeder extends Seeder
{

    protected $languageCode;

    public function __construct($languageCode = 'de')
    {
        $this->languageCode = $languageCode;
    }

    public function run(): void
    {
        $files = [
            'animals_nouns_seed.json',
            'colors_nouns_seed.json',
            'health_nouns_seed.json',
            'nature_nouns_seed.json',
            'people_family_nouns_seed.json',
            'shapes_nouns_seed.json',
            'time_nouns_seed.json',
            'body_nouns_seed.json',
            'food_drinks_nouns_seed.json',
            'household_nouns_seed.json',
            'professions_nouns_seed.json',
            'sports_nouns_seed.json',
            'transportation_nouns_seed.json',
            'clothing_nouns_seed.json',
            'furniture_nouns_seed.json',
            'miscellaneous_nouns_seed.json',
            'numbers_nouns_seed.json',
            'school_nouns_seed.json',
            'technology_nouns_seed.json',
            'weather_nouns_seed.json',
        ];

        $nouns = [];
        foreach ($files as $file) {
            $filePath = database_path('seeds/' . $this->languageCode . '/' . $file);
            $fileNouns = json_decode(file_get_contents($filePath), true);
            $nouns = array_merge($nouns, $fileNouns);
        }
        $language = Language::where('code', $this->languageCode)->firstOrFail();

        $nounData = [];
        $categoryNounData = [];
        $translationData = [];

        foreach ($nouns as $noun) {
        $category = Category::where('key', $noun['category'])->firstOrFail();

        $newNoun = Noun::create([
            'word' => $noun['word'],
            'gender' => $noun['gender'],
            'difficulty_level' => $noun['difficulty_level'],
            'emoji' => $noun['emoji'] ?? null,
            'language_id' => $language->id,
        ]);

        $categoryNounData[] = [
            'category_id' => $category->id,
            'noun_id' => $newNoun->id,
        ];
        $translationLanguages = Language::whereIn('code', array_keys($noun['translations']))->get()->keyBy('code');

        foreach ($noun['translations'] as $languageCode => $translation) {
            $translationLanguage = $translationLanguages[$languageCode];
            $translationData[] = [
                'language_id' => $translationLanguage->id,
                'translation' => $translation,
                'noun_id' => $newNoun->id,
            ];
        }
    }

    DB::table('nouns')->insert($nounData);
    DB::table('category_noun')->insert($categoryNounData);
    DB::table('noun_translations')->insert($translationData);
}}
