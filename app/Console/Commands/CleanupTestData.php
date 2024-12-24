<?php

namespace App\Console\Commands;

use Database\Seeders\TestDataSeeder;
use Illuminate\Console\Command;

class CleanupTestData extends Command
{
    protected $signature = 'testdata:cleanup';
    protected $description = 'Cleanup test data from the database';

    public function handle()
    {
        $seeder = new TestDataSeeder();
        $seeder->cleanup();
        $this->info('Test data cleaned up successfully.');
    }
}
