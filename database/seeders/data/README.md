# JSON-based Exercises Import

This directory holds JSON files used by the `lessons:seed-exercises` Artisan command to import exercises for a given language pair and lesson.

## Default File Path
- Command will look for: `database/seeders/data/{pair}/lesson-{lesson}.json`
  - Example pair: `en-de`, lesson 2 → `database/seeders/data/en-de/lesson-2.json`
- You can override the path with `--file=...`.

## Command Usage
```bash
php artisan lessons:seed-exercises --pair=en-de --lesson=2
# or with explicit file path
php artisan lessons:seed-exercises --pair=en-de --lesson=2 --file=database/seeders/data/en-de/lesson-2.json
# do not delete existing exercises first
php artisan lessons:seed-exercises --pair=en-de --lesson=2 --no-wipe
```

## JSON Schema
Top-level structure:
```json
{
  "exercises": [
    {
      "type": "matching",
      "title": "Match: Greetings and Phrases",
      "instructions": "Match each German phrase with its English meaning.",
      "order": 1,
      "is_active": true,
      "data": {
        "pairs": [ { "left": "Guten Morgen", "right": "Good morning" } ],
        "shuffle": true
      }
    },
    {
      "type": "multiple-choice",
      "title": "Choose the Right Greeting or Phrase",
      "instructions": "Select the best option.",
      "order": 2,
      "is_active": true,
      "data": {
        "questions": [
          {
            "prompt": "08:30, meeting a client (formal)",
            "choices": [
              { "text": "Guten Morgen", "correct": true },
              { "text": "Hallo", "correct": false },
              { "text": "Na?", "correct": false }
            ],
            "explanation": "Use a formal morning greeting."
          }
        ],
        "shuffleQuestions": true,
        "shuffleChoices": true
      }
    },
    {
      "type": "fill-in-the-blank",
      "title": "Complete the Phrases (Unambiguous)",
      "instructions": "Fill in the missing word.",
      "order": 3,
      "is_active": true,
      "data": {
        "sentences": [
          { "text": "Wie ____ es dir?", "blanks": [ { "answer": "geht" } ], "explanation": "Wie geht es dir?" }
        ],
        "shuffleSentences": false,
        "caseSensitive": false,
        "trimWhitespace": true
      }
    },
    {
      "type": "sentence-ordering",
      "title": "Order the Sentence",
      "instructions": "Arrange the tokens to form the sentence.",
      "order": 4,
      "is_active": true,
      "data": {
        "items": [
          { "target": "Ich heiße Maria.", "tokens": ["heiße","Ich","Maria","."], "explanation": "Verb second." }
        ],
        "shuffleTokens": true
      }
    }
  ]
}
```

Notes:
- Valid `type` values must exist in `exercise_types.name` (e.g., `matching`, `multiple-choice`, `fill-in-the-blank`, `sentence-ordering`).
- The `data` object shape depends on the exercise type and must match the frontend components.
- If `order` is omitted, it defaults to the array index + 1.
- If `is_active` is omitted, it defaults to `true`.
