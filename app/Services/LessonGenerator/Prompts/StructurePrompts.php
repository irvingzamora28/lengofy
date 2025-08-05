<?php

namespace App\Services\LessonGenerator\Prompts;

/**
 * Prompts for lesson structure generation (Stage 1)
 *
 * This class contains prompts used for generating the initial lesson structure,
 * which divides the lesson into sections and specifies which components to use.
 */
class StructurePrompts
{
    /**
     * Create a prompt for generating the lesson structure
     *
     * @param array $lesson The lesson data from the course JSON
     * @param string $sourceLanguageName The name of the source language
     * @param string $targetLanguageName The name of the target language
     * @return string The complete prompt for lesson structure generation
     */
    public static function createLessonStructurePrompt(array $lesson, string $sourceLanguageName, string $targetLanguageName): string
    {
        $componentDescriptions = ComponentDefinitions::getStructureComponentDescriptions();
        $sectionPlanningGuidelines = ComponentDefinitions::getSectionPlanningGuidelines();

        $lessonJson = json_encode($lesson, JSON_PRETTY_PRINT);

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

$componentDescriptions

$sectionPlanningGuidelines

Input:

The input will be a JSON object containing the following fields:

name: The name of the lesson.
lesson_number: The lesson's number.
description: A brief description of the lesson.
goals: An array of strings representing the learning goals of the lesson (e.g., "Fundamentals", "Vocabulary").

Output Format:

The output must be a valid JSON object with the following structure:

{
    "title": "Lesson Title",
    "lesson_number": 1,
    "description": "Lesson Description",
    "sections": [
        {
            "title": "Section Title",
            "about": "Section Description",
            "components": ["Component1", "Component2"],
            "elements": ["Element1", "Element2"]
        },
        ...
    ],
    "vocabulary": {
        "words": ["word1", "word2", ...],
        "properties": ["translation", "exampleSentence", "exampleTranslation", "gender"]
    }
}

Detailed Instructions:

title: Create the lesson title by prepending "Lesson [lesson_number]: " to the name field from the input.

description: Use the description field from the input directly.

sections:

Create an "Introduction" section with a generic welcome message in the about field. This section should have empty components and elements arrays.

Based on the goals array in the input, create between 3 and 5 additional sections. Each section should have:

title: A descriptive title for the section, this should be in $sourceLanguageName.

about: A brief explanation of the section's content, this should be in $sourceLanguageName.

components: An array of strings representing relevant components (see "Components" below). Choose components that are appropriate for the section's content.

elements: An array of strings representing interactive elements (see "Elements" below).

vocabulary: This is the most crucial part. There is only one vocabulary object in the lesson. The vocabulary must be an object with exactly two keys:

words: An array of strings. These strings should be the vocabulary words themselves (e.g., "hola", "adiós"). Do not create objects for each word. Just list the words as strings. Provide words and not single letters. (Words should be at least 2 characters long).

properties: An array of strings representing the names of the properties that will be associated with each word in a separate data structure (which is not part of this JSON output). This array should always be: ["translation", "exampleSentence", "exampleTranslation", "gender"]. Do not include the actual translations, example sentences, etc., in this JSON.

Components:

Use the following components where appropriate within the sections:

TextToSpeechPlayer: For audio examples.
TipBox: For important notes or tips.
Mnemonic: For memory aids.
VoiceRecorder: For pronunciation practice.
SentenceBreakdown: For analyzing complex sentences.
HighlightableText: To highlight key words or phrases.
WordBuilder: For vocabulary practice (unscrambling letters).
ConversationBox: For presenting a conversation scenario.
AudioExercise: For audio exercises.

Elements:

Use the following elements where appropriate within the sections:

table
list

Strict Rules:

1. The output MUST be valid, well-formatted JSON.
2. The vocabulary.words array MUST contain only strings (the words themselves), NOT objects.
3. The vocabulary.properties must be exactly ["translation", "exampleSentence", "exampleTranslation", "gender"]
4. Adhere to all structural requirements outlined above.

Now, using the following input, generate the corresponding JSON lesson:

{$lessonJson}
PROMPT;
    }
}
