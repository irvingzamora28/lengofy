<?php

namespace App\Console\Commands;

use App\Models\Conjugation;
use App\Models\Language;
use App\Models\Pronoun;
use App\Models\Tense;
use App\Models\Verb;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class ImportConjugations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'conjugations:import {language : Language code (e.g., de, es, en)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import conjugations (and required pronouns, tenses, verbs) for a language from JSON files';

    public function handle(): int
    {
        $langCode = (string) $this->argument('language');
        $dir = base_path('database/seeds/verbs/' . $langCode . '/conjugations');

        if (!is_dir($dir)) {
            $this->error("Directory not found: {$dir}");
            return self::FAILURE;
        }

        $paths = [
            'pronouns' => $dir . DIRECTORY_SEPARATOR . 'pronouns.json',
            'tenses' => $dir . DIRECTORY_SEPARATOR . 'tenses.json',
            'verbs' => $dir . DIRECTORY_SEPARATOR . 'verbs.json',
            'conjugations' => $dir . DIRECTORY_SEPARATOR . 'conjugations.json',
        ];

        foreach ($paths as $key => $path) {
            if (!file_exists($path)) {
                $this->error("Missing required file: {$path}");
                return self::FAILURE;
            }
        }

        $language = Language::where('code', $langCode)->first();
        if (!$language) {
            $this->error("Language not found with code '{$langCode}'. Create it in languages table first.");
            return self::FAILURE;
        }

        $this->info("Importing conjugations for '{$language->name}' ({$language->code}) from fixed directory: {$dir} ...");

        $pronouns = $this->readJson($paths['pronouns']);
        $tenses = $this->readJson($paths['tenses']);
        $verbs = $this->readJson($paths['verbs']);
        $conjugations = $this->readJson($paths['conjugations']);

        if ($pronouns === null || $tenses === null || $verbs === null || $conjugations === null) {
            return self::FAILURE;
        }

        DB::beginTransaction();
        try {
            // Upsert pronouns
            $pronounCount = 0;
            foreach ($pronouns as $p) {
                $this->validatePronoun($p, $langCode);
                Pronoun::updateOrCreate(
                    ['language_id' => $language->id, 'code' => $p['code']],
                    [
                        'display' => $p['display'] ?? $p['code'],
                        'person' => $p['person'] ?? 3,
                        'number' => $p['number'] ?? 'sg',
                        'is_polite' => (bool)($p['is_polite'] ?? false),
                        'order_index' => $p['order_index'] ?? 0,
                    ]
                );
                $pronounCount++;
            }

            // Upsert tenses
            $tenseCount = 0;
            foreach ($tenses as $t) {
                $this->validateTense($t, $langCode);
                Tense::updateOrCreate(
                    ['language_id' => $language->id, 'code' => $t['code']],
                    [
                        'name' => $t['name'] ?? $t['code'],
                        'is_compound' => (bool)($t['is_compound'] ?? false),
                        'order_index' => $t['order_index'] ?? 0,
                    ]
                );
                $tenseCount++;
            }

            // Upsert verbs
            $verbCount = 0;
            foreach ($verbs as $v) {
                $this->validateVerb($v, $langCode);
                Verb::updateOrCreate(
                    ['language_id' => $language->id, 'infinitive' => $v['infinitive']],
                    [
                        'is_irregular' => (bool)($v['is_irregular'] ?? false),
                        'frequency_rank' => $v['frequency_rank'] ?? null,
                        'translation' => $v['translation'] ?? null,
                        'metadata' => $v['metadata'] ?? null,
                    ]
                );
                $verbCount++;
            }

            // Insert/Update conjugations
            $conjCount = 0;
            foreach (array_chunk($conjugations, 500) as $chunk) {
                foreach ($chunk as $c) {
                    $this->validateConjugation($c, $langCode);

                    $verb = Verb::where('language_id', $language->id)
                        ->where('infinitive', $c['infinitive'])
                        ->first();
                    if (!$verb) {
                        throw new \RuntimeException("Verb not found for infinitive '{$c['infinitive']}'");
                    }
                    $tense = Tense::where('language_id', $language->id)
                        ->where('code', $c['tense_code'])
                        ->first();
                    if (!$tense) {
                        throw new \RuntimeException("Tense not found for code '{$c['tense_code']}'");
                    }
                    $pronoun = Pronoun::where('language_id', $language->id)
                        ->where('code', $c['pronoun_code'])
                        ->first();
                    if (!$pronoun) {
                        throw new \RuntimeException("Pronoun not found for code '{$c['pronoun_code']}'");
                    }

                    Conjugation::updateOrCreate(
                        [
                            'verb_id' => $verb->id,
                            'tense_id' => $tense->id,
                            'pronoun_id' => $pronoun->id,
                        ],
                        [
                            'form' => $c['form'],
                            // normalized_form may be omitted; Conjugation mutator will populate when form is set
                            'normalized_form' => $c['normalized_form'] ?? null,
                            'notes' => $c['notes'] ?? null,
                        ]
                    );
                    $conjCount++;
                }
            }

            DB::commit();

            $this->info("Imported: pronouns={$pronounCount}, tenses={$tenseCount}, verbs={$verbCount}, conjugations={$conjCount}");
            return self::SUCCESS;
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error('Import failed: ' . $e->getMessage());
            return self::FAILURE;
        }
    }

    /**
     * @param string $path
     * @return array<int, array>|null
     */
    protected function readJson(string $path): ?array
    {
        try {
            $json = File::get($path);
            $data = json_decode($json, true, flags: JSON_THROW_ON_ERROR);
            if (!is_array($data)) {
                $this->error("File is not an array: {$path}");
                return null;
            }
            return $data;
        } catch (\Throwable $e) {
            $this->error("Failed to read {$path}: " . $e->getMessage());
            return null;
        }
    }

    protected function validatePronoun(array $p, string $langCode): void
    {
        foreach (['code'] as $key) {
            if (!array_key_exists($key, $p)) {
                throw new \InvalidArgumentException("Pronoun missing required key '{$key}'");
            }
        }
        $this->assertLanguageMatch($p, $langCode, 'Pronoun');
    }

    protected function validateTense(array $t, string $langCode): void
    {
        foreach (['code'] as $key) {
            if (!array_key_exists($key, $t)) {
                throw new \InvalidArgumentException("Tense missing required key '{$key}'");
            }
        }
        $this->assertLanguageMatch($t, $langCode, 'Tense');
    }

    protected function validateVerb(array $v, string $langCode): void
    {
        foreach (['infinitive'] as $key) {
            if (!array_key_exists($key, $v)) {
                throw new \InvalidArgumentException("Verb missing required key '{$key}'");
            }
        }
        $this->assertLanguageMatch($v, $langCode, 'Verb');
    }

    protected function validateConjugation(array $c, string $langCode): void
    {
        foreach (['infinitive', 'tense_code', 'pronoun_code', 'form'] as $key) {
            if (!array_key_exists($key, $c)) {
                throw new \InvalidArgumentException("Conjugation missing required key '{$key}'");
            }
        }
        $this->assertLanguageMatch($c, $langCode, 'Conjugation');
    }

    protected function assertLanguageMatch(array $row, string $langCode, string $entity): void
    {
        $code = $row['language'] ?? $row['language_code'] ?? null;
        if ($code === null) {
            throw new \InvalidArgumentException("{$entity} entry missing required 'language' or 'language_code'");
        }
        if ($code !== $langCode) {
            throw new \InvalidArgumentException("{$entity} entry language '{$code}' does not match import language '{$langCode}'");
        }
    }
}
