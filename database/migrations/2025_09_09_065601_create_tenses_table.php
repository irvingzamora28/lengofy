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
        Schema::create('tenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('language_id')->constrained('languages')->cascadeOnDelete()
                ->comment('FK to languages');
            $table->string('code')->comment('Canonical tense code, e.g., de.pres.ind, es.pret.ind, en.past.simp');
            $table->string('name')->comment('Human-friendly label for UI');
            $table->boolean('is_compound')->default(false)->comment('Whether tense is compound (e.g., Perfekt)');
            $table->unsignedSmallInteger('order_index')->default(0)->comment('Sorting order for UI');
            $table->timestamps();

            $table->unique(['language_id', 'code']);
            $table->index(['language_id', 'order_index']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenses');
    }
};
