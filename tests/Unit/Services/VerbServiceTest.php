<?php

namespace Tests\Unit\Services;

use App\Models\Conjugation;
use App\Models\Language;
use App\Models\LanguagePair;
use App\Models\Pronoun;
use App\Models\Tense;
use App\Models\Verb;
use App\Services\VerbService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VerbServiceTest extends TestCase
{
    use RefreshDatabase;

    private function seedMinimalData(): array
    {
        $source = Language::factory()->create(['code' => 'en']);
        $target = Language::factory()->create(['code' => 'de']);
        $pair = LanguagePair::factory()->create([
            'source_language_id' => $source->id,
            'target_language_id' => $target->id,
        ]);

        $tense = Tense::factory()->create([
            'language_id' => $target->id,
            'code' => 'de.pres.ind',
            'order_index' => 0,
        ]);

        $pronoun = Pronoun::factory()->create([
            'language_id' => $target->id,
            'code' => 'ich',
            'order_index' => 0,
        ]);

        $verb = Verb::factory()->create([
            'language_id' => $target->id,
            'infinitive' => 'sein',
            'frequency_rank' => 1,
        ]);

        Conjugation::create([
            'verb_id' => $verb->id,
            'tense_id' => $tense->id,
            'pronoun_id' => $pronoun->id,
            'form' => 'bin',
            'normalized_form' => Conjugation::normalize('bin'),
            'notes' => null,
        ]);

        return compact('pair', 'tense', 'pronoun', 'verb');
    }

    public function test_get_random_prompt_returns_prompt(): void
    {
        $this->seedMinimalData();

        $service = app(VerbService::class);
        $pairId = LanguagePair::first()->id;

        $prompt = $service->getRandomPrompt($pairId, 'easy');

        $this->assertNotNull($prompt, 'Expected a prompt but got null');
        $this->assertEquals('bin', $prompt['expected']);
        $this->assertEquals(Conjugation::normalize('bin'), $prompt['normalized_expected']);
        $this->assertEquals('sein', $prompt['verb']['infinitive']);
    }

    public function test_normalize_handles_case_and_diacritics(): void
    {
        $service = app(VerbService::class);
        $this->assertEquals('uber', $service->normalize('Über'));
        $this->assertEquals('habe', $service->normalize('HABE'));
    }
}
