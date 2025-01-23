<?php

namespace App\Console\Commands;

use Database\Seeders\NounSeeder;
use Illuminate\Console\Command;

class SeedNouns extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:seed-nouns {language_code=de}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed nouns for a specific language';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $languageCode = $this->argument('language_code');
        $this->info("Seeding nouns for language code: $languageCode");

        $seeder = new NounSeeder($languageCode);
        $seeder->run();

        $this->info('Nouns seeded successfully.');
    }
}
