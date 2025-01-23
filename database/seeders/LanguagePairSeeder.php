<?php

namespace Database\Seeders;

use App\Models\Language;
use App\Models\LanguagePair;
use Illuminate\Database\Seeder;

class LanguagePairSeeder extends Seeder
{
    public function run(): void
    {
        $languages = Language::all();

        // Create language pairs for initial supported combinations
        $supportedPairs = [
            ['source' => 'en', 'target' => 'de', 'active' => true, 'rules' => ['gender_options' => ['der', 'die', 'das']]],
            ['source' => 'es', 'target' => 'de', 'active' => true, 'rules' => ['gender_options' => ['der', 'die', 'das']]],
            ['source' => 'de', 'target' => 'en', 'active' => false, 'rules' => ['gender_options' => []]],
            ['source' => 'de', 'target' => 'es', 'active' => false, 'rules' => ['gender_options' => ['el', 'la', 'los', 'las']]],
            ['source' => 'es', 'target' => 'en', 'active' => true, 'rules' => ['gender_options' => []]],
            ['source' => 'fr', 'target' => 'en', 'active' => false, 'rules' => ['gender_options' => []]],
            ['source' => 'fr', 'target' => 'es', 'active' => false, 'rules' => ['gender_options' => ['el', 'la', 'los', 'las']]],
        ];

        foreach ($supportedPairs as $pair) {
            $sourceLanguage = $languages->firstWhere('code', $pair['source']);
            $targetLanguage = $languages->firstWhere('code', $pair['target']);

            if ($sourceLanguage && $targetLanguage) {
                LanguagePair::create([
                    'source_language_id' => $sourceLanguage->id,
                    'target_language_id' => $targetLanguage->id,
                    'is_active' => $pair['active'],
                    'grammar_rules' => $pair['rules'],
                ]);
            }
        }
    }
}
