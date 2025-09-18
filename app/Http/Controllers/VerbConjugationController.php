<?php

namespace App\Http\Controllers;

use App\Models\Conjugation;
use App\Models\Pronoun;
use App\Models\Tense;
use App\Models\Verb;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class VerbConjugationController extends Controller
{
    /**
     * List verbs for the current user's target language with search + pagination.
     * Route: GET /verbs
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $targetLanguageId = null;

        if ($user && $user->languagePair) {
            $targetLanguageId = $user->languagePair->target_language_id;
        }

        // Allow overriding via query for testing: ?lang_id=
        if (!$targetLanguageId) {
            $targetLanguageId = (int) $request->query('lang_id', 0) ?: null;
        }

        abort_unless($targetLanguageId, 404, 'Target language not determined.');

        $q = trim((string) $request->query('q', ''));
        $perPage = (int) $request->query('per_page', 20);

        $query = Verb::query()
            ->select('id', 'infinitive', 'translation')
            ->where('language_id', $targetLanguageId);

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('infinitive', 'like', "%$q%")
                    ->orWhere('translation', 'like', "%$q%");
            });
        }

        // Prefer most frequent first if available
        $query->orderByRaw('CASE WHEN frequency_rank IS NULL THEN 1 ELSE 0 END')
              ->orderBy('frequency_rank')
              ->orderBy('infinitive');

        $verbs = $query->paginate($perPage)->appends($request->query());

        return Inertia::render('Verbs/Index', [
            'filters' => [
                'q' => $q,
                'per_page' => $perPage,
            ],
            'verbs' => $verbs->through(fn ($v) => [
                'id' => $v->id,
                'infinitive' => $v->infinitive,
                'translation' => $v->translation,
            ]),
        ]);
    }

    /**
     * Return 5 random verbs for the current user's target language as JSON.
     * Route: GET /verbs/random
     */
    public function random(Request $request)
    {
        $user = Auth::user();
        $targetLanguageId = null;

        if ($user && $user->languagePair) {
            $targetLanguageId = $user->languagePair->target_language_id;
        }

        // Allow overriding via query for testing: ?lang_id=
        if (!$targetLanguageId) {
            $targetLanguageId = (int) $request->query('lang_id', 0) ?: null;
        }

        abort_unless($targetLanguageId, 404, 'Target language not determined.');

        // Use RAND() for MySQL; the project uses MySQL.
        $verbs = Verb::query()
            ->select('id', 'infinitive', 'translation')
            ->where('language_id', $targetLanguageId)
            ->inRandomOrder() // translates to ORDER BY RAND() on MySQL
            ->limit(5)
            ->get()
            ->map(fn ($v) => [
                'id' => $v->id,
                'infinitive' => $v->infinitive,
                'translation' => $v->translation,
            ]);

        return response()->json([
            'data' => $verbs,
        ]);
    }
    /**
     * Display a verb page with mini-tables per tense for the user's target language.
     *
     * Route: GET /verbs/{verb}
     * - {verb} is a numeric ID or an infinitive string. If string, we resolve within target language.
     */
    public function show(Request $request, string $verb)
    {
        $user = Auth::user();
        $targetLanguageId = null;

        if ($user && $user->languagePair) {
            $targetLanguageId = $user->languagePair->target_language_id;
        }

        // Allow overriding via query for testing: ?lang_id=
        if (!$targetLanguageId) {
            $targetLanguageId = (int) $request->query('lang_id', 0) ?: null;
        }

        // Basic guard: require a language context
        abort_unless($targetLanguageId, 404, 'Target language not determined.');

        // Resolve verb by ID or by infinitive within the target language
        $verbModelQuery = Verb::query()->where('language_id', $targetLanguageId);
        if (ctype_digit($verb)) {
            $verbModel = $verbModelQuery->where('id', (int)$verb)->firstOrFail();
        } else {
            $verbModel = $verbModelQuery->where('infinitive', $verb)->firstOrFail();
        }

        // Fetch tenses and pronouns for the target language in defined order
        $tenses = Tense::where('language_id', $targetLanguageId)
            ->orderBy('order_index')
            ->orderBy('name')
            ->get();

        $pronouns = Pronoun::where('language_id', $targetLanguageId)
            ->orderBy('order_index')
            ->orderBy('display')
            ->get();

        // Fetch conjugations for the verb across the selected tenses
        $conjugations = Conjugation::where('verb_id', $verbModel->id)
            ->whereIn('tense_id', $tenses->pluck('id'))
            ->with(['tense:id,name,order_index', 'pronoun:id,display,order_index'])
            ->get()
            ->groupBy(function ($c) {
                return $c->tense_id;
            })
            ->map(function ($byPronoun) {
                return $byPronoun->keyBy('pronoun_id');
            });

        return Inertia::render('Verbs/Show', [
            'verb' => [
                'id' => $verbModel->id,
                'infinitive' => $verbModel->infinitive,
                'translation' => $verbModel->translation,
                'is_irregular' => $verbModel->is_irregular,
            ],
            'tenses' => $tenses->map(fn($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'code' => $t->code,
            ])->values(),
            'pronouns' => $pronouns->map(fn($p) => [
                'id' => $p->id,
                'display' => $p->display,
            ])->values(),
            'conjugations' => $conjugations->map(function ($byPronoun) {
                return $byPronoun->map(function ($c) {
                    return [
                        'pronoun_id' => $c->pronoun_id,
                        'form' => $c->form,
                        'notes' => $c->notes,
                    ];
                })->values();
            }),
        ]);
    }
}
