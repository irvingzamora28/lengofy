<?php

namespace App\Console\Commands;

use App\Services\LessonGenerator\LessonGeneratorService;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class GenerateLessons extends Command
{
    /**
     * The console command name.
     *
     * @var string
     */
    protected $signature = 'lesson:generate
                            {course_json : Path to the course JSON file}
                            {--lesson_number= : Specific lesson number to generate}
                            {--source_language= : Source language code (required)}
                            {--target_language= : Target language code (required)}
                            {--ai_provider=openai : AI provider to use (openai, anthropic, google)}
                            {--structure_only : Generate only the lesson structure}
                            {--mdx_only : Generate only the MDX file}
                            {--audio_only : Generate only the audio JSON}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate language lessons from a course JSON file';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $courseJsonPath = $this->argument('course_json');
        $lessonNumber = $this->option('lesson_number');
        $sourceLanguage = $this->option('source_language');
        $targetLanguage = $this->option('target_language');
        $aiProvider = $this->option('ai_provider');
        $structureOnly = $this->option('structure_only');
        $mdxOnly = $this->option('mdx_only');
        $audioOnly = $this->option('audio_only');

        // Validate the course JSON file exists
        if (!File::exists($courseJsonPath)) {
            $this->error("Course JSON file not found: $courseJsonPath");
            return 1;
        }

        // Validate required parameters
        if (!$sourceLanguage) {
            $this->error("Source language is required. Use --source_language option.");
            return 1;
        }

        if (!$targetLanguage) {
            $this->error("Target language is required. Use --target_language option.");
            return 1;
        }

        // Validate parameters
        $this->info("Using parameters:");
        $this->info("- Source Language: $sourceLanguage");
        $this->info("- Target Language: $targetLanguage");
        $this->info("- AI Provider: $aiProvider");
        $this->info("- Lesson Number: " . ($lessonNumber ? $lessonNumber : "All lessons"));
        $this->info("- Structure Only: " . ($structureOnly ? "Yes" : "No"));
        $this->info("- MDX Only: " . ($mdxOnly ? "Yes" : "No"));
        $this->info("- Audio Only: " . ($audioOnly ? "Yes" : "No"));

        try {
            // Create the lesson generator service
            $lessonGenerator = new LessonGeneratorService($aiProvider, $sourceLanguage, $targetLanguage);

            // Read the course JSON
            $courseJson = json_decode(File::get($courseJsonPath), true);

            if (!$courseJson) {
                $this->error("Invalid course JSON file. Error: " . json_last_error_msg());
                return 1;
            }

            // If no specific lesson number is provided, generate all lessons
            if (!$lessonNumber) {
                $lessonNumbers = $this->getAllLessonNumbers($courseJson);

                if (empty($lessonNumbers)) {
                    $this->error("No lessons found in the course JSON file.");
                    return 1;
                }

                $this->info("Generating " . count($lessonNumbers) . " lessons...");

                foreach ($lessonNumbers as $number) {
                    $this->generateLesson($lessonGenerator, $courseJsonPath, $number, $structureOnly, $mdxOnly, $audioOnly);
                }
            } else {
                $this->generateLesson($lessonGenerator, $courseJsonPath, $lessonNumber, $structureOnly, $mdxOnly, $audioOnly);
            }

            $this->info('Lesson generation completed successfully!');
            return 0;
        } catch (Exception $e) {
            $this->error("Error generating lessons: " . $e->getMessage());
            if (env('APP_DEBUG', false)) {
                $this->error("Stack trace:");
                $this->error($e->getTraceAsString());
            }
            return 1;
        }
    }

    /**
     * Generate a single lesson
     *
     * @param LessonGeneratorService $lessonGenerator The lesson generator service
     * @param string $courseJsonPath Path to the course JSON file
     * @param int $lessonNumber The lesson number to generate
     * @param bool $structureOnly Generate only the lesson structure JSON
     * @param bool $mdxOnly Generate only the MDX file from an existing structure
     * @param bool $audioOnly Generate only the audio JSON file from an existing MDX
     */
    protected function generateLesson(
        LessonGeneratorService $lessonGenerator,
        string $courseJsonPath,
        int $lessonNumber,
        bool $structureOnly,
        bool $mdxOnly,
        bool $audioOnly
    ): void {
        $this->info("Processing lesson #$lessonNumber");

        // Generate the lesson structure
        if (!$mdxOnly && !$audioOnly) {
            $this->info("Generating lesson structure...");
            $structurePath = $lessonGenerator->generateLessonStructure($courseJsonPath, $lessonNumber);
            $this->info("Lesson structure generated: $structurePath");
        }

        // Generate the MDX file
        if (!$structureOnly && !$audioOnly) {
            if ($mdxOnly) {
                // If mdx_only is specified, find the existing structure file
                $sourceLanguage = $this->option('source_language');
                $targetLanguage = $this->option('target_language');
                $structurePath = storage_path("app/lessons/{$sourceLanguage}-{$targetLanguage}/01-beginner/lesson_{$lessonNumber}_structure.json");

                if (!File::exists($structurePath)) {
                    $this->error("Lesson structure file not found: $structurePath");
                    return;
                }
            }

            $this->info("Generating MDX file...");
            $mdxPath = $lessonGenerator->generateLessonMdx($structurePath);
            $this->info("MDX file generated: $mdxPath");
        }

        // Generate the audio JSON
        if (!$structureOnly && !$mdxOnly) {
            if ($audioOnly) {
                // If audio_only is specified, find the existing MDX file
                $sourceLanguage = $this->option('source_language');
                $targetLanguage = $this->option('target_language');

                // Find the MDX file by pattern
                $lessonNumberStr = str_pad($lessonNumber, 2, '0', STR_PAD_LEFT);
                $mdxPattern = resource_path("lessons/{$sourceLanguage}-{$targetLanguage}/01-beginner/lesson_{$lessonNumberStr}_*.mdx");
                // resources/lessons/en-de/01-beginner/lesson_04_lesson-4-basic-german-grammar-nouns-and-articles.mdx
                $this->info("MDX pattern: $mdxPattern");
                $mdxFiles = glob($mdxPattern);

                if (empty($mdxFiles)) {
                    $this->error("MDX file not found for lesson #$lessonNumber");
                    return;
                }

                $this->info("Found MDX file: " . $mdxFiles[0]);

                $mdxPath = $mdxFiles[0];
            }

            $this->info("Generating audio JSON...");
            $audioJsonPath = $lessonGenerator->generateAudioJson($mdxPath);
            $this->info("Audio JSON generated: $audioJsonPath");
        }
    }

    /**
     * Get all lesson numbers from the course JSON
     *
     * @param array $courseJson The course JSON data
     * @return array Array of lesson numbers
     */
    protected function getAllLessonNumbers(array $courseJson): array
    {
        $lessonNumbers = [];

        foreach ($courseJson as $level) {
            if (isset($level['lessons']) && is_array($level['lessons'])) {
                foreach ($level['lessons'] as $lesson) {
                    if (isset($lesson['lesson_number'])) {
                        $lessonNumbers[] = (int) $lesson['lesson_number'];
                    }
                }
            }
        }

        sort($lessonNumbers);
        return $lessonNumbers;
    }
}
