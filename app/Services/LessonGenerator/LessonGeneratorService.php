<?php

namespace App\Services\LessonGenerator;

use App\Services\AI\AIServiceFactory;
use App\Services\AI\AIServiceInterface;
use Exception;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class LessonGeneratorService
{
    protected $aiService;
    protected $sourceLanguage;
    protected $targetLanguage;

    /**
     * Create a new LessonGeneratorService instance
     *
     * @param string $provider The AI provider to use (openai, anthropic, google)
     * @param string $sourceLanguage The language code of the speaker (e.g., 'es' for Spanish)
     * @param string $targetLanguage The language code being learned (e.g., 'en' for English)
     */
    public function __construct(string $provider, string $sourceLanguage, string $targetLanguage)
    {
        $this->aiService = AIServiceFactory::create($provider);
        $this->sourceLanguage = $sourceLanguage;
        $this->targetLanguage = $targetLanguage;
    }

    /**
     * Generate a lesson structure JSON from a course JSON file
     *
     * @param string $courseJsonPath Path to the course JSON file
     * @param int $lessonNumber The lesson number to generate
     * @return string Path to the generated lesson structure JSON file
     */
    public function generateLessonStructure(string $courseJsonPath, int $lessonNumber): string
    {
        // Read the course JSON file
        $courseJson = json_decode(File::get($courseJsonPath), true);

        // Find the lesson by number
        $lesson = null;
        foreach ($courseJson as $level) {
            foreach ($level['lessons'] as $lessonData) {
                if ($lessonData['lesson_number'] == $lessonNumber) {
                    $lesson = $lessonData;
                    break 2;
                }
            }
        }

        if (!$lesson) {
            throw new Exception("Lesson number $lessonNumber not found in the course JSON file");
        }

        // Create the lesson structure prompt
        $prompt = $this->createLessonStructurePrompt($lesson, $this->sourceLanguage, $this->targetLanguage);

        // Generate the lesson structure using AI
        $lessonStructureJson = $this->aiService->generateContent($prompt);

        // Clean the response to ensure it's valid JSON
        $lessonStructureJson = $this->cleanJsonResponse($lessonStructureJson);

        // Ensure the generated content is valid JSON
        $lessonStructure = json_decode($lessonStructureJson, true);
        if (!$lessonStructure) {
            $jsonError = json_last_error_msg();
            $excerpt = substr($lessonStructureJson, 0, 500) . (strlen($lessonStructureJson) > 500 ? '...' : '');
            throw new Exception("Generated lesson structure is not valid JSON. Error: $jsonError. Content excerpt: \n$excerpt");
        }

        // Create the directory if it doesn't exist
        $outputDir = storage_path("app/lessons/{$this->sourceLanguage}-{$this->targetLanguage}/01-beginner");
        if (!File::exists($outputDir)) {
            File::makeDirectory($outputDir, 0755, true);
        }

        // Create a slug from the lesson name
        $slug = Str::slug($lesson['name']);

        // Save the lesson structure JSON
        $outputPath = "$outputDir/lesson_{$lessonNumber}_structure.json";
        File::put($outputPath, json_encode($lessonStructure, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return $outputPath;
    }

    /**
     * Generate a lesson MDX file from a lesson structure JSON
     *
     * @param string $lessonStructurePath Path to the lesson structure JSON file
     * @return string Path to the generated MDX file
     */
    public function generateLessonMdx(string $lessonStructurePath): string
    {
        // Read the lesson structure JSON
        $lessonStructure = json_decode(File::get($lessonStructurePath), true);

        // Create the lesson MDX prompt
        $prompt = $this->createLessonMdxPrompt($lessonStructure, $this->sourceLanguage, $this->targetLanguage, $lessonStructure['lesson_number']);

        // Generate the lesson MDX using AI
        $lessonMdx = $this->aiService->generateContent($prompt);

        // Extract the lesson number from the structure
        $lessonNumber = $lessonStructure['lesson_number'] ?? 1;

        // Create a slug from the lesson title
        $slug = Str::slug($lessonStructure['title']);

        // Determine the output directory
        $outputDir = resource_path("lessons/{$this->sourceLanguage}-{$this->targetLanguage}/01-beginner");
        if (!File::exists($outputDir)) {
            File::makeDirectory($outputDir, 0755, true);
        }

        // Save the lesson MDX
        $outputPath = "$outputDir/lesson_{$lessonNumber}_{$slug}.mdx";
        File::put($outputPath, $lessonMdx);

        return $outputPath;
    }

    /**
     * Generate an audio JSON file for a lesson
     *
     * @param string $mdxFilePath Path to the lesson MDX file
     * @return string Path to the generated audio JSON file
     */
    public function generateAudioJson(string $mdxFilePath): string
    {
        // Read the MDX file
        $mdxContent = File::get($mdxFilePath);

        // Extract lesson number from MDX file
        $lessonNumber = 1; // Default
        if (preg_match('/lesson_number:\s*(\d+)/', $mdxContent, $matches)) {
            $lessonNumber = (int) $matches[1];
        }

        // Create the audio JSON prompt
        $prompt = $this->createAudioJsonPrompt($mdxContent, $this->targetLanguage, $lessonNumber);

        // Generate the audio JSON using AI
        $audioJson = $this->aiService->generateContent($prompt);

        // Clean the response to ensure it's valid JSON
        $audioJson = $this->cleanJsonResponse($audioJson);

        // Ensure the generated content is valid JSON
        $audioStructure = json_decode($audioJson, true);
        if (!$audioStructure) {
            $jsonError = json_last_error_msg();
            $excerpt = substr($audioJson, 0, 500) . (strlen($audioJson) > 500 ? '...' : '');
            throw new Exception("Generated audio JSON is not valid JSON. Error: $jsonError. Content excerpt: \n$excerpt");
        }

        // Get the directory and filename from the MDX file path
        $pathInfo = pathinfo($mdxFilePath);
        $directory = $pathInfo['dirname'];
        $filename = $pathInfo['filename'];

        // Create the audio directory if it doesn't exist
        $audioDir = "$directory/audio";
        if (!File::exists($audioDir)) {
            File::makeDirectory($audioDir, 0755, true);
        }

        // Save the audio JSON
        $outputPath = "$audioDir/{$filename}.json";
        File::put($outputPath, json_encode($audioStructure, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return $outputPath;
    }

    /**
     * Create a prompt for generating the lesson structure
     *
     * @param array $lesson The lesson data from the course JSON
     * @param string $sourceLanguage The language code of the speaker
     * @param string $targetLanguage The language code being learned
     * @return string The prompt
     */
    protected function createLessonStructurePrompt(array $lesson, string $sourceLanguage, string $targetLanguage): string
    {
        $sourceLanguageName = $this->getLanguageName($sourceLanguage);
        $targetLanguageName = $this->getLanguageName($targetLanguage);

        return <<<PROMPT
You are an expert language curriculum designer. Create a detailed lesson structure for a language learning platform.

TASK:
Create a JSON structure for a language lesson with the following details:
- Lesson Title: {$lesson['name']}
- Lesson Number: {$lesson['lesson_number']}
- Description: {$lesson['description']}
- Source Language: $sourceLanguageName
- Target Language: $targetLanguageName

The JSON structure should include multiple sections, each with a title, description, and appropriate components.

IMPORTANT: Your response must be ONLY valid JSON without any additional text, markdown formatting, or code blocks.

COMPONENTS GUIDE:
Here are the available components and when to use them:

1. TextToSpeechPlayer:
   - Purpose: Plays audio of text for pronunciation practice
   - Use in: Vocabulary sections, dialogue sections, pronunciation practice
   - Not appropriate for: Cultural notes or grammar explanations without examples

2. SentenceBreakdown:
   - Purpose: Breaks down sentences to show word-by-word translations and grammar notes
   - Use in: Grammar sections, example sentences, dialogue analysis
   - Not appropriate for: Introduction sections or cultural notes

3. VocabularyTable:
   - Purpose: Displays vocabulary words with translations and example usage
   - Use in: Vocabulary sections, thematic word groups
   - Not appropriate for: Introduction or conclusion sections

4. Mnemonic:
   - Purpose: Provides memory aids for difficult vocabulary or grammar concepts
   - Use in: Vocabulary sections, grammar rules that are challenging to remember
   - Not appropriate for: Basic vocabulary or simple concepts

5. TipBox:
   - Purpose: Highlights important tips, exceptions, or cultural notes
   - Use in: Any section where additional guidance would be helpful
   - Especially useful for: Grammar exceptions, cultural context, pronunciation tips

6. VoiceRecorder:
   - Purpose: Allows learners to record themselves and compare with native pronunciation
   - Use in: Pronunciation practice, speaking exercises, dialogue practice
   - Not appropriate for: Grammar explanation sections or cultural notes

7. WordBuilder:
   - Purpose: Interactive exercise to practice forming words
   - Use in: Vocabulary practice sections, word formation exercises
   - Not appropriate for: Introduction sections or cultural notes

8. Quiz:
   - Purpose: Tests learner's understanding with multiple-choice questions
   - Use in: Review sections, comprehension checks
   - Not appropriate for: Introduction sections

SECTION PLANNING GUIDELINES:
1. Introduction Section:
   - Should provide an overview of what will be learned
   - Appropriate components: TextToSpeechPlayer, TipBox
   - Should NOT include: SentenceBreakdown, VoiceRecorder, WordBuilder, Quiz

2. Vocabulary Sections:
   - Should include new words related to the lesson theme
   - Appropriate components: VocabularyTable, TextToSpeechPlayer, Mnemonic
   - May include: TipBox for usage notes

3. Grammar Sections:
   - Should explain grammatical concepts with examples
   - Appropriate components: SentenceBreakdown, TipBox, TextToSpeechPlayer
   - May include: Mnemonic for complex rules

4. Practice Sections:
   - Should provide opportunities to apply new knowledge
   - Appropriate components: VoiceRecorder, WordBuilder, Quiz
   - Should include: TextToSpeechPlayer for models

5. Cultural Notes:
   - Should provide cultural context relevant to the language
   - Appropriate components: TipBox, TextToSpeechPlayer for examples
   - Should NOT include: SentenceBreakdown, WordBuilder

Create a comprehensive lesson structure with at least 5-7 sections that follow these guidelines and are appropriate for the lesson topic.

RESPONSE FORMAT:
Return ONLY a valid JSON object with the following structure:
{
  "title": "Lesson Title",
  "lesson_number": X,
  "description": "Lesson description",
  "sections": [
    {
      "title": "Section Title",
      "about": "Section description",
      "components": ["ComponentName1", "ComponentName2"],
      "elements": ["list", "paragraph", "dialogue"]
    }
  ]
}
PROMPT;
    }

    /**
     * Create a prompt for generating the lesson MDX
     *
     * @param array $lessonStructure The lesson structure
     * @param string $sourceLanguage The language code of the speaker
     * @param string $targetLanguage The language code being learned
     * @param int $lessonNumber The lesson number
     * @return string The prompt for generating the lesson MDX
     */
    protected function createLessonMdxPrompt(array $lessonStructure, string $sourceLanguage, string $targetLanguage, int $lessonNumber = 1): string
    {
        $sourceLanguageName = $this->getLanguageName($sourceLanguage);
        $targetLanguageName = $this->getLanguageName($targetLanguage);
        $lessonStructureJson = json_encode($lessonStructure, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        return <<<PROMPT
You are an expert language curriculum designer with extensive experience creating engaging, comprehensive language learning content. Create a detailed MDX file for a language learning platform.

TASK:
Create a rich, educational MDX file for a language lesson with the following structure:
$lessonStructureJson

IMPORTANT GUIDELINES:

1. The MDX file should be comprehensive, educational, and engaging.
2. Include detailed explanations, multiple examples, and cultural context where relevant.
3. Ensure the content is progressive, building from simple to more complex concepts.
4. Use the JSX components naturally and correctly within the educational content:

- TextToSpeechPlayer: This component embeds audio related to the lesson. Use it without any title or explicit announcement. Just insert it where the audio example is necessary. Format: <TextToSpeechPlayer mp3File="relative_path_to_audio_file" />. Ensure the path is relevant to the content discussed. If the audio that represents the example is only one word add the "miniPlayer" parameter set to true. If its a "miniPlayer" put the example and the TextToSpeechPlayer component formated inside a table. When the TextToSpeechPlayer is a miniPlayer it MUST be inside a table. Format: <TextToSpeechPlayer mp3File="relative_path_to_audio_file" miniPlayer={true} />.

- TipBox: This component highlights key tips or important notes within the content. It should encapsulate a list of tips or a single tip directly, without any preceding title like "Tip:". Format: <TipBox>Here goes the tip or a list of tips.</TipBox>. It should be used to emphasize crucial points or suggestions naturally within the flow of the content.

- Mnemonic: This component provides mnemonic aids for learning. Include it directly where the mnemonic aid is relevant to the lesson content. Do not precede it with any titles or introductions. It should appear as a natural part of the educational narrative. Format: <Mnemonic content="mnemonic_phrase" />. Ensure the content is helpful and relevant to the associated topic.

- HighlightableText: This component highlights key words or phrases in a sentence and provides additional information (e.g., translations, grammar rules, pronunciation). Use it to make vocabulary or grammar points interactive. It should only be used in sentences and not on single words. It should not be used in a list. Format: <HighlightableText highlights='[{"word":"Guten","info":"Means good in the accusative case."},{"word":"Morgen","info":"Means morning. Pronounced: MOR-gen."}]'>Guten Morgen, wie geht es dir?</HighlightableText>

- SentenceBreakdown: This component breaks down complex sentences into smaller parts with explanations for each segment. Use it to teach sentence structure interactively. Format: <SentenceBreakdown sentence="Your sentence here"><Part part="segment" explanation="explanation" />...</SentenceBreakdown>. Each <Part> represents a segment of the sentence and its corresponding explanation. Learners can click through parts to understand the sentence structure step by step. Use it to make sentence analysis engaging and interactive.

- VoiceRecorder: This component is an interactive tool designed to help language learners improve their pronunciation. It allows users to Record Their Voice and Listen to Native Pronunciation. Format: <VoiceRecorder text="Guten Morgen" nativeAudio="../../courses/en-de/_shared/guten_morgen.mp3" />

- WordBuilder: This component allows users to practice vocabulary by scrambling the letters of a given word. It takes two arguments: targetWord (the word to be unscrambled) and nativeWord (the corresponding word in the learner's native language). Use it to engage learners in reconstructing words from scrambled letters. Format: <WordBuilder targetWord="your_target_word" nativeWord="your_native_word" />. Ensure the words are relevant to the lesson context to enhance the learning experience.

5. Ensure the vocabulary section in the frontmatter is correctly formatted with properties such as word, translation, exampleSentence, exampleTranslation, gender, and challenge.
6. Include at least 10 vocabulary items with detailed examples and explanations.
7. Create a comprehensive lesson that covers all aspects of the topic thoroughly.
8. For audio files, use paths like "/audio/filename.mp3" for general audio and "../../assets/courses/$sourceLanguageName-$targetLanguageName/_shared/lessons/lesson$lessonNumber/audio/word.mp3" for specific word pronunciations.
9. Include at least 3 VoiceRecorder components for pronunciation practice.
10. Include at least 2 WordBuilder components for vocabulary practice.
11. Include at least 2 SentenceBreakdown components for grammar analysis.
12. Include at least 2 HighlightableText components for interactive vocabulary learning.
13. Include at least 2 TipBox components for important notes and tips.
14. Include at least 1 Mnemonic component for memory aids.
15. Include at least 3 TextToSpeechPlayer components for audio examples.
16. Ensure all components are used naturally and appropriately within the content.

IMPORTANT: Each component MUST be used correctly into the content, appropriately and naturally. Avoid misuse or incorrect parameterization of these components. These are the only JSX componets that exist so avoid using any other components.

OUTPUT FORMAT:
The output should be a complete MDX file with frontmatter and content sections. Include all necessary components as described above.

```mdx
---
title: "Your Title Here"
lesson_number: $lessonNumber
description: "Brief description of the lesson"
vocabulary:
  - word: "example_word"
    translation: "translation"
    exampleSentence: "Example sentence using the word"
    exampleTranslation: "Translation of the example sentence"
    gender: null or "masculine"/"feminine" if applicable
    challenge: "Any pronunciation or usage challenges"
  # Add more vocabulary items as needed
---

## Introduction

Your introduction here...

## Section 1

Your content here...

## Section 2

Your content here...

## Practice Exercises

Your exercises here...

## Cultural Notes

Your cultural notes here...

## Summary

Your summary here...
```

Create a comprehensive, educational MDX file following these guidelines.
PROMPT;
    }

    /**
     * Extract text segments that need to be converted to speech from an MDX file
     *
     * @param string $mdxContent The content of the MDX file
     * @return array Array of text segments that need audio
     */
    protected function extractTextToSpeechContent(string $mdxContent): array
    {
        $textToSpeechContent = [];
        $lessonNumber = 1;

        // Extract lesson number from frontmatter
        if (preg_match('/lesson_number:\s*(\d+)/', $mdxContent, $matches)) {
            $lessonNumber = (int) $matches[1];
        }

        // Extract all TextToSpeechPlayer components
        preg_match_all('/<TextToSpeechPlayer[^>]*mp3File="[^"]*\/audio\/([^"]+)\.mp3"[^>]*>/', $mdxContent, $matches, PREG_SET_ORDER);

        if (!empty($matches)) {
            $processedAudioFiles = [];

            foreach ($matches as $match) {
                $audioFileName = $match[1];

                // Skip if we've already processed this audio file
                if (in_array($audioFileName, $processedAudioFiles)) {
                    continue;
                }

                $processedAudioFiles[] = $audioFileName;

                // Find the text content that should be associated with this audio file
                $textContent = $this->findTextForAudioFile($mdxContent, $match[0], $audioFileName);

                if ($textContent) {
                    $textToSpeechContent[] = [
                        'text' => $textContent,
                        'audio_file_name' => $audioFileName . '.mp3'
                    ];
                }
            }
        }

        // If no text was found, extract from other components
        if (empty($textToSpeechContent)) {
            // Extract text from HighlightableText components
            preg_match_all('/<HighlightableText[^>]*>([^<]+)<\/HighlightableText>/', $mdxContent, $highlightMatches);
            if (!empty($highlightMatches[1])) {
                foreach ($highlightMatches[1] as $index => $text) {
                    $textToSpeechContent[] = [
                        'text' => trim($text),
                        'audio_file_name' => "highlighted_text_" . ($index + 1) . ".mp3"
                    ];
                }
            }

            // Extract text from VoiceRecorder components
            preg_match_all('/<VoiceRecorder\s+text="([^"]+)"/', $mdxContent, $voiceMatches);
            if (!empty($voiceMatches[1])) {
                foreach ($voiceMatches[1] as $index => $text) {
                    $textToSpeechContent[] = [
                        'text' => trim($text),
                        'audio_file_name' => "voice_" . ($index + 1) . ".mp3"
                    ];
                }
            }

            // Extract text from WordBuilder components
            preg_match_all('/<WordBuilder\s+targetWord="([^"]+)"/', $mdxContent, $wordMatches);
            if (!empty($wordMatches[1])) {
                foreach ($wordMatches[1] as $index => $text) {
                    $textToSpeechContent[] = [
                        'text' => trim($text),
                        'audio_file_name' => "word_" . ($index + 1) . ".mp3"
                    ];
                }
            }
        }

        return $textToSpeechContent;
    }

    /**
     * Find the text that should be converted to speech for a specific audio file
     *
     * @param string $mdxContent The content of the MDX file
     * @param string $component The TextToSpeechPlayer component
     * @param string $audioFileName The audio file name (without extension)
     * @return string|null The text to be converted to speech, or null if not found
     */
    protected function findTextForAudioFile(string $mdxContent, string $component, string $audioFileName): ?string
    {
        $componentPosition = strpos($mdxContent, $component);
        if ($componentPosition === false) {
            return null;
        }

        // Skip components in the introduction section
        $introPosition = strpos($mdxContent, '## Introducción');
        $nextSectionPosition = strpos($mdxContent, '##', $introPosition + 2);

        if ($introPosition !== false && $componentPosition > $introPosition && $componentPosition < $nextSectionPosition) {
            return null;
        }

        // Check for specific audio file patterns
        if ($audioFileName === 'welcome') {
            // Extract the first sentence from the introduction
            preg_match('/## Introducción\s+([^\.!?]+[\.!?])/', $mdxContent, $introMatch);
            return !empty($introMatch[1]) ? trim($introMatch[1]) : "Welcome to your lesson!";
        }

        // Look for a table before the component
        $contentBefore = substr($mdxContent, 0, $componentPosition);
        $tableStart = strrpos($contentBefore, '|');

        if ($tableStart !== false) {
            // Find the beginning of the table
            $tableBeginning = strrpos(substr($contentBefore, 0, $tableStart), "\n\n");
            if ($tableBeginning === false) {
                $tableBeginning = 0;
            } else {
                $tableBeginning += 2; // Skip the newlines
            }

            $table = substr($contentBefore, $tableBeginning, $componentPosition - $tableBeginning);

            if (strpos($table, '|') !== false) {
                // Extract the target language column (usually the first column)
                $targetLanguageTexts = [];
                preg_match_all('/\|\s*([^|]+?)\s*\|/', $table, $tableMatches);

                if (!empty($tableMatches[1])) {
                    // Skip header and separator rows
                    $skipRows = 0;
                    if (strpos($tableMatches[1][1] ?? '', '---') !== false) {
                        $skipRows = 2; // Skip header and separator
                    } elseif (strpos($tableMatches[1][0] ?? '', 'Inglés') !== false ||
                              strpos($tableMatches[1][0] ?? '', 'English') !== false) {
                        $skipRows = 1; // Skip just header
                    }

                    for ($i = $skipRows; $i < count($tableMatches[1]); $i++) {
                        $text = trim($tableMatches[1][$i]);
                        if (!empty($text) && $text !== '-') {
                            $targetLanguageTexts[] = $text;
                        }
                    }

                    if (!empty($targetLanguageTexts)) {
                        return implode('... ', $targetLanguageTexts);
                    }
                }
            }
        }

        // Look for HighlightableText before the component
        $highlightStart = strrpos($contentBefore, '<HighlightableText');
        if ($highlightStart !== false) {
            $highlightEnd = strpos($contentBefore, '</HighlightableText>', $highlightStart);
            if ($highlightEnd !== false) {
                $highlightContent = substr($contentBefore, $highlightStart, $highlightEnd - $highlightStart + 20);
                preg_match('/>([^<]+)<\/HighlightableText>/', $highlightContent, $highlightMatch);
                if (!empty($highlightMatch[1])) {
                    return trim($highlightMatch[1]);
                }
            }
        }

        // Look for SentenceBreakdown before the component
        $sentenceStart = strrpos($contentBefore, '<SentenceBreakdown');
        if ($sentenceStart !== false) {
            preg_match('/sentence="([^"]+)"/', substr($contentBefore, $sentenceStart), $sentenceMatch);
            if (!empty($sentenceMatch[1])) {
                return trim($sentenceMatch[1]);
            }
        }

        // Look for a paragraph or sentence before the component
        $paragraphEnd = strrpos($contentBefore, "\n\n");
        if ($paragraphEnd !== false) {
            $paragraph = trim(substr($contentBefore, $paragraphEnd));

            // Skip markdown headers and component tags
            if (!empty($paragraph) &&
                !preg_match('/^#/', $paragraph) &&
                !preg_match('/^<[a-zA-Z]+/', $paragraph)) {

                // Extract the first sentence in the target language
                $sentences = preg_split('/[.!?]+/', $paragraph);
                foreach ($sentences as $sentence) {
                    $sentence = trim($sentence);
                    // Check if this sentence contains target language words (simple heuristic)
                    if (!empty($sentence) &&
                        !preg_match('/[áéíóúñ¿¡]/i', $sentence) && // Likely not Spanish
                        preg_match('/[a-zA-Z]{3,}/', $sentence)) { // Has English words
                        return $sentence;
                    }
                }

                // If no clear target language sentence found, return the first non-empty sentence
                foreach ($sentences as $sentence) {
                    $sentence = trim($sentence);
                    if (!empty($sentence)) {
                        return $sentence;
                    }
                }
            }
        }

        // If all else fails, use the audio filename as a fallback
        return str_replace('_', ' ', ucfirst($audioFileName));
    }

    /**
     * Create a prompt for generating the audio JSON
     *
     * @param array $textToSpeechContent Array of text segments that need audio
     * @param string $targetLanguage The target language code
     * @param int $lessonNumber The lesson number
     * @return string The prompt for generating the audio JSON
     */
    protected function createAudioJsonPrompt(string $mdxContent, string $targetLanguage, int $lessonNumber = 1): string
    {
        return <<<PROMPT
You are going to generate a json string, this is going to have two properties, text and audio_file_name.
The text is going to be the text from the examples of the lesson, the audio_file_name is going to be the name of the file name. I will show you an example:
If the input is the following:
## Section 1: The Tricky 'J' Sound
The letter 'j' in Spanish is pronounced like the 'h' in "hot" in English but stronger and comes from deep in the throat. It's a guttural sound that is distinct in words like "jirafa" (giraffe).
Practice words:

| Word   | Pronunciation |
| ------ | ------------- |
| Jirafa | hee-rah-fah   |
| Jugo   | hoo-goh       |
| Joven  | hoh-vehn      |
| Jardín | hahr-deen     |
| Caja   | kah-hah       |

<Mnemonic title={{Mnemonic}} content={{Think of the sound you make when you're trying to fog up a mirror with your breath but make it harsher.}} />

<TextToSpeechPlayer mp3File={{/src/assets/courses/spanish/_shared/lessons/lesson2/audio/tricky-j.mp3}} />

The output should be the following:

{{
    'text': 'Jirafa ... Jugo ... Joven ... Jardín ... Caja',
    'audio_file_name': 'tricky-j.mp3'
}}

Another example, if the input is the following:
## Section 3: Pronouns

Pronouns replace nouns and are used frequently in everyday conversation. They must match the gender and number of the noun they replace.

### Subject Pronouns

| Pronoun (English) | Pronoun (Spanish) | Example Sentence                        |
| ----------------- | ----------------- | --------------------------------------- |
| I                 | Yo                | Yo soy estudiante.                      |
| You (informal)    | Tú                | ¿Tú eres el profesor?                   |
| He/She/           | Él/Ella           | Él es mi hermano. Ella es mi hermana.   |
| You formal        | Usted             | ¿Cómo está usted?                       |
| You plural        | Ustedes           | Ustedes son amables.                    |
| We                | Nosotros/Nosotras | Nosotros estudiamos español.            |
| They              | Ellos/Ellas       | Ellos hablan español. Ellas también.    |
| It                | Eso/Esa           | Eso es interesante. Esa casa es bonita. |

<TextToSpeechPlayer mp3File={{/src/assets/courses/spanish/_shared/lessons/lesson5/audio/subject-pronouns.mp3}} />

The output should be the following:

{{
    'text': 'Yo soy estudiante ... ¿Tú eres el profesor? ... Él es mi hermano. Ella es mi hermana ... ¿Cómo está usted? ... Ustedes son amables ... Nosotros estudiamos español ... Ellos hablan español. Ellas también ... Eso es interesante. Esa casa es bonita',
    'audio_file_name': 'subject-pronouns.mp3'
}}

Notice that the text property contains the text of the concepts the learner needs to understand concatenated with ' ... ' in between to separate the examples.
Notice that the text property does not contain any extra text like headings or explanations.
Notice that the text property containts only and excluselively text or phrases in spanish.
For each TextToSpeechPlayer, there should be one object with two keys:
- text: the text to speak
- audio_file_name: the name of the audio file
VERY IMPORTANT: If there are 6 TextToSpeechPlayer there should be exactly 6 objects in the output. If there are 8 TextToSpeechPlayer there should be exactly 8 objects in the output. If there are 3 TextToSpeechPlayer there should be exactly 3 objects in the output. If there are 1 TextToSpeechPlayer there should be exactly 1 object in the output. If there are 0 TextToSpeechPlayer there should be exactly 0 objects in the output. If there are 10 TextToSpeechPlayer there should be exactly 10 objects in the output. If there are 5 TextToSpeechPlayer there should be exactly 5 objects in the output. If there are 2 TextToSpeechPlayer there should be exactly 2 objects in the output. If there are 4 TextToSpeechPlayer there should be exactly 4 objects in the output. If there are 7 TextToSpeechPlayer there should be exactly 7 objects in the output. If there are 9 TextToSpeechPlayer there should be exactly 9 objects in the output. If there are 11 TextToSpeechPlayer there should be exactly 11 objects in the output. If there are 12 TextToSpeechPlayer there should be exactly 12 objects in the output. If there are 13 TextToSpeechPlayer there should be exactly 13 objects in the output. If there are 14 TextToSpeechPlayer there should be exactly 14 objects in the output. If there are 15 TextToSpeechPlayer there should be exactly 15 objects in the output. If there are 16 TextToSpeechPlayer there should be exactly 16 objects in the output. If there are 17 TextToSpeechPlayer there should be exactly 17 objects in the output. If there are 18 TextToSpeechPlayer there should be exactly 18 objects in the output. If there are 19 TextToSpeechPlayer there should be exactly 19 objects in the output. If there are 20 TextToSpeechPlayer there should be exactly 20 objects in the output. If there are 21 TextToSpeechPlayer there should be exactly 21 objects in the output. If there are 22 TextToSpeechPlayer there should be exactly 22 objects in the output. If there are 23 TextToSpeechPlayer there should be exactly 23 objects in the output. If there are 24 TextToSpeechPlayer there should be exactly 24 objects in the output. If there are 25 TextToSpeechPlayer there should be exactly 25 objects in the output.
The text should reflext the example given and should not be repeated.
If the example is only one word then the text should be only that word.

Generate the json for this section based on the following content:
$mdxContent
Generate the json string and only the json string in json format.
Do not include text about what you did, your thought process or any other messages,
just the generated string in json format.
PROMPT;
    }

    /**
     * Get the country code for a language code
     *
     * @param string $languageCode The language code
     * @return string The country code
     */
    protected function getCountryCode(string $languageCode): string
    {
        $countryCodes = [
            'en' => 'US',
            'es' => 'ES',
            'fr' => 'FR',
            'de' => 'DE',
            'it' => 'IT',
            'pt' => 'PT',
            'nl' => 'NL',
            'ru' => 'RU',
            'ja' => 'JP',
            'zh' => 'CN',
            'ar' => 'SA',
            'hi' => 'IN',
            'ko' => 'KR',
            'tr' => 'TR',
            'pl' => 'PL',
            'vi' => 'VN',
            'th' => 'TH',
            'id' => 'ID',
            'ms' => 'MY',
            'fa' => 'IR',
        ];

        return $countryCodes[$languageCode] ?? strtoupper($languageCode);
    }

    /**
     * Clean a JSON response from AI to ensure it's valid JSON
     *
     * @param string $response The response from AI
     * @return string Cleaned JSON
     */
    protected function cleanJsonResponse(string $response): string
    {
        // Remove markdown code blocks if present
        $response = preg_replace('/```json\s*/', '', $response);
        $response = preg_replace('/```\s*$/', '', $response);

        // Remove any other markdown formatting
        $response = preg_replace('/```/', '', $response);

        // Trim whitespace
        $response = trim($response);

        // If the response doesn't start with { or [, try to find the JSON
        if (!preg_match('/^\s*[{\[]/', $response)) {
            // Look for the first { or [ in the response
            if (preg_match('/\s*([{\[].*)$/s', $response, $matches)) {
                $response = $matches[1];
            }
        }

        return $response;
    }

    /**
     * Get the full language name from a language code
     *
     * @param string $code The language code (e.g., 'en', 'es')
     * @return string The language name
     */
    protected function getLanguageName(string $code): string
    {
        $languages = [
            'en' => 'English',
            'es' => 'Spanish',
            'de' => 'German',
            'fr' => 'French',
            'it' => 'Italian',
            'pt' => 'Portuguese',
            'ru' => 'Russian',
            'zh' => 'Chinese',
            'ja' => 'Japanese',
            'ko' => 'Korean',
        ];

        return $languages[$code] ?? $code;
    }
}
