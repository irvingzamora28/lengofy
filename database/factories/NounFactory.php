<?php

namespace Database\Factories;

use App\Models\Language;
use App\Models\Noun;
use Illuminate\Database\Eloquent\Factories\Factory;

class NounFactory extends Factory
{
    protected $model = Noun::class;

    public function definition(): array
    {
        return [
            'language_id' => Language::factory(),
            'word' => $this->faker->word(),
            'gender' => $this->faker->randomElement(['der', 'die', 'das']),
            'difficulty_level' => $this->faker->randomElement(['beginner', 'intermediate', 'advanced']),
        ];
    }
}
