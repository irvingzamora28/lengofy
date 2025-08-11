<?php

namespace Database\Seeders;

use App\Models\Exercise;
use App\Models\ExerciseType;
use App\Models\Lesson;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;

class Lesson02ExercisesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Resolve the lesson by its MDX title (unique)
        $lessonTitle = 'Lesson 2: Greetings and Introductions in German';
        $lesson = Lesson::where('title', $lessonTitle)->first();

        if (!$lesson) {
            Log::warning("Lesson not found: {$lessonTitle}. Skipping Lesson02ExercisesSeeder.");
            return;
        }

        // Resolve exercise types
        $typeNames = ['matching', 'multiple-choice', 'fill-in-the-blank', 'sentence-ordering'];
        $types = ExerciseType::whereIn('name', $typeNames)->get()->keyBy('name');

        foreach ($typeNames as $t) {
            if (!isset($types[$t])) {
                Log::warning("Exercise type not found: {$t}. Skipping.");
                return;
            }
        }

        // 1) Matching (>= 20 pairs)
        $matchingData = [
            'pairs' => [
                [ 'left' => 'Guten Morgen', 'right' => 'Good morning' ],
                [ 'left' => 'Guten Tag', 'right' => 'Good day/afternoon' ],
                [ 'left' => 'Guten Abend', 'right' => 'Good evening' ],
                [ 'left' => 'Hallo', 'right' => 'Hello (general)' ],
                [ 'left' => 'Tschüss', 'right' => 'Goodbye' ],
                [ 'left' => 'Servus', 'right' => 'Hello (Southern Germany/Austria)' ],
                [ 'left' => 'Moin', 'right' => 'Hello (Northern Germany)' ],
                [ 'left' => 'Grüß Gott', 'right' => 'Greetings (Southern Germany/Austria)' ],
                [ 'left' => "Wie geht's?", 'right' => "How's it going?" ],
                [ 'left' => 'Wie geht es dir?', 'right' => 'How are you? (informal)' ],
                [ 'left' => 'Wie geht es Ihnen?', 'right' => 'How are you? (formal)' ],
                [ 'left' => 'Ich heiße ...', 'right' => 'I am called ...' ],
                [ 'left' => 'Mein Name ist ...', 'right' => 'My name is ...' ],
                [ 'left' => 'Ich bin ...', 'right' => 'I am ...' ],
                [ 'left' => 'Das ist ...', 'right' => 'This is ...' ],
                [ 'left' => 'Freut mich!', 'right' => 'Pleased to meet you!' ],
                [ 'left' => 'Sehr erfreut!', 'right' => 'Very pleased to meet you!' ],
                [ 'left' => 'Entschuldigung', 'right' => 'Excuse me' ],
                [ 'left' => 'Sprechen Sie Englisch?', 'right' => 'Do you speak English?' ],
                [ 'left' => 'Ich verstehe das nicht.', 'right' => "I don't understand that." ],
                [ 'left' => 'Könnten Sie das bitte wiederholen?', 'right' => 'Could you please repeat that?' ],
                [ 'left' => 'Ich hätte gern ...', 'right' => 'I would like ...' ],
            ],
            'shuffle' => true,
        ];

        $this->upsertExercise(
            $lesson->id,
            $types['matching']->id,
            'Match: Greetings and Phrases',
            'Match each German phrase with its English meaning. (Regional notes included)',
            $matchingData,
            1
        );

        // 2) Multiple-choice (>= 20 questions)
        $mcData = [
            'questions' => [
                [
                    'prompt' => '08:30, meeting a client for the first time (formal).',
                    'choices' => [
                        ['text' => 'Guten Morgen', 'correct' => true],
                        ['text' => 'Hallo', 'correct' => false],
                        ['text' => 'Na?', 'correct' => false],
                    ],
                    'explanation' => 'Use a formal time-of-day greeting in the morning.'
                ],
                [
                    'prompt' => '14:00, formal appointment at an office.',
                    'choices' => [
                        ['text' => 'Guten Tag', 'correct' => true],
                        ['text' => 'Servus', 'correct' => false],
                        ['text' => 'Moin', 'correct' => false],
                    ]
                ],
                [
                    'prompt' => '19:00, professional event (formal).',
                    'choices' => [
                        ['text' => 'Guten Abend', 'correct' => true],
                        ['text' => 'Hallo', 'correct' => false],
                        ['text' => 'Tschüss', 'correct' => false],
                    ]
                ],
                [
                    'prompt' => 'Informal text to a friend.',
                    'choices' => [
                        ['text' => 'Hallo', 'correct' => true],
                        ['text' => 'Guten Tag', 'correct' => false],
                        ['text' => 'Grüß Gott', 'correct' => false],
                    ]
                ],
                [
                    'prompt' => 'Informal greeting in Northern Germany.',
                    'choices' => [
                        ['text' => 'Moin', 'correct' => true],
                        ['text' => 'Servus', 'correct' => false],
                        ['text' => 'Guten Abend', 'correct' => false],
                    ]
                ],
                [
                    'prompt' => 'Informal greeting in Southern Germany/Austria.',
                    'choices' => [
                        ['text' => 'Servus', 'correct' => true],
                        ['text' => 'Moin', 'correct' => false],
                        ['text' => 'Tschüss', 'correct' => false],
                    ]
                ],
                [
                    'prompt' => 'Polite greeting to an elderly person in Austria.',
                    'choices' => [
                        ['text' => 'Grüß Gott', 'correct' => true],
                        ['text' => 'Hallo', 'correct' => false],
                        ['text' => 'Na?', 'correct' => false],
                    ]
                ],
                [
                    'prompt' => 'Saying goodbye to a friend (informal).',
                    'choices' => [
                        ['text' => 'Tschüss', 'correct' => true],
                        ['text' => 'Guten Tag', 'correct' => false],
                        ['text' => 'Guten Morgen', 'correct' => false],
                    ]
                ],
                [
                    'prompt' => 'Choose the correct self-introduction.',
                    'choices' => [
                        ['text' => 'Ich heiße Anna.', 'correct' => true],
                        ['text' => 'Ich Name ist Anna.', 'correct' => false],
                        ['text' => 'Ich bin heiße Anna.', 'correct' => false],
                    ]
                ],
                [
                    'prompt' => 'Formal: How are you?',
                    'choices' => [
                        ['text' => 'Wie geht es Ihnen?', 'correct' => true],
                        ['text' => 'Wie geht es dir?', 'correct' => false],
                        ['text' => "Wie geht's?", 'correct' => false],
                    ]
                ],
                [
                    'prompt' => 'Informal: How are you?',
                    'choices' => [
                        ['text' => 'Wie geht es dir?', 'correct' => true],
                        ['text' => 'Wie geht es Ihnen?', 'correct' => false],
                        ['text' => 'Guten Tag', 'correct' => false],
                    ]
                ],
                [
                    'prompt' => 'Polite: Excuse me',
                    'choices' => [
                        ['text' => 'Entschuldigung', 'correct' => true],
                        ['text' => 'Bitte', 'correct' => false],
                        ['text' => 'Danke', 'correct' => false],
                    ]
                ],
                [
                    'prompt' => 'Ask: Do you speak English? (formal)',
                    'choices' => [
                        ['text' => 'Sprechen Sie Englisch?', 'correct' => true],
                        ['text' => 'Sprichst du Englisch?', 'correct' => false],
                        ['text' => 'Sprecht ihr Englisch?', 'correct' => false],
                    ]
                ],
                [
                    'prompt' => "Say: I don't understand that.",
                    'choices' => [
                        ['text' => 'Ich verstehe das nicht.', 'correct' => true],
                        ['text' => 'Ich verstehe nicht das.', 'correct' => false],
                        ['text' => 'Ich das nicht verstehe.', 'correct' => false],
                    ]
                ],
                [
                    'prompt' => 'Say: I would like a coffee.',
                    'choices' => [
                        ['text' => 'Ich hätte gern einen Kaffee.', 'correct' => true],
                        ['text' => 'Ich hätte gern Kaffee einen.', 'correct' => false],
                        ['text' => 'Ich gern hätte einen Kaffee.', 'correct' => false],
                    ]
                ],
                [
                    'prompt' => 'Ask: Could you please repeat that?',
                    'choices' => [
                        ['text' => 'Könnten Sie das bitte wiederholen?', 'correct' => true],
                        ['text' => 'Könnten das Sie bitte wiederholen?', 'correct' => false],
                        ['text' => 'Können du das bitte wiederholen?', 'correct' => false],
                    ]
                ],
                [
                    'prompt' => 'Introduce someone: This is my friend, Peter.',
                    'choices' => [
                        ['text' => 'Das ist mein Freund, Peter.', 'correct' => true],
                        ['text' => 'Das mein Freund ist, Peter.', 'correct' => false],
                        ['text' => 'Mein Freund das ist, Peter.', 'correct' => false],
                    ]
                ],
                [
                    'prompt' => 'Respond: Pleased to meet you!',
                    'choices' => [
                        ['text' => 'Freut mich!', 'correct' => true],
                        ['text' => 'Gern geschehen!', 'correct' => false],
                        ['text' => 'Bis später!', 'correct' => false],
                    ]
                ],
                [
                    'prompt' => 'Respond: Very pleased to meet you.',
                    'choices' => [
                        ['text' => 'Sehr erfreut!', 'correct' => true],
                        ['text' => 'Sehr danke!', 'correct' => false],
                        ['text' => 'Sehr bitte!', 'correct' => false],
                    ]
                ],
                [
                    'prompt' => 'Ask about a seat: Is this seat free?',
                    'choices' => [
                        ['text' => 'Ist hier frei?', 'correct' => true],
                        ['text' => 'Ist frei hier?', 'correct' => false],
                        ['text' => 'Ist es frei?', 'correct' => false],
                    ]
                ],
                [
                    'prompt' => 'Formal question: Do you know Mrs. Weber?',
                    'choices' => [
                        ['text' => 'Kennen Sie Frau Weber?', 'correct' => true],
                        ['text' => 'Kennst du Frau Weber?', 'correct' => false],
                        ['text' => 'Kennt ihr Frau Weber?', 'correct' => false],
                    ]
                ],
                [
                    'prompt' => 'Choose the correct time-of-day greeting for 11:30 (borderline late morning).',
                    'choices' => [
                        ['text' => 'Guten Tag', 'correct' => true],
                        ['text' => 'Guten Morgen', 'correct' => false],
                        ['text' => 'Guten Abend', 'correct' => false],
                    ],
                    'explanation' => 'Around late morning to evening, Guten Tag is common.'
                ],
            ]
        ];

        $this->upsertExercise(
            $lesson->id,
            $types['multiple-choice']->id,
            'Choose the Right Greeting or Phrase',
            'Select the best option for each situation or sentence.',
            $mcData,
            2
        );

        // 3) Fill-in-the-blank (>= 20 sentences) — unambiguous tokens
        $fibData = [
            'sentences' => [
                [ 'text' => 'Wie ____ es dir?', 'blanks' => [ ['answer' => 'geht'] ], 'explanation' => 'Wie geht es dir?' ],
                [ 'text' => 'Wie ____ du?', 'blanks' => [ ['answer' => 'heißt'] ], 'explanation' => 'Wie heißt du?' ],
                [ 'text' => 'Mein Name ____ Anna.', 'blanks' => [ ['answer' => 'ist'] ] ],
                [ 'text' => 'Das ____ mein Freund.', 'blanks' => [ ['answer' => 'ist'] ] ],
                [ 'text' => 'Ich ____ das nicht.', 'blanks' => [ ['answer' => 'verstehe'] ] ],
                [ 'text' => 'Entschuldigung, ____ ist die Toilette?', 'blanks' => [ ['answer' => 'wo'] ] ],
                [ 'text' => '____ Sie Englisch?', 'blanks' => [ ['answer' => 'Sprechen'] ] ],
                [ 'text' => '____ mich!', 'blanks' => [ ['answer' => 'Freut'] ] ],
                [ 'text' => 'Sehr ____!', 'blanks' => [ ['answer' => 'erfreut'] ] ],
                [ 'text' => '____ ist mein Freund, Peter.', 'blanks' => [ ['answer' => 'Das'] ] ],
                [ 'text' => 'Könnten ____ das bitte wiederholen?', 'blanks' => [ ['answer' => 'Sie'] ] ],
                [ 'text' => 'Ich hätte ____ einen Kaffee.', 'blanks' => [ ['answer' => 'gern'] ] ],
                [ 'text' => 'Ist hier ____?', 'blanks' => [ ['answer' => 'frei'] ] ],
                [ 'text' => '____ Tag!', 'blanks' => [ ['answer' => 'Guten'] ] ],
                [ 'text' => '____ Morgen!', 'blanks' => [ ['answer' => 'Guten'] ] ],
                [ 'text' => '____ Abend!', 'blanks' => [ ['answer' => 'Guten'] ] ],
                [ 'text' => '____ Gott!', 'blanks' => [ ['answer' => 'Grüß'] ] ],
                [ 'text' => '____ Sie Frau Weber?', 'blanks' => [ ['answer' => 'Kennen'] ] ],
                [ 'text' => 'Darf ich ____ Anna vorstellen?', 'blanks' => [ ['answer' => 'Ihnen'] ] ],
                [ 'text' => 'Darf ich Ihnen Anna ____?', 'blanks' => [ ['answer' => 'vorstellen'] ] ],
                [ 'text' => 'Guten Tag, mein ____ ist Lisa.', 'blanks' => [ ['answer' => 'Name'] ] ],
                [ 'text' => '____ , ich verstehe das nicht.', 'blanks' => [ ['answer' => 'Entschuldigung'] ] ],
            ]
        ];

        $this->upsertExercise(
            $lesson->id,
            $types['fill-in-the-blank']->id,
            'Complete the Phrases (Unambiguous)',
            'Fill in the missing word. Each blank has only one correct answer.',
            $fibData,
            3
        );

        // 4) Sentence ordering (>= 20 items)
        $orderingData = [
            'items' => [
                [ 'target' => 'Ich heiße Maria.', 'tokens' => ['heiße','Ich','Maria','.'], 'explanation' => 'Verb second.' ],
                [ 'target' => 'Mein Name ist Thomas.', 'tokens' => ['ist','Mein','Name','Thomas','.'] ],
                [ 'target' => 'Ich bin Anna.', 'tokens' => ['bin','Ich','Anna','.'] ],
                [ 'target' => 'Das ist mein Freund, Peter.', 'tokens' => ['ist','Das','mein','Freund',',','Peter','.'] ],
                [ 'target' => 'Guten Morgen, Herr Schmidt!', 'tokens' => ['Morgen',',','Herr','Schmidt','!','Guten'] ],
                [ 'target' => 'Guten Tag, Frau Weber!', 'tokens' => ['Tag',',','Frau','Weber','!','Guten'] ],
                [ 'target' => 'Guten Abend, Frau Müller!', 'tokens' => ['Abend',',','Frau','Müller','!','Guten'] ],
                [ 'target' => 'Hallo, Anna!', 'tokens' => ['Anna','!','Hallo',','] ],
                [ 'target' => 'Servus, Lisa!', 'tokens' => ['Lisa','!','Servus',','] ],
                [ 'target' => 'Moin, Jan!', 'tokens' => ['Jan','!','Moin',','] ],
                [ 'target' => 'Grüß Gott, Herr Meier!', 'tokens' => ['Gott',',','Herr','Meier','!','Grüß'] ],
                [ 'target' => 'Wie geht es dir?', 'tokens' => ['es','Wie','geht','dir','?'] ],
                [ 'target' => 'Wie geht es Ihnen?', 'tokens' => ['es','Wie','geht','Ihnen','?'] ],
                [ 'target' => 'Freut mich!', 'tokens' => ['mich','!','Freut'] ],
                [ 'target' => 'Sehr erfreut!', 'tokens' => ['erfreut','!','Sehr'] ],
                [ 'target' => 'Entschuldigung, wo ist die Toilette?', 'tokens' => ['wo','Entschuldigung',',','ist','die','Toilette','?'] ],
                [ 'target' => 'Sprechen Sie Englisch?', 'tokens' => ['Sie','Sprechen','Englisch','?'] ],
                [ 'target' => 'Ich verstehe das nicht.', 'tokens' => ['das','Ich','verstehe','nicht','.'] ],
                [ 'target' => 'Könnten Sie das bitte wiederholen?', 'tokens' => ['Sie','Könnten','das','bitte','wiederholen','?'] ],
                [ 'target' => 'Ich hätte gern einen Kaffee.', 'tokens' => ['gern','Ich','hätte','einen','Kaffee','.'] ],
                [ 'target' => 'Ist hier frei?', 'tokens' => ['frei','Ist','hier','?'] ],
                [ 'target' => 'Darf ich Ihnen Anna vorstellen?', 'tokens' => ['ich','Darf','Ihnen','Anna','vorstellen','?'] ],
            ],
            'shuffleTokens' => true
        ];

        $this->upsertExercise(
            $lesson->id,
            $types['sentence-ordering']->id,
            'Put the Words in Order',
            'Arrange the tiles to form a correct sentence.',
            $orderingData,
            4
        );
    }

    /**
     * Helper to upsert an exercise by (lesson_id, exercise_type_id, title)
     */
    private function upsertExercise(
        int $lessonId,
        int $exerciseTypeId,
        string $title,
        string $instructions,
        array $data,
        int $order
    ): void {
        Exercise::updateOrCreate(
            [
                'lesson_id' => $lessonId,
                'exercise_type_id' => $exerciseTypeId,
                'title' => $title,
            ],
            [
                'instructions' => $instructions,
                'data' => json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'order' => $order,
                'is_active' => true,
            ]
        );
    }
}
