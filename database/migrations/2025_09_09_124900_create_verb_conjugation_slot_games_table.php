<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verb_conjugation_slot_games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->constrained('users');
            $table->foreignId('language_pair_id')->constrained('language_pairs');
            $table->string('status')->default('waiting'); // waiting, in_progress, ended
            $table->integer('max_players')->default(8);
            $table->integer('total_rounds')->default(10);
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->nullable()->default('medium');
            $table->tinyInteger('category_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verb_conjugation_slot_games');
    }
};
