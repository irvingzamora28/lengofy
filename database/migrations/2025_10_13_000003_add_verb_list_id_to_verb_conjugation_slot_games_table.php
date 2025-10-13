<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('verb_conjugation_slot_games', function (Blueprint $table) {
            $table->foreignId('verb_list_id')->nullable()->after('category_id')->constrained('verb_lists')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('verb_conjugation_slot_games', function (Blueprint $table) {
            $table->dropForeign(['verb_list_id']);
            $table->dropColumn('verb_list_id');
        });
    }
};
