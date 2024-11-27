<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('noun_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('noun_id')->constrained()->cascadeOnDelete();
            $table->foreignId('language_id')->constrained('languages');
            $table->string('translation');
            $table->timestamps();

            // Ensure a noun can only have one translation per language
            $table->unique(['noun_id', 'language_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('noun_translations');
    }
};
