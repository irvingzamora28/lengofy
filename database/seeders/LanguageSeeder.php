<?php

namespace Database\Seeders;

use App\Models\Language;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;

class LanguageSeeder extends Seeder
{
    public function run(): void
    {
        Log::info('LanguageSeeder is running');
        $languages = [
            [
                'code' => 'en',
                'name' => 'English',
                // English generally doesn't need a special palette; keep empty for consistency
                'special_characters' => [],
            ],
            [
                'code' => 'es',
                'name' => 'Español',
                'special_characters' => [
                    'á','é','í','ó','ú','ü','ñ','¿','¡'
                ],
            ],
            [
                'code' => 'de',
                'name' => 'Deutsch',
                'special_characters' => [
                    'ä','ö','ü','ß'
                ],
            ],
            [
                'code' => 'fr',
                'name' => 'Français',
                'special_characters' => [
                    'à','â','ä','æ','ç','é','è','ê','ë','î','ï','ô','œ','ù','û','ü','ÿ'
                ],
            ],
            [
                'code' => 'it',
                'name' => 'Italiano',
                'special_characters' => [
                    'à','è','é','ì','í','î','ò','ó','ù','ú'
                ],
            ],
            [
                'code' => 'pt',
                'name' => 'Português',
                'special_characters' => [
                    'á','à','â','ã','é','ê','í','ó','ô','õ','ú','ç'
                ],
            ],
        ];

        foreach ($languages as $language) {
            Language::updateOrCreate(
                ['code' => $language['code']],
                $language
            );
        }
    }
}
