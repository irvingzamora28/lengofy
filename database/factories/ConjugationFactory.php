<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Verb;
use App\Models\Tense;
use App\Models\Pronoun;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Conjugation>
 */
class ConjugationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'verb_id' => Verb::factory(),
            'tense_id' => Tense::factory(),
            'pronoun_id' => Pronoun::factory(),
            'form' => $this->faker->unique()->word(),
            'normalized_form' => null, // allow null; can be set by mutator on save if desired
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}
