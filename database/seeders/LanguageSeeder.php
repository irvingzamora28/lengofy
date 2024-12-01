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
            ['code' => 'en', 'name' => 'English'],
            ['code' => 'es', 'name' => 'Español'],
            ['code' => 'de', 'name' => 'Deutsch'],
            ['code' => 'fr', 'name' => 'Français'],
            ['code' => 'it', 'name' => 'Italiano'],
            ['code' => 'pt', 'name' => 'Português'],
        ];

        foreach ($languages as $language) {
            Language::create($language);
        }
    }
}
