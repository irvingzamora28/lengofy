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
        Schema::create('pronouns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('language_id')->constrained('languages')->cascadeOnDelete();
            $table->string('code'); // canonical key (e.g., ich, yo, I)
            $table->string('display'); // display label
            $table->unsignedTinyInteger('person'); // 1,2,3
            $table->string('number', 2); // sg|pl
            $table->boolean('is_polite')->default(false);
            $table->unsignedSmallInteger('order_index')->default(0);
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
        Schema::dropIfExists('pronouns');
    }
};
