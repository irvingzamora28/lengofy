<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('language_pair_id')
                ->nullable()
                ->constrained('language_pairs')
                ->onDelete('set null');
        });

    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['language_pair_id']);
            $table->dropColumn('language_pair_id');
        });
    }
};
