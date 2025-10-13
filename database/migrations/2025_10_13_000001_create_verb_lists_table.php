<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('verb_lists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->integer('order_index')->default(0);
            $table->timestamps();
            
            $table->index(['user_id', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verb_lists');
    }
};
