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
        Schema::create('memory_translation_games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->constrained('users');
            $table->foreignId('language_pair_id')->constrained('language_pairs');
            $table->string('status')->default('waiting'); // waiting, in_progress, completed
            $table->integer('max_players')->default(8);
            $table->integer('total_words')->default(10);
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->nullable()->default('medium');
            $table->tinyInteger('category_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('memory_translation_games');
    }
};
