<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Language;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Verb>
 */
class VerbFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'language_id' => Language::factory(),
            'infinitive' => $this->faker->unique()->word(),
            'is_irregular' => $this->faker->boolean(30),
            'frequency_rank' => $this->faker->numberBetween(1, 5000),
            'translation' => $this->faker->optional()->word(),
            'metadata' => null,
        ];
    }
}
