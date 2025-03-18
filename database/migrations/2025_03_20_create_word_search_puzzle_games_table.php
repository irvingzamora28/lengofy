<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('word_search_puzzle_games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->constrained('users');
            $table->foreignId('language_pair_id')->constrained('language_pairs');
            $table->string('status')->default('waiting'); // waiting, in_progress, completed
            $table->integer('max_players')->default(8);
            $table->foreignId('winner_id')->nullable()->constrained('users');
            $table->integer('round_time')->default(180)->comment('Round time in seconds');
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->nullable()->default('medium');
            $table->tinyInteger('category_id')->nullable();
            $table->timestamps();
        });

        Schema::create('word_search_puzzle_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('word_search_puzzle_game_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users');
            $table->integer('score')->default(0);
            $table->boolean('is_ready')->default(false);
            $table->timestamps();
        });

        Schema::create('word_search_puzzle_found_words', function (Blueprint $table) {
            $table->id();
            $table->foreignId('word_search_puzzle_game_id');
            $table->foreignId('player_id')->constrained('word_search_puzzle_players')->onDelete('cascade');
            $table->string('word');
            $table->integer('points');
            $table->timestamp('found_at');
            $table->timestamps();

            // Add custom-named foreign key constraint
            $table->foreign(
                'word_search_puzzle_game_id',
                'found_words_game_fk'  // Custom constraint name
            )->references('id')->on('word_search_puzzle_games')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('word_search_puzzle_found_words');
        Schema::dropIfExists('word_search_puzzle_players');
        Schema::dropIfExists('word_search_puzzle_games');
    }
};
