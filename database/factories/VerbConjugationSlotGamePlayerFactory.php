<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\VerbConjugationSlotGamePlayer;
use App\Models\VerbConjugationSlotGame;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * @extends Factory<\App\Models\VerbConjugationSlotGamePlayer>
 */
class VerbConjugationSlotGamePlayerFactory extends Factory
{
    protected $model = VerbConjugationSlotGamePlayer::class;

    public function definition(): array
    {
        return [
            'game_id' => VerbConjugationSlotGame::factory(),
            'user_id' => null, // or User::factory()
            'guest_id' => (string) Str::uuid(),
            'player_name' => $this->faker->name(),
            'score' => 0,
            'is_ready' => false,
        ];
    }
}
