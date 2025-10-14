<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('noun_list_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('noun_list_id')->constrained()->cascadeOnDelete();
            $table->foreignId('noun_id')->constrained()->cascadeOnDelete();
            $table->integer('order_index')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->unique(['noun_list_id', 'noun_id']);
            $table->index(['noun_list_id', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('noun_list_items');
    }
};
