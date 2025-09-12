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
        Schema::create('conjugations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('verb_id')->constrained('verbs')->cascadeOnDelete()
                ->comment('FK to verbs');
            $table->foreignId('tense_id')->constrained('tenses')->cascadeOnDelete()
                ->comment('FK to tenses');
            $table->foreignId('pronoun_id')->constrained('pronouns')->cascadeOnDelete()
                ->comment('FK to pronouns');
            $table->string('form')->comment('Canonical conjugated form for verb+tense+pronoun');
            $table->string('normalized_form')->nullable()
                ->comment('Lowercased, accent-stripped version of form for accent-insensitive exact matches');
            $table->string('notes')->nullable()->comment('Optional notes about special forms');
            $table->timestamps();

            $table->unique(['verb_id', 'tense_id', 'pronoun_id']);
            $table->index('normalized_form');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conjugations');
    }
};
