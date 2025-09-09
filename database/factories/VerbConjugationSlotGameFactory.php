<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\VerbConjugationSlotGame;
use App\Models\LanguagePair;
use App\Models\User;

/**
 * @extends Factory<\App\Models\VerbConjugationSlotGame>
 */
class VerbConjugationSlotGameFactory extends Factory
{
    protected $model = VerbConjugationSlotGame::class;

    public function definition(): array
    {
        return [
            'creator_id' => User::factory(),
            'language_pair_id' => LanguagePair::factory(),
            'status' => 'waiting',
            'max_players' => 8,
            'total_rounds' => 10,
            'difficulty' => 'medium',
            'category_id' => null,
        ];
    }
}
