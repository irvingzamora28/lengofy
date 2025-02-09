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
                $data = $this->extractLessonMetadata($content);
                $data['language_pair_id'] = $languagePair->id; // Set the language_pair_id
                $data['content'] = $content; // Set the content

                if (DB::table('lessons')->where('title', $data['title'])->exists()) {
                    DB::table('lessons')->where('title', $data['title'])->update($data);
                    Log::info("Lesson updated: {$data['title']}");
                } else {
                    DB::table('lessons')->insert($data);
                    Log::info("Lesson inserted: {$data['title']}");
                }
            } else {
                Log::warning("Language pair not found for code: $languagePairCode");
            }
        }
    }

    /**
     * Extract lesson metadata from the file content.
     *
     * @param string $content
     * @return array
     */
    private function extractLessonMetadata($content)
    {
        $lines = explode("\n", $content);
        $metadata = [];

        foreach ($lines as $line) {
            if (strpos($line, 'title:') === 0) {
                $metadata['title'] = $this->cleanValue(str_replace('title:', '', $line));
            } elseif (strpos($line, 'lesson_number:') === 0) {
                $metadata['lesson_number'] = (int) trim(str_replace('lesson_number:', '', $line));
            } elseif (strpos($line, 'level:') === 0) {

                $metadata['level'] = $this->cleanValue(str_replace('level:', '', $line));
            } elseif (strpos($line, 'description:') === 0) {
                $metadata['description'] = $this->cleanValue(str_replace('description:', '', $line));
            } elseif (strpos($line, 'topics:') === 0) {
                $metadata['topics'] = json_encode(json_decode(trim(str_replace('topics:', '', $line)), true));
            } elseif (strpos($line, 'prerequisites:') === 0) {
                $metadata['prerequisites'] = json_encode(json_decode(trim(str_replace('prerequisites:', '', $line)), true));
            }
        }

        return $metadata;
    }

    /**
     * Clean value by removing unnecessary quotes.
     *
     * @param string $value
     * @return string
     */
    private function cleanValue($value)
    {
        $trimmed = trim($value);
        return (str_starts_with($trimmed, '"') && str_ends_with($trimmed, '"')) ? substr($trimmed, 1, -1) : $trimmed;
    }
}
