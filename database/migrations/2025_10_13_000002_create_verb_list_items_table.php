<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('verb_list_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('verb_list_id')->constrained()->cascadeOnDelete();
            $table->foreignId('verb_id')->constrained()->cascadeOnDelete();
            $table->integer('order_index')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->unique(['verb_list_id', 'verb_id']);
            $table->index(['verb_list_id', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verb_list_items');
    }
};
