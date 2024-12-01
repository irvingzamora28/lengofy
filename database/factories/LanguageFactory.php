<?php

namespace Database\Factories;

use App\Models\Language;
use Illuminate\Database\Eloquent\Factories\Factory;

class LanguageFactory extends Factory
{
    protected $model = Language::class;

    public function definition(): array
    {
        return [
            'code' => $this->faker->unique()->randomElement(['de', 'en', 'es', 'fr', 'it']),
            'name' => $this->faker->unique()->randomElement(['German', 'English', 'Spanish', 'French', 'Italian']),
            'is_active' => true,
        ];
    }
}
