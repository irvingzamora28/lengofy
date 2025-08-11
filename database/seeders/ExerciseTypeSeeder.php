<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ExerciseType;

class ExerciseTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            [
                'name' => 'fill-in-the-blank',
                'description' => 'Complete the sentence by filling in the missing words.'
            ],
            [
                'name' => 'verb-conjugation',
                'description' => 'Conjugate the given verb correctly for the subject and tense.'
            ],
            [
                'name' => 'sentence-ordering',
                'description' => 'Arrange the words in the correct order to form a proper sentence.'
            ],
            [
                'name' => 'multiple-choice',
                'description' => 'Select the correct answer from a list of options.'
            ],
            [
                'name' => 'matching',
                'description' => 'Match the words on the left with the words on the right.'
            ]
        ];

        foreach ($types as $type) {
            ExerciseType::firstOrCreate(['name' => $type['name']], $type);
        }
    }
}
