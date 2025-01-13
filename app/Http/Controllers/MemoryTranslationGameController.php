<?php

namespace App\Http\Controllers;

use App\Models\LanguagePair;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MemoryTranslationGameController extends Controller
{

    public function practice(Request $request)
    {
        $user = auth()->user();
        $languagePair = LanguagePair::with('targetLanguage')->findOrFail($user->language_pair_id);
        return Inertia::render('MemoryTranslationGame/Practice', [
            'targetLanguage' => $languagePair->targetLanguage->code,
        ]);
    }
}
