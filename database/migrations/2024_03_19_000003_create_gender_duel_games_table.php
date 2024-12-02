<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gender_duel_games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->constrained('users');
            $table->foreignId('language_pair_id')->constrained('language_pairs');
            $table->string('status')->default('waiting'); // waiting, in_progress, completed
            $table->integer('max_players')->default(8);
            $table->integer('current_round')->default(0);
            $table->integer('total_rounds')->default(10);
            $table->json('current_word')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gender_duel_games');
    }
};
