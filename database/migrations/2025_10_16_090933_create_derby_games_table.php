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
        Schema::create('derby_games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->constrained('users');
            $table->foreignId('language_pair_id')->constrained('language_pairs');
            $table->string('status')->default('waiting'); // waiting, in_progress, completed
            $table->integer('max_players')->default(4);
            $table->string('race_mode')->default('time'); // time, distance
            $table->integer('race_duration_s')->default(120);
            $table->integer('total_segments')->default(20);
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('medium');
            $table->json('noun_list_ids')->nullable();
            $table->json('verb_list_ids')->nullable();
            $table->json('lesson_ids')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('derby_games');
    }
};
