<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('feature_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('upcoming_features', function (Blueprint $table) {
            $table->id();
            $table->foreignId('feature_category_id')->constrained('feature_categories')->onDelete('cascade');
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('waitlist_subscribers', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamps();
        });

        Schema::create('subscriber_feature_interests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscriber_id')->constrained('waitlist_subscribers')->onDelete('cascade');
            $table->foreignId('feature_id')->constrained('upcoming_features')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['subscriber_id', 'feature_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('subscriber_feature_interests');
        Schema::dropIfExists('waitlist_subscribers');
        Schema::dropIfExists('upcoming_features');
        Schema::dropIfExists('feature_categories');
    }
};
