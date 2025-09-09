<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Language;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tense>
 */
class TenseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Example random code parts
        $lang = $this->faker->randomElement(['de', 'es', 'en']);
        $code = match ($lang) {
            'de' => $this->faker->randomElement(['pres.ind', 'perf.ind', 'praet.ind']),
            'es' => $this->faker->randomElement(['pres.ind', 'pret.ind', 'fut.simp']),
            'en' => $this->faker->randomElement(['pres.simp', 'past.simp', 'fut.simp']),
            default => 'pres.ind',
        };

        return [
            'language_id' => Language::factory(),
            'code' => $lang . '.' . $code,
            'name' => ucfirst($this->faker->words(2, true)),
            'is_compound' => $this->faker->boolean(20),
            'order_index' => $this->faker->numberBetween(0, 100),
        ];
    }
}
