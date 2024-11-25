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
            $table->foreignId('noun_id')->constrained()->onDelete('cascade');
            $table->foreignId('language_pair_id')->constrained()->onDelete('cascade');
            $table->string('translation');
            $table->timestamps();

            // Ensure we don't have duplicate translations for the same noun and language pair
            $table->unique(['noun_id', 'language_pair_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('noun_translations');
    }
};
