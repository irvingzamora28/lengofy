<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gender_duel_game_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained('gender_duel_games')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->uuid('guest_id')->nullable();
            $table->string('player_name');
            $table->unsignedMediumInteger('score')->default(0);
            $table->boolean('is_ready')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gender_duel_game_players');
    }
};
