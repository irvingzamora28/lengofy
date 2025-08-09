<?php

namespace App\Services\LessonGenerator\Prompts;

use App\Utils\LanguageUtils;

/**
 * Prompts for lesson content generation (Stage 2)
 *
 * This class contains prompts used for generating the content for each section
 * of the lesson based on the lesson structure.
 */
class ContentPrompts
{
    /**
     * Create a prompt for generating section content
     *
     * @param array $section The section data from the lesson structure
     * @param array $lessonStructure The complete lesson structure
     * @param string $sourceLanguageName The name of the source language
     * @param string $targetLanguageName The name of the target language
     * @return string The complete prompt for section content generation
     */
    public static function createSectionContentPrompt(
        array $section,
        array $lessonStructure,
        string $sourceLanguageName,
        string $targetLanguageName,
    ): string {
        // Extract section data
        $lessonTitle = $lessonStructure['title'];
        $sectionTitle = $section['title'];
        $sectionAbout = $section['about'];
        $specialNotes = $section['special_notes'] ?? '';

        // Format components and elements
        $sectionComponents = self::formatComponents($section['components'] ?? []);
        $sectionElements = self::formatElements($section['elements'] ?? []);

        // Get component instructions based on the components in this section
        $componentsInstruction = !empty($section['components'])
            ? ComponentDefinitions::getDetailedComponentInstructions($section['components']) . "\nThe JSX components that MUST be used are: {$sectionComponents}. "
            : '';

        // Get element instructions based on the elements in this section
        $elementsInstruction = !empty($sectionElements)
            ? ComponentDefinitions::getMdxElementInstructions() . "\nThe MDX elements that MUST be incorporated are: {$sectionElements}. In this case a {$sectionElements} was told to be used. So you MUST incorporate {$sectionElements} into the generated content."
            : '';

        // Get additional instructions
        $additionalInstructions = ComponentDefinitions::getContentAdditionalInstructions();

        return <<<PROMPT
You are an expert language curriculum designer. Create a section for a language learning lesson.

TASK:
Generate content for the lesson titled "{$lessonTitle}", specifically the section titled "{$sectionTitle}".
Generate the section content based on the prompt: {$sectionAbout}. Ensure the content is instructional and engaging. The content should be directly relevant to the lesson subject and formatted in MDX. This will be part of a larger lesson, so make sure the content is engaging, informative, and very short.

{$componentsInstruction}{$elementsInstruction}

Lesson Context:
- Title: {$lessonTitle}
- Description: {$lessonStructure['description']}
- Source Language: $sourceLanguageName (The learner speaks this language)
- Target Language: $targetLanguageName (The learner is learning this language)
- Special Notes: {$specialNotes}

Requirements:
1. Follow MDX format
2. Create engaging, interactive content using the specified components: {$sectionComponents}
3. The lesson MUST start with a title in MDX format, in this case the title is {$lessonTitle}
4. The lesson section will be in $sourceLanguageName and the target language is $targetLanguageName, that means the instructions and content will be in $sourceLanguageName and the content the user is learning will be in $targetLanguageName (Which might or might not be different from the example).
5. Keep in mind this section is part of a larger lesson
6. The special notes for this lesson are: {$specialNotes}
Output the section content in MDX format.

$additionalInstructions
PROMPT;
    }

    /**
     * Format components array into a comma-separated string
     *
     * @param array $components Array of component names
     * @return string Formatted components string
     */
    private static function formatComponents(array $components): string
    {
        return implode(', ', $components);
    }

    /**
     * Format elements array into a comma-separated string
     *
     * @param array $elements Array of element names
     * @return string Formatted elements string
     */
    private static function formatElements(array $elements): string
    {
        return implode(', ', $elements);
    }

    /**
     * Create a prompt for generating vocabulary content
     *
     * @param array $lessonStructure The complete lesson structure
     * @return string The complete prompt for vocabulary generation
     */
    public static function createVocabularyPrompt(array $lessonStructure, string $sourceLanguage, string $targetLanguage): string
    {
        $sourceLanguageName = LanguageUtils::getLanguageName($sourceLanguage);
        $targetLanguageName = LanguageUtils::getLanguageName($targetLanguage);

        // Encode the vocabulary structure as a pretty-printed JSON string
        $words = implode(', ', $lessonStructure['vocabulary']['words']);
        $properties = implode(', ', $lessonStructure['vocabulary']['properties']);

        return <<<PROMPT
    You are an expert language curriculum designer. Generate vocabulary for a language lesson.

    TASK:
    Create vocabulary entries for this lesson:
    - Title: {$lessonStructure['title']}
    - Description: {$lessonStructure['description']}
    - Source Language: $sourceLanguageName
    - Target Language: $targetLanguageName

    Here is an example of the vocabulary in MDX format generated with the words: jirafa, huevo, guerra, cielo, año. The source language is english and the target language is spanish. The properties: word, translation, exampleSentence, exampleTranslation, gender, challenge:
    vocabulary:
        - word: "La jirafa"
        translation: "giraffe"
        exampleSentence: "La jirafa tiene un cuello largo."
        exampleTranslation: "The giraffe has a long neck."
        gender: "fem"
        challenge: "The 'j' is pronounced like an English 'h'."
        - word: "El huevo"
        translation: "egg"
        exampleSentence: "Quiero un huevo frito."
        exampleTranslation: "I want a fried egg."
        gender: "masc"
        challenge: "Remember that 'h' is always silent."
        - word: "La guerra"
        translation: "war"
        exampleSentence: "La guerra no es la solución."
        exampleTranslation: "War is not the solution."
        gender: "fem"
        challenge: "'G' before 'u' and 'e' can be tricky."
        - word: "El cielo"
        translation: "sky"
        exampleSentence: "El cielo es azul."
        exampleTranslation: "The sky is blue."
        gender: "masc"
        challenge: "'C' before 'i' and 'e' sounds like 'th' in Spain and 's' in Latin America."
        - word: "El año"
        translation: "year"
        exampleSentence: "Cada año vamos a la playa."
        exampleTranslation: "Every year we go to the beach."
        gender: "masc"
        challenge: "The 'ñ' sound doesn't exist in English."

    Generate the content and only the content in an MDX format.
    In this case, The vocabulary words are $words.
    The vocabulary you are going to generate in an MDX format and will have the following properties $properties.
    The vocabulary will be in the target language $targetLanguageName and the source language is $sourceLanguageName, that means the word will be in $targetLanguageName and the translation will be in $sourceLanguageName, the exampleSentence will be in $targetLanguageName and the exampleTranslation will be in $sourceLanguageName (Which might or might not be different from the example).
    Do not include text about what you did, your thought process or any other messages,
    just the generated content in MDX format.
    Make sure to include the gender of the word in the vocabulary (If it applies, for example der, die das, el, la, los, las, etc.).
    Also omit the title of the lesson and the title of the section.

    PROMPT;
    }
}
