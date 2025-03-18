<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained()
                ->onDelete('cascade');

            // Game-specific settings
            $table->enum('gender_duel_difficulty', ['easy', 'medium', 'hard'])
                ->default('medium')
                ->nullable();
            $table->boolean('gender_duel_sound')
                ->default(true)
                ->nullable();
            $table->boolean('gender_duel_timer')
                ->default(true)
                ->nullable();

            $table->enum('memory_translation_difficulty', ['easy', 'medium', 'hard'])
                ->default('medium')
                ->nullable();
            $table->enum('word_search_puzzle_difficulty', ['easy', 'medium', 'hard'])
                ->default('medium')
                ->nullable();

            // Global user settings
            $table->string('preferred_language')
                ->nullable();
            $table->boolean('dark_mode')
                ->default(false)
                ->nullable();
            $table->string('timezone')
                ->nullable();

            // Flexible JSON for future/rare settings
            $table->json('additional_settings')
                ->nullable();

            $table->timestamps();

            // Ensure unique settings per user
            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_settings');
    }
};
