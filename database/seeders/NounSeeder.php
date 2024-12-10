<?php

namespace Database\Seeders;

use App\Models\Language;
use App\Models\Noun;
use App\Models\NounTranslation;
use Illuminate\Database\Seeder;

class NounSeeder extends Seeder
{
    public function run(): void
    {
        $languages = Language::all()->keyBy('code');

        // German nouns with translations
        $germanNouns = [
            ['word' => 'Haus', 'gender' => 'das', 'translations' => [
                'en' => 'house',
                'es' => 'casa',
            ]],
            ['word' => 'Katze', 'gender' => 'die', 'translations' => [
                'en' => 'cat',
                'es' => 'gato',
            ]],
            ['word' => 'Tisch', 'gender' => 'der', 'translations' => [
                'en' => 'table',
                'es' => 'mesa',
            ]],
            ['word' => 'Auto', 'gender' => 'das', 'translations' => [
                'en' => 'car',
                'es' => 'coche',
            ]],
            ['word' => 'Buch', 'gender' => 'das', 'translations' => [
                'en' => 'book',
                'es' => 'libro',
            ]],
            ['word' => 'Maus', 'gender' => 'die', 'translations' => [
                'en' => 'mouse',
                'es' => 'ratón',
            ]],
            ['word' => 'Bild', 'gender' => 'das', 'translations' => [
                'en' => 'picture',
                'es' => 'imagen',
            ]],
            ['word' => 'Hund', 'gender' => 'der', 'translations' => [
                'en' => 'dog',
                'es' => 'perro',
            ]],
            ['word' => 'Klavier', 'gender' => 'das', 'translations' => [
                'en' => 'piano',
                'es' => 'piano',
            ]],
            ['word' => 'Schlafzimmer', 'gender' => 'das', 'translations' => [
                'en' => 'bedroom',
                'es' => 'habitación',
            ]],
            ['word' => 'Schreibtisch', 'gender' => 'der', 'translations' => [
                'en' => 'desk',
                'es' => 'mesa',
            ]],
            // Add more German nouns here
        ];

        foreach ($germanNouns as $nounData) {
            $noun = Noun::create([
                'word' => $nounData['word'],
                'gender' => $nounData['gender'],
                'language_id' => $languages['de']->id,
                'difficulty_level' => 'beginner',
            ]);

            foreach ($nounData['translations'] as $langCode => $translation) {
                NounTranslation::create([
                    'noun_id' => $noun->id,
                    'language_id' => $languages[$langCode]->id,
                    'translation' => $translation,
                ]);
            }
        }

        // Spanish nouns with translations
        $spanishNouns = [
            ['word' => 'casa', 'gender' => 'la', 'translations' => [
                'en' => 'house',
                'de' => 'Haus',
            ]],
            ['word' => 'gato', 'gender' => 'el', 'translations' => [
                'en' => 'cat',
                'de' => 'Katze',
            ]],
            ['word' => 'mesa', 'gender' => 'la', 'translations' => [
                'en' => 'table',
                'de' => 'Tisch',
            ]],
            // Add more Spanish nouns here
        ];

        foreach ($spanishNouns as $nounData) {
            $noun = Noun::create([
                'word' => $nounData['word'],
                'gender' => $nounData['gender'],
                'language_id' => $languages['es']->id,
                'difficulty_level' => 'beginner',
            ]);

            foreach ($nounData['translations'] as $langCode => $translation) {
                NounTranslation::create([
                    'noun_id' => $noun->id,
                    'language_id' => $languages[$langCode]->id,
                    'translation' => $translation,
                ]);
            }
        }
    }
}
