<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nouns', function (Blueprint $table) {
            $table->id();
            $table->string('word');
            $table->foreignId('language_id')->constrained();
            $table->string('gender')->nullable(); // Only used for languages with grammatical gender
            $table->enum('difficulty_level', ['beginner', 'intermediate', 'advanced'])->default('beginner');
            $table->timestamps();

            // Index for faster lookups
            $table->index(['language_id', 'word']);
            $table->index('difficulty_level');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nouns');
    }
};
