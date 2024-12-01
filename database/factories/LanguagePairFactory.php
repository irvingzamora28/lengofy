<?php

namespace Database\Factories;

use App\Models\Language;
use App\Models\LanguagePair;
use Illuminate\Database\Eloquent\Factories\Factory;

class LanguagePairFactory extends Factory
{
    protected $model = LanguagePair::class;

    public function definition(): array
    {
        return [
            'source_language_id' => Language::factory(),
            'target_language_id' => Language::factory(),
            'is_active' => true,
        ];
    }
}
