<?php

namespace App\Http\Controllers;

use App\Models\Noun;
use App\Models\UserNoun;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NounController extends Controller
{
    /**
     * List nouns for the current user's target language with search + pagination.
     * Route: GET /nouns
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $targetLanguageId = null;
        $sourceLanguageId = null;

        if ($user && $user->languagePair) {
            $targetLanguageId = $user->languagePair->target_language_id;
            $sourceLanguageId = $user->languagePair->source_language_id;
        }

        // Allow overriding via query for testing: ?lang_id=
        if (!$targetLanguageId) {
            $targetLanguageId = (int) $request->query('lang_id', 0) ?: null;
        }

        abort_unless($targetLanguageId, 404, 'Target language not determined.');

        $q = trim((string) $request->query('q', ''));
        $perPage = (int) $request->query('per_page', 20);

        $query = Noun::query()
            ->where('language_id', $targetLanguageId);

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('word', 'like', "%$q%");
            });
        }

        $query->orderBy('word');

        $paginator = $query->paginate($perPage)->appends($request->query());

        // Build favorite map
        $favoriteIds = [];
        if ($user) {
            $favoriteIds = UserNoun::where('user_id', $user->id)->pluck('noun_id')->all();
        }

        return Inertia::render('Nouns/Index', [
            'filters' => [
                'q' => $q,
                'per_page' => $perPage,
            ],
            'nouns' => $paginator->through(function (Noun $n) use ($favoriteIds, $sourceLanguageId) {
                $translation = null;
                if ($sourceLanguageId) {
                    $translation = $n->getTranslation((string) $sourceLanguageId);
                }
                return [
                    'id' => $n->id,
                    'word' => $n->word,
                    'gender' => $n->gender,
                    'translation' => $translation,
                    'is_favorite' => in_array($n->id, $favoriteIds, true),
                ];
            }),
        ]);
    }
}
