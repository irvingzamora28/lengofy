<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class LessonSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $lessonsPath = resource_path('lessons');
        $lessonFiles = File::allFiles($lessonsPath);

        foreach ($lessonFiles as $file) {
            $languagePairCode = $file->getRelativePathname();
            $languagePairCode = explode('/', $languagePairCode)[0]; // Get the language pair code (e.g., "es-de")
            list($sourceLangCode, $targetLangCode) = explode('-', $languagePairCode); // Split "es-de" into ["es", "de"]
            $sourceLanguageId = DB::table('languages')->where('code', $sourceLangCode)->value('id');
            $targetLanguageId = DB::table('languages')->where('code', $targetLangCode)->value('id');
            $languagePair = DB::table('language_pairs')
                ->where('source_language_id', $sourceLanguageId)
                ->where('target_language_id', $targetLanguageId)
                ->first();
            $content = File::get($file);
            if ($languagePair) {
                $data = $this->parseLessonFile($content);
                $data['language_pair_id'] = $languagePair->id; // Set the language_pair_id
                if (DB::table('lessons')->where('title', $data['title'])->exists()) {
                    DB::table('lessons')->where('title', $data['title'])->update($data);
                    Log::info("Lesson updated: {$data['title']}");
                } else {
                    DB::table('lessons')->insert($data);
                    Log::info("Lesson inserted: {$data['title']}");
                }
            } else {
                // Log or handle the case where the language pair is not found
                Log::warning("Language pair not found for code: $languagePairCode");
            }
        }
    }

    /**
     * Parse the lesson file content.
     *
     * @param string $content
     * @return array
     */
    private function parseLessonFile($content)
    {
        $lines = explode("\n", $content);
        $metadata = [];
        $lessonContent = '';

        // Extract metadata and content
        foreach ($lines as $line) {
            if (strpos($line, 'title:') === 0) {
                $title = trim(str_replace('title:', '', $line));
                $metadata['title'] = $this->removeQuotes($title); // Remove quotes from the title
            } elseif (strpos($line, 'lessonNumber:') === 0) {
                $metadata['lesson_number'] = (int)trim(str_replace('lessonNumber:', '', $line));
            } elseif (strpos($line, 'level:') === 0) {
                $level = trim(str_replace('level:', '', $line));
                $metadata['level'] = $this->removeQuotes($level); // Remove quotes from the level
            } elseif (strpos($line, 'topics:') === 0) {
                // Extract the topics array directly from the YAML frontmatter
                $topics = trim(str_replace('topics:', '', $line));
                $metadata['topics'] = json_encode(json_decode($topics, true)); // Encode the array as a JSON string
            } elseif (strpos($line, 'prerequisites:') === 0) {
                $prerequisites = trim(str_replace('prerequisites:', '', $line));
                $metadata['prerequisites'] = json_encode(json_decode($prerequisites, true)); // Encode the array as a JSON string
            } else {
                $lessonContent .= $line . "\n";
            }
        }
        // Remove the first two lines (YAML frontmatter delimiters)
        $lessonContent = substr($lessonContent, strpos($lessonContent, "\n") + 1);
        $lessonContent = substr($lessonContent, strpos($lessonContent, "\n") + 1);

        $metadata['content'] = trim($lessonContent);
        return $metadata;
    }

    /**
     * Remove double quotes from the beginning and end of a string.
     *
     * @param string $value
     * @return string
     */
    private function removeQuotes($value)
    {
        if (str_starts_with($value, '"') && str_ends_with($value, '"')) {
            return substr($value, 1, -1); // Remove the first and last character (quotes)
        }
        return $value;
    }
}
