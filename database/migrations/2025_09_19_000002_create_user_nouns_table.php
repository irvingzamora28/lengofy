<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_nouns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('noun_id')->constrained()->cascadeOnDelete();
            $table->integer('priority')->nullable();
            $table->string('notes', 500)->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'noun_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_nouns');
    }
};
