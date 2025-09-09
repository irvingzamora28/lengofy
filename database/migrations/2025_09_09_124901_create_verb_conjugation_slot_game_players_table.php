<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verb_conjugation_slot_game_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained('verb_conjugation_slot_games')->cascadeOnDelete();
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
        Schema::dropIfExists('verb_conjugation_slot_game_players');
    }
};
