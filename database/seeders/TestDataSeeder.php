<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Game;
use App\Models\Score;
use App\Models\User;

class TestDataSeeder extends Seeder
{
    public function run()
    {
        // Create some test games
        $game1 = Game::create(['name' => 'Test Game 1']);
        $game2 = Game::create(['name' => 'Test Game 2']);

        // Create some test users with unique identifiers
        $users = [];
        for ($i = 1; $i <= 100; $i++) {
            $users[] = User::create(['name' => "Test User $i", 'email' => "test$i@example.com", "password" => "password", "is_guest" => false]);
        }

        // Create test scores dynamically for each user
        // Include $index in the foreach loop
        foreach ($users as $index => $user) {
            Score::create([
                'user_id' => $user->id,
                'game_id' => $index % 2 ? $game1->id : $game2->id,
                'highest_score' => rand(50, 150), // Random score between 50 and 150
                'total_points' => rand(100, 50000), // Random total points between 100 and 300
                'winning_streak' => rand(1, 10), // Random winning streak between 1 and 10
            ]);
        }
    }

    public function cleanup()
    {
        // Delete test data based on unique identifiers
        Score::whereIn('user_id', function($query) {
            $query->select('id')->from('users')->where('email', 'like', 'test%@example.com');
        })->delete();

        User::where('email', 'like', 'test%@example.com')->delete();

        Game::whereIn('name', ['Test Game 1', 'Test Game 2'])->delete();
    }
}
