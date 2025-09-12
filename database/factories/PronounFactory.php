<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Language;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Pronoun>
 */
class PronounFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $number = $this->faker->randomElement(['sg', 'pl']);
        $person = $this->faker->numberBetween(1, 3);
        $display = $this->faker->randomElement([
            'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'sie',
            'yo', 'tú', 'él', 'ella', 'nosotros', 'ustedes',
            'I', 'you', 'he', 'she', 'it', 'we', 'you (pl)', 'they',
        ]);

        return [
            'language_id' => Language::factory(),
            'code' => strtolower(preg_replace('/\s+/', '_', $display)),
            'display' => $display,
            'person' => $person,
            'number' => $number,
            'is_polite' => $this->faker->boolean(10),
            'order_index' => $this->faker->numberBetween(0, 20),
        ];
    }
}
