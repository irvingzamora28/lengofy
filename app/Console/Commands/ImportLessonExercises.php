<?php

namespace App\Console\Commands;

use App\Models\Exercise;
use App\Models\ExerciseType;
use App\Models\Language;
use App\Models\LanguagePair;
use App\Models\Lesson;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class ImportLessonExercises extends Command
{
    protected $signature = 'lessons:seed-exercises {pair} {lesson} {--file=} {--no-wipe}';

    protected $description = 'Import exercises for a specific lesson and language pair from a JSON file';

    public function handle(): int
    {
        $pairOpt = $this->argument('pair');
        $lessonNumber = $this->argument('lesson');
        $fileOpt = $this->option('file');
        $noWipe = (bool) $this->option('no-wipe');

        if (!$pairOpt || !$lessonNumber) {
            $this->error('Both --pair and --lesson options are required.');
            return self::FAILURE;
        }

        // Resolve pair
        $pair = $this->resolveLanguagePair($pairOpt);
        if (!$pair) {
            $this->error("Language pair not found for '{$pairOpt}'. Use form 'en-de' or a numeric ID.");
            return self::FAILURE;
        }

        // Resolve lesson
        $lesson = Lesson::where('language_pair_id', $pair->id)
            ->where('lesson_number', (int) $lessonNumber)
            ->first();
        if (!$lesson) {
            $this->error("Lesson not found for pair {$pair->id} and lesson_number {$lessonNumber}.");
            return self::FAILURE;
        }

        // Resolve file path
        $path = $fileOpt ?: base_path("database/seeders/data/" . $this->pairSlug($pair) . "/lesson-{$lessonNumber}.json");

        if (!File::exists($path)) {
            $this->error("JSON file not found at: {$path}");
            return self::FAILURE;
        }

        // Load JSON
        try {
            $json = File::get($path);
            $data = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        } catch (\Throwable $e) {
            $this->error('Failed to read/parse JSON: ' . $e->getMessage());
            return self::FAILURE;
        }

        if (!isset($data['exercises']) || !is_array($data['exercises'])) {
            $this->error("JSON must contain an 'exercises' array.");
            return self::FAILURE;
        }

        // Load exercise types
        $types = ExerciseType::pluck('id', 'name');

        DB::beginTransaction();
        try {
            if (!$noWipe) {
                Exercise::where('lesson_id', $lesson->id)->delete();
                $this->info('Deleted existing exercises for the lesson.');
            }

            foreach ($data['exercises'] as $idx => $ex) {
                // Validate
                $typeName = $ex['type'] ?? null;
                if (!$typeName || !isset($types[$typeName])) {
                    throw new \RuntimeException("Unknown or missing exercise type at index {$idx}: '" . ($typeName ?? 'null') . "'.");
                }
                $order = isset($ex['order']) ? (int) $ex['order'] : ($idx + 1);
                $payload = $ex['data'] ?? null;
                if (!is_array($payload)) {
                    throw new \RuntimeException("Missing or invalid 'data' for exercise at index {$idx}.");
                }

                Exercise::create([
                    'lesson_id' => $lesson->id,
                    'exercise_type_id' => (int) $types[$typeName],
                    'title' => $ex['title'] ?? null,
                    'instructions' => $ex['instructions'] ?? null,
                    'data' => $payload,
                    'order' => $order,
                    'is_active' => $ex['is_active'] ?? true,
                ]);
            }

            DB::commit();
            $this->info('Exercises imported successfully from ' . $path);
            return self::SUCCESS;
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error('Import failed: ' . $e->getMessage());
            return self::FAILURE;
        }
    }

    private function resolveLanguagePair(string $pairOpt): ?LanguagePair
    {
        if (ctype_digit($pairOpt)) {
            return LanguagePair::find((int) $pairOpt);
        }

        // expected format en-de
        $parts = preg_split('/[-_]/', $pairOpt);
        if (!$parts || count($parts) !== 2) {
            return null;
        }
        [$src, $tgt] = $parts;

        $srcLang = Language::where('code', strtolower($src))->first();
        $tgtLang = Language::where('code', strtolower($tgt))->first();
        if (!$srcLang || !$tgtLang) {
            return null;
        }

        return LanguagePair::where('source_language_id', $srcLang->id)
            ->where('target_language_id', $tgtLang->id)
            ->first();
    }

    private function pairSlug(LanguagePair $pair): string
    {
        $src = optional($pair->sourceLanguage)->code ?? 'src';
        $tgt = optional($pair->targetLanguage)->code ?? 'tgt';
        return strtolower($src . '-' . $tgt);
    }
}
