<?php

namespace Database\Factories;

use App\Enums\GameStatus;
use App\Enums\GenderDuelGameStatus;
use App\Models\GenderDuelGame;
use App\Models\LanguagePair;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class GameFactory extends Factory
{
    protected $model = GenderDuelGame::class;

    public function definition(): array
    {
        return [
            'status' => GenderDuelGameStatus::WAITING,
            'max_players' => $this->faker->numberBetween(2, 10),
            'total_rounds' => 10,
            'current_round' => null,
            'current_word' => null,
            'language_pair_id' => LanguagePair::factory(),
            'creator_id' => User::factory(),
        ];
    }

    public function inProgress(): self
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => GenderDuelGameStatus::IN_PROGRESS,
                'current_round' => 1,
                'current_word' => [
                    'id' => 1,
                    'word' => 'Haus',
                    'gender' => 'das',
                    'translation' => 'house'
                ],
            ];
        });
    }

    public function ended(): self
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => GenderDuelGameStatus::ENDED,
                'current_round' => 10,
            ];
        });
    }
}
