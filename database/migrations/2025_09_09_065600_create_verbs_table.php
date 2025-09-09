<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('verbs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('language_id')->constrained('languages')->cascadeOnDelete()
                ->comment('FK to languages');
            $table->string('infinitive')->comment('Infinitive/base form of the verb');
            $table->boolean('is_irregular')->default(false)->comment('Whether the verb is irregular');
            $table->integer('frequency_rank')->nullable()->comment('Lower rank = more frequent/common verb');
            $table->string('translation')->nullable()->comment('Optional translation for UI');
            $table->json('metadata')->nullable()->comment('JSON with language-specific details (e.g., separable prefixes)');
            $table->timestamps();

            $table->unique(['language_id', 'infinitive']);
            $table->index(['language_id', 'frequency_rank']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('verbs');
    }
};
