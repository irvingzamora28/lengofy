<?php

namespace App\Services\LessonGenerator\Prompts;

/**
 * Builder class for lesson generation prompts
 *
 * This class helps build prompts for different stages of lesson generation
 * by combining prompt templates with lesson-specific data.
 */
class PromptBuilder
{
    /**
     * Build a prompt for lesson structure generation
     *
     * @param array $lesson The lesson data from the course JSON
     * @param string $sourceLanguageName The name of the source language
     * @param string $targetLanguageName The name of the target language
     * @return string The complete prompt for lesson structure generation
     */
    public static function buildLessonStructurePrompt(array $lesson, string $sourceLanguageName, string $targetLanguageName): string
    {
        return StructurePrompts::createLessonStructurePrompt($lesson, $sourceLanguageName, $targetLanguageName);
    }

    /**
     * Build a prompt for section content generation
     *
     * @param array $section The section data from the lesson structure
     * @param array $lessonStructure The complete lesson structure
     * @param string $sourceLanguageName The name of the source language
     * @param string $targetLanguageName The name of the target language
     * @return string The complete prompt for section content generation
     */
    public static function buildSectionContentPrompt(
        array $section,
        array $lessonStructure,
        string $sourceLanguageName,
        string $targetLanguageName,
    ): string {
        return ContentPrompts::createSectionContentPrompt(
            $section,
            $lessonStructure,
            $sourceLanguageName,
            $targetLanguageName
        );
    }

    /**
     * Build a prompt for vocabulary generation
     *
     * @param array $lessonStructure The complete lesson structure
     * @param string $sourceLanguage The source language code
     * @param string $targetLanguage The target language code
     * @return string The complete prompt for vocabulary generation
     */
    public static function buildVocabularyPrompt(array $lessonStructure, string $sourceLanguage, string $targetLanguage): string
    {
        return ContentPrompts::createVocabularyPrompt($lessonStructure, $sourceLanguage, $targetLanguage);
    }

    /**
     * Build a prompt for audio JSON generation
     *
     * @param string $mdxContent The MDX content to generate audio for
     * @param string $targetLanguageName The name of the target language
     * @param int $lessonNumber The lesson number
     * @return string The complete prompt for audio JSON generation
     */
    public static function buildAudioJsonPrompt(string $mdxContent, string $targetLanguageName, int $lessonNumber = 1): string
    {
        return AudioPrompts::createAudioJsonPrompt($mdxContent, $targetLanguageName, $lessonNumber);
    }
}
