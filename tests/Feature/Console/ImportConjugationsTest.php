<?php

namespace Tests\Feature\Console;

use App\Models\Language;
use App\Models\Conjugation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class ImportConjugationsTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        // Cleanup the temporary files/directories we created
        foreach (['tt', 'zz'] as $lang) {
            $path = base_path("database/seeds/verbs/{$lang}");
            if (File::isDirectory($path)) {
                File::deleteDirectory($path);
            }
        }
        parent::tearDown();
    }

    public function test_it_imports_conjugations_and_dependencies_from_json(): void
    {
        // Use a test-specific language code and directory
        $lang = 'tt';
        Language::factory()->create(['code' => $lang, 'name' => 'Test']);
        $dir = base_path("database/seeds/verbs/{$lang}/conjugations");
        File::ensureDirectoryExists($dir);

        // Create minimal JSON datasets (pronouns, tenses, verbs, conjugations) reflecting current importer expectations
        $pronouns = [[
            'language' => $lang,
            'code' => 'ich',
            'display' => 'ich',
        ]];
        $tenses = [[
            'language' => $lang,
            'code' => $lang . '.pres.ind',
            'name' => 'Präsens',
        ]];
        $verbs = [[
            'language' => $lang,
            'infinitive' => 'sprechen',
            'translation' => 'to speak',
        ]];
        $conjugations = [[
            'language' => $lang,
            'infinitive' => 'sprechen',
            'tense_code' => $lang . '.pres.ind',
            'pronoun_code' => 'ich',
            'form' => 'spreche',
            // Include normalized_form to reflect current importer behavior (which writes provided value)
            'normalized_form' => 'spreche',
        ]];

        File::put($dir . '/pronouns.json', json_encode($pronouns, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));
        File::put($dir . '/tenses.json', json_encode($tenses, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));
        File::put($dir . '/verbs.json', json_encode($verbs, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));
        File::put($dir . '/conjugations.json', json_encode($conjugations, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));

        // Act
        $exit = $this->artisan("conjugations:import {$lang}")->run();

        // Assert
        $this->assertSame(0, $exit, 'Artisan command should exit with code 0');
        $this->assertDatabaseHas('pronouns', ['code' => 'ich']);
        $this->assertDatabaseHas('tenses', ['code' => $lang . '.pres.ind']);
        $this->assertDatabaseHas('verbs', ['infinitive' => 'sprechen']);

        $conj = Conjugation::query()->first();
        $this->assertNotNull($conj, 'Conjugation row should exist');
        $this->assertSame('spreche', $conj->form);
        // normalized_form is set by model mutator from form
        $this->assertSame('spreche', $conj->fresh()->normalized_form);
    }

    public function test_it_fails_when_language_row_missing(): void
    {
        // Use a distinct language code unlikely to be pre-seeded, and create matching files
        $lang = 'zz';
        $dir = base_path("database/seeds/verbs/{$lang}/conjugations");
        File::ensureDirectoryExists($dir);

        File::put($dir . '/pronouns.json', json_encode([[ 'language' => $lang, 'code' => 'p1' ]]));
        File::put($dir . '/tenses.json', json_encode([[ 'language' => $lang, 'code' => 'zz.pres.ind' ]]));
        File::put($dir . '/verbs.json', json_encode([[ 'language' => $lang, 'infinitive' => 'v1' ]]));
        File::put($dir . '/conjugations.json', json_encode([[
            'language' => $lang,
            'infinitive' => 'v1',
            'tense_code' => 'zz.pres.ind',
            'pronoun_code' => 'p1',
            'form' => 'x'
        ]]));

        $exit = $this->artisan("conjugations:import {$lang}")->run();
        $this->assertSame(1, $exit, 'Artisan command should fail when language is missing');
    }
}
