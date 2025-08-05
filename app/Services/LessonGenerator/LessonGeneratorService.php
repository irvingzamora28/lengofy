<?php

namespace App\Services\LessonGenerator;

use App\Services\AI\AIServiceFactory;
use App\Services\LessonGenerator\Prompts\PromptBuilder;
use App\Utils\LanguageUtils;
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

        // Get the language names
        $sourceLanguageName = LanguageUtils::getLanguageName($this->sourceLanguage);
        $targetLanguageName = LanguageUtils::getLanguageName($this->targetLanguage);

        // Create the lesson structure prompt using PromptBuilder
        $prompt = PromptBuilder::buildLessonStructurePrompt($lesson, $sourceLanguageName, $targetLanguageName);

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

    protected function generateVocabulary(array $lessonStructure): string
    {
        // Get the language names for the prompt
        $sourceLanguageName = LanguageUtils::getLanguageName($this->sourceLanguage);
        $targetLanguageName = LanguageUtils::getLanguageName($this->targetLanguage);

        // Use PromptBuilder to create the vocabulary prompt
        $prompt = PromptBuilder::buildVocabularyPrompt($lessonStructure, $this->sourceLanguage, $this->targetLanguage);
        $vocabulary = $this->aiService->generateContent($prompt);

        // Clean content remove ```
        $vocabulary = preg_replace('/```mdx\s*/', '', $vocabulary);
        $vocabulary = preg_replace('/```\s*$/', '', $vocabulary);

        if (!$vocabulary) {
            throw new Exception("Failed to generate vocabulary");
        }

        return $vocabulary;
    }



    /**
     * Generate content for a specific section of a lesson
     *
     * @param array $section The section data from the lesson structure
     * @param array $lessonStructure The complete lesson structure
     * @param string $sourceLanguage The source language code
     * @param string $targetLanguage The target language code
     * @return string The generated section content in MDX format
     */
    protected function generateSection(array $section, array $lessonStructure, string $sourceLanguage, string $targetLanguage): string
    {
        // Get the language names
        $sourceLanguageName = LanguageUtils::getLanguageName($sourceLanguage);
        $targetLanguageName = LanguageUtils::getLanguageName($targetLanguage);

        // Create the prompt for the section using PromptBuilder
        $prompt = PromptBuilder::buildSectionContentPrompt(
            $section,
            $lessonStructure,
            $sourceLanguageName,
            $targetLanguageName,
        );

        print_r($prompt);

        // Generate the content using AI
        return $this->aiService->generateContent($prompt);
    }

    protected function formatComponents(array $components): string
    {
        return implode(', ', array_map(function ($component) {
            return "'$component'";
        }, $components));
    }

    protected function formatElements(array $elements): string
    {
        return implode(', ', array_map(function ($element) {
            return "'$element'";
        }, $elements));
    }

    protected function generateFrontMatter(array $lessonStructure, string $vocabulary): string
    {
        $frontMatter = [
            'title' => $lessonStructure['title'],
            'lesson_number' => $lessonStructure['lesson_number'],
            'description' => $lessonStructure['description'],
            'date' => date('Y-m-d'),
        ];

        return "---\n" . $this->arrayToYaml($frontMatter) . $vocabulary . "\n---";
    }

    protected function arrayToYaml(array $array, int $indent = 0): string
    {
        $yaml = '';
        $indentation = str_repeat('  ', $indent);

        foreach ($array as $key => $value) {
            if (is_array($value)) {
                $yaml .= "{$indentation}{$key}:\n" . $this->arrayToYaml($value, $indent + 1);
            } else {
                $formattedValue = is_string($value) ? "\"{$value}\"" : $value;
                $yaml .= "{$indentation}{$key}: {$formattedValue}\n";
            }
        }

        return $yaml;
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

        // Generate vocabulary first
        $vocabulary = $this->generateVocabulary($lessonStructure);

        // Generate each section separately
        $sectionContents = [];
        foreach ($lessonStructure['sections'] as $section) {
            $sectionContent = $this->generateSection($section, $lessonStructure, $this->sourceLanguage, $this->targetLanguage);
            $sectionContents[] = $sectionContent;
        }

        // Combine all sections into final MDX
        $frontMatter = $this->generateFrontMatter($lessonStructure, $vocabulary);
        $lessonMdx = $frontMatter . "\n\n" . implode("\n\n", $sectionContents);

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
        $outputPath = "$outputDir/lesson_" . str_pad($lessonNumber, 2, '0', STR_PAD_LEFT) . "_{$slug}.mdx";
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

        // Parse the MDX content into sections
        $sections = $this->parseMdxIntoSections($mdxContent);

        // Print section by section
        foreach ($sections as $index => $section) {
            echo "Section {$index}:\n" . $section . "\n\n";
        }

        // Process each section to generate audio JSON entries
        $audioEntries = [];

        foreach ($sections as $index => $section) {
            // Skip sections without TextToSpeechPlayer components
            if (!preg_match('/<TextToSpeechPlayer\s/', $section)) {
                continue;
            }

            // Create the audio JSON prompt for this section using PromptBuilder
            $prompt = PromptBuilder::buildAudioJsonPrompt($section, $this->targetLanguage, $lessonNumber);

            // Generate the audio JSON for this section using AI
            $sectionAudioJson = $this->aiService->generateContent($prompt);

            // Clean the response to ensure it's valid JSON
            $sectionAudioJson = $this->cleanJsonResponse($sectionAudioJson);

            // Decode the section's audio JSON
            $sectionAudioEntries = json_decode($sectionAudioJson, true);

            // Check if the section's audio JSON is valid
            if (!$sectionAudioEntries) {
                $jsonError = json_last_error_msg();
                $excerpt = substr($sectionAudioJson, 0, 200) . (strlen($sectionAudioJson) > 200 ? '...' : '');
                // Log the error but continue processing other sections
                error_log("Section $index generated invalid JSON. Error: $jsonError. Content excerpt: \n$excerpt");
                continue;
            }

            // If the section returned a single object instead of an array, convert it to an array
            if (isset($sectionAudioEntries['text'])) {
                $sectionAudioEntries = [$sectionAudioEntries];
            }

            // Add the section's audio entries to the main array
            foreach ($sectionAudioEntries as $entry) {
                if (isset($entry['text']) && isset($entry['audio_file_name'])) {
                    $audioEntries[] = $entry;
                }
            }
        }

        // If no valid audio entries were generated, try the original approach as fallback
        if (empty($audioEntries)) {
            // Create the audio JSON prompt for the entire content using PromptBuilder
            $prompt = PromptBuilder::buildAudioJsonPrompt($mdxContent, $this->targetLanguage, $lessonNumber);

            // Generate the audio JSON using AI
            $audioJson = $this->aiService->generateContent($prompt);

            // Clean the response to ensure it's valid JSON
            $audioJson = $this->cleanJsonResponse($audioJson);

            // Decode the audio JSON
            $audioEntries = json_decode($audioJson, true);

            // Ensure the generated content is valid JSON
            if (!$audioEntries) {
                $jsonError = json_last_error_msg();
                $excerpt = substr($audioJson, 0, 500) . (strlen($audioJson) > 500 ? '...' : '');
                throw new Exception("Generated audio JSON is not valid JSON. Error: $jsonError. Content excerpt: \n$excerpt");
            }

            // If the result is a single object instead of an array, convert it to an array
            if (isset($audioEntries['text'])) {
                $audioEntries = [$audioEntries];
            }
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
        File::put($outputPath, json_encode($audioEntries, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return $outputPath;
    }

    /**
     * Parse MDX content into sections for better processing
     *
     * @param string $mdxContent The MDX content to parse
     * @return array Array of MDX content sections
     */
    protected function parseMdxIntoSections(string $mdxContent): array
    {
        // Remove the frontmatter
        $mdxContent = preg_replace('/^---[\s\S]*?---/m', '', $mdxContent);

        // Get the introduction section (content before the first ### header)
        $pattern = '/^(.*?)(?=###|$)/s';
        preg_match($pattern, $mdxContent, $introMatches);
        $introduction = trim($introMatches[1] ?? '');

        // Get all sections with ### headers
        $pattern = '/###\s+([^\n]+)\n([\s\S]*?)(?=###|$)/';
        preg_match_all($pattern, $mdxContent, $matches, PREG_SET_ORDER);

        $sections = [];

        // Add introduction if it's not empty
        if (!empty($introduction)) {
            $sections[] = $introduction;
        }

        // Add each section with its header
        foreach ($matches as $match) {
            $header = '### ' . $match[1];
            $content = $match[2];
            $sections[] = $header . $content;
        }

        // If no sections were found, return the whole content as one section
        if (empty($sections)) {
            return [trim($mdxContent)];
        }

        return $sections;
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


}
