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
        Schema::create('memory_translation_game_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained('memory_translation_games')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('player_name');
            $table->unsignedMediumInteger('score')->default(0);
            $table->unsignedMediumInteger('moves')->default(0);
            $table->unsignedMediumInteger('time')->default(0);
            $table->boolean('is_ready')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('memory_translation_game_players');
    }
};
