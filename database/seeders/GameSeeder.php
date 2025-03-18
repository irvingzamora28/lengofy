<?php

namespace Database\Seeders;

use App\Models\Game;
use Illuminate\Database\Seeder;

class GameSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        $games = [
            [
                'name' => 'Memory Translation Game',
                'slug' => 'memory-translation',
                'supported_language_pairs' => null, // Available for all language pairs
            ],
            [
                'name' => 'Gender Duel',
                'slug' => 'gender-duel',
                'supported_language_pairs' => ['en-de', 'es-de'], // Only available when target is German and source is English or Spanish
            ],
            [
                'name' => 'Word Puzzle',
                'slug' => 'word-search-puzzle',
                'supported_language_pairs' => null, // Available for all language pairs
            ],
        ];

        foreach ($games as $game) {
            Game::updateOrCreate(
                ['slug' => $game['slug']], // Find by slug
                $game // Update or create with these values
            );
        }
    }
}
