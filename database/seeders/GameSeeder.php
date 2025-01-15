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
            ['name' => 'Gender Duel', 'slug' => 'gender-duel'],
            ['name' => 'Memory Translation', 'slug' => 'memory-translation'],
        ];

        foreach ($games as $game) {
            Game::create($game);
        }
    }
}
