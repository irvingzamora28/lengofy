# Lengofy Lesson Generator

This Laravel command allows you to generate language lessons from a course JSON file. The generator uses AI services to create lesson structures, MDX files, and audio JSON files.

## Requirements

- PHP 8.0 or higher
- Laravel 8.0 or higher
- Access to an AI API (OpenAI, Anthropic, or Google Gemini)

## Setup

Before using the lesson generator, make sure to set the following environment variables in your `.env` file:

```
# OpenAI
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4o-mini

# Anthropic (optional)
ANTHROPIC_API_KEY=your_api_key
ANTHROPIC_MODEL=claude-3-haiku-20240307

# Google Gemini (optional)
GOOGLE_GEMINI_API_KEY=your_api_key
GOOGLE_GEMINI_MODEL=gemini-1.5-pro-latest
```

## Usage

The basic command to generate lessons en:

```bash
php artisan lesson:generate [path_to_course_json_file] [options]
```

### Required Parameters

- `path_to_course_json_file`: Path to the JSON file containing the course structure.
- `--source_language`: Source language code (the language the student speaks, e.g. "es" for Spanish).
- `--target_language`: Target language code (the language being learned, e.g. "en" for English).

### Options

- `--lesson_number=X`: Generates only the lesson with the specified number. If not provided, all lessons will be generated.
- `--ai_provider=provider`: Specifies the AI ​​provider to use (openai, anthropic, google). Default: openai.
- `--structure_only`: Only generate the JSON structure of the lesson.
- `--mdx_only`: Only generate the MDX file of the lesson.
- `--audio_only`: Only generate the audio JSON file for the lesson.

### Examples

Generate all lessons of a course using OpenAI:

```bash
php artisan lesson:generate database/seeds/en/nouns/courses/es_english_course.json --source_language=es --target_language=en
```

Generate only lesson number 2 using OpenAI:

```bash
php artisan lesson:generate database/seeds/en/nouns/courses/es_english_course.json --lesson_number=2 --source_language=es --target_language=en --ai_provider=openai
```

Generate only lesson number 3 structure using Anthropic:

```bash
php artisan lesson:generate database/seeds/en/nouns/courses/es_english_course.json --lesson_number=3 --source_language=es --target_language=en --ai_provider=anthropic --structure_only
```

## Generated file structure

The command will generate the following files:

1. **Lesson JSON structure**:
- Location: `storage/app/lessons/{source_language}-{target_language}/01-beginner/lesson_{lesson_number}_structure.json`
- Contains the detailed lesson structure, including sections, components, and elements.

2. **Lesson MDX file**:
- Location: `resources/lessons/{source_language}-{target_language}/01-beginner/lesson_{lesson_number}_{slug}.mdx`
- Contains the lesson content in MDX format, ready to be rendered.

3. **Audio JSON file**:
- Location: `resources/lessons/{source_language}-{target_language}/01-beginner/audio/lesson_{lesson_number}_{slug}.json`
- Contains the information needed to generate audio files for the lesson.

## Output Formats

### Lesson Structure (JSON)

The lesson structure is generated in JSON format and contains the overall structure of the lesson, including sections, components, and vocabulary.

### MDX file

The generated MDX file includes:

1. **Frontmatter**: Contains lesson metadata, including:
- `title`: Title of the lesson
- `lesson_number`: Number of the lesson
- `description`: Brief description of the lesson
- `vocabulary`: List of vocabulary words with the following properties:
- `word`: The word or phrase in the target language
- `translation`: The translation in the source language
- `exampleSentence`: An example sentence using the word
- `exampleTranslation`: The translation of the example sentence
- `gender`: The grammatical gender if applicable (null if not applicable)
- `challenge`: A note about pronunciation or usage challenges

2. **Content**: Organized into sections with headers and components such as:
- `TextToSpeechPlayer`: To play audio
- `VocabularyTable`: To display vocabulary tables
- `SentenceBreakdown`: For grammar analysis
- `Mnemonic`: For mnemonic aids
- `TipBox`: For tips and important notes

### Audio JSON

The audio JSON file contains the information needed to generate audio files for the lesson:

```json
{
"language_code": "en",
"country_code": "US",
"lesson_number": 2,
"data": [
{
"text": "Text to speak",
"audio_file_name": "descriptive_name.mp3"
}
]
}
```

## Troubleshooting


If you encounter errors when generating lessons, check the following:

1. Make sure the AI ​​API keys are set correctly in the `.env` file.
2. Verify that the course JSON file is formatted correctly.
3. Make sure you provide the required `--source_language` and `--target_language` parameters.
4. If you receive invalid JSON errors, try a different AI provider or adjust your model parameters.

For more information on the course JSON file format, see the examples in `database/seeds/en/nouns/courses/`.
