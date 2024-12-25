<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'animals',
            'food_drinks',
            'transportation',
            'technology',
            'nature',
            'clothing',
            'furniture',
            'sports',
            'household',
            'body',
            'school',
            'professions',
            'people_family',
            'health',
            'weather',
            'time',
            'numbers',
            'colors',
            'shapes',
            'miscellaneous',
        ];

        foreach ($categories as $categoryKey) {
            Category::firstOrCreate(['key' => $categoryKey]);
        }
    }
}
