<?php

namespace Database\Seeders;

use App\Models\Language;
use App\Models\LanguagePair;
use App\Models\Noun;
use App\Models\NounTranslation;
use Illuminate\Database\Seeder;

class NounSeeder extends Seeder
{
    public function run(): void
    {
        $languages = Language::all()->keyBy('code');
        $languagePairs = LanguagePair::with(['sourceLanguage', 'targetLanguage'])->get();

        // German nouns with translations
        $germanNouns = [
            [
                'word' => 'Apfel',
                'gender' => 'der',
                'difficulty' => 'beginner',
                'translations' => [
                    'en' => 'apple',
                    'es' => 'manzana',
                ],
            ],
            [
                'word' => 'Buch',
                'gender' => 'das',
                'difficulty' => 'beginner',
                'translations' => [
                    'en' => 'book',
                    'es' => 'libro',
                ],
            ],
            [
                'word' => 'Computer',
                'gender' => 'der',
                'difficulty' => 'beginner',
                'translations' => [
                    'en' => 'computer',
                    'es' => 'computadora',
                ],
            ],
        ];

        // Spanish nouns with translations
        $spanishNouns = [
            [
                'word' => 'perro',
                'gender' => 'el',
                'difficulty' => 'beginner',
                'translations' => [
                    'en' => 'dog',
                ],
            ],
            [
                'word' => 'casa',
                'gender' => 'la',
                'difficulty' => 'beginner',
                'translations' => [
                    'en' => 'house',
                ],
            ],
        ];

        // French nouns with translations
        $frenchNouns = [
            [
                'word' => 'chat',
                'gender' => 'le',
                'difficulty' => 'beginner',
                'translations' => [
                    'en' => 'cat',
                    'es' => 'gato',
                ],
            ],
            [
                'word' => 'maison',
                'gender' => 'la',
                'difficulty' => 'beginner',
                'translations' => [
                    'en' => 'house',
                    'es' => 'casa',
                ],
            ],
        ];

        // Helper function to create nouns and their translations
        $createNounsWithTranslations = function ($nouns, $sourceLanguageCode) use ($languages, $languagePairs) {
            foreach ($nouns as $nounData) {
                $noun = Noun::create([
                    'word' => $nounData['word'],
                    'language_id' => $languages[$sourceLanguageCode]->id,
                    'gender' => $nounData['gender'],
                    'difficulty_level' => $nounData['difficulty'],
                ]);

                // Create translations for each target language
                foreach ($nounData['translations'] as $targetCode => $translation) {
                    $languagePair = $languagePairs->first(function ($pair) use ($sourceLanguageCode, $targetCode, $languages) {
                        return $pair->sourceLanguage->code === $sourceLanguageCode &&
                               $pair->targetLanguage->code === $targetCode;
                    });

                    if ($languagePair) {
                        NounTranslation::create([
                            'noun_id' => $noun->id,
                            'language_pair_id' => $languagePair->id,
                            'translation' => $translation,
                        ]);
                    }
                }
            }
        };

        // Create nouns for each language
        $createNounsWithTranslations($germanNouns, 'de');
        $createNounsWithTranslations($spanishNouns, 'es');
        $createNounsWithTranslations($frenchNouns, 'fr');
    }
}
