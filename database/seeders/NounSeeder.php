<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Language;
use App\Models\Noun;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NounSeeder extends Seeder
{
    public function run(): void
    {
        $nouns = json_decode(file_get_contents(database_path('seeds/nouns_seed.json')), true);
        $language = Language::where('name', 'Deutsch')->firstOrFail();

        foreach ($nouns as $noun) {

            $category = Category::where('key', $noun['category'])->firstOrFail();

            $newNoun = new Noun();
            $newNoun->word = $noun['word'];
            $newNoun->gender = $noun['gender'];
            $newNoun->difficulty_level = $noun['difficulty_level'];
            $newNoun->language()->associate($language);
            $newNoun->save();

            $newNoun->categories()->attach($category->id);

            // Associate english translation
            $translationLanguages = Language::whereIn('code', array_keys($noun['translations']))->get()->keyBy('code');

            foreach ($noun['translations'] as $languageCode => $translation) {
                $translationLanguage = $translationLanguages[$languageCode];
                DB::table('noun_translations')->insert([
                    'language_id' => $translationLanguage->id,
                    'translation' => $translation,
                    'noun_id' => $newNoun->id
                ]);
            }
        }
    }
}
