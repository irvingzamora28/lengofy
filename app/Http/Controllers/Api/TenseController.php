<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tense;
use Illuminate\Http\Request;

class TenseController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $languagePair = \App\Models\LanguagePair::findOrFail($user->language_pair_id);
        
        $tenses = Tense::where('language_id', $languagePair->target_language_id)
            ->orderBy('order_index')
            ->get(['id', 'name', 'code']);
        
        return response()->json($tenses);
    }
}
