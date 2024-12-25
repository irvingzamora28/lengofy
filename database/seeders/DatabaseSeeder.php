<?php

namespace Database\Seeders;

use Database\Seeders\LanguageSeeder;
use Database\Seeders\LanguagePairSeeder;
use Database\Seeders\NounSeeder;
use Database\Seeders\CategorySeeder;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call([
            LanguageSeeder::class,
            LanguagePairSeeder::class,
            CategorySeeder::class,
            NounSeeder::class,
            GameSeeder::class,
        ]);
    }
}
