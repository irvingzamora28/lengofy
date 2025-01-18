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
            $table->string('emoji', 8)->nullable();
            $table->tinyInteger('difficulty_level')->comment('the difficulty level of the noun (1 for beginner, 2 for intermediate, 3 for advanced)');
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
