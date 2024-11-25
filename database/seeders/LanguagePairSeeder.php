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
            ['source' => 'de', 'target' => 'en', 'rules' => ['gender_options' => ['der', 'die', 'das']]],
            ['source' => 'de', 'target' => 'es', 'rules' => ['gender_options' => ['der', 'die', 'das']]],
            ['source' => 'es', 'target' => 'en', 'rules' => ['gender_options' => ['el', 'la', 'los', 'las']]],
            ['source' => 'fr', 'target' => 'en', 'rules' => ['gender_options' => ['le', 'la', 'les']]],
            ['source' => 'fr', 'target' => 'es', 'rules' => ['gender_options' => ['le', 'la', 'les']]],
        ];

        foreach ($supportedPairs as $pair) {
            $sourceLanguage = $languages->firstWhere('code', $pair['source']);
            $targetLanguage = $languages->firstWhere('code', $pair['target']);

            if ($sourceLanguage && $targetLanguage) {
                LanguagePair::create([
                    'source_language_id' => $sourceLanguage->id,
                    'target_language_id' => $targetLanguage->id,
                    'is_active' => true,
                    'grammar_rules' => $pair['rules'],
                ]);
            }
        }
    }
}
