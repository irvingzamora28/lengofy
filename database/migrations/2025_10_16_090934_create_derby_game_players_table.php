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
        Schema::create('derby_game_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained('derby_games')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->uuid('guest_id')->nullable();
            $table->string('player_name');
            $table->unsignedMediumInteger('score')->default(0);
            $table->decimal('progress', 5, 4)->default(0.0000); // 0.0000 to 1.0000
            $table->boolean('is_ready')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('derby_game_players');
    }
};
