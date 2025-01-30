<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLessonsTable extends Migration
{
    public function up()
    {
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->string('title')->unique();
            $table->string('description')->nullable();
            $table->integer('lesson_number');
            $table->enum('level', ['beginner', 'elementary', 'pre-intermediate', 'intermediate', 'upper-intermediate', 'advanced', 'proficiency']);
            $table->json('topics')->nullable();
            $table->json('prerequisites')->nullable();
            $table->text('content');
            $table->unsignedBigInteger('language_pair_id');
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('language_pair_id')->references('id')->on('language_pairs')->onDelete('cascade');

            // Indexes
            $table->index('lesson_number');
            $table->index('level');
            $table->index(['language_pair_id', 'level']);

            // Full-text index
            $table->fullText(['title', 'content']);

        });
    }

    public function down()
    {
        Schema::dropIfExists('lessons');
    }
}
