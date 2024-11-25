<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('language_pairs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_language_id')->constrained('languages');
            $table->foreignId('target_language_id')->constrained('languages');
            $table->boolean('is_active')->default(true);
            $table->json('grammar_rules')->nullable(); // Store language-specific rules (e.g., gender rules for German)
            $table->timestamps();

            // Ensure unique pairs
            $table->unique(['source_language_id', 'target_language_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('language_pairs');
    }
};
