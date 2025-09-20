<?php

namespace App\Http\Controllers;

use App\Models\UserNoun;
use App\Models\Noun;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserNounController extends Controller
{
    // GET /my-nouns
    public function index(Request $request)
    {
        $user = Auth::user();
        $q = trim((string) $request->query('q', ''));
        $sort = (string) $request->query('sort', 'recent'); // recent|priority|alpha
        $perPage = (int) $request->query('per_page', 20);

        $builder = UserNoun::query()
            ->with(['noun:id,word,gender,language_id'])
            ->where('user_id', $user->id);

        if ($q !== '') {
            $builder->whereHas('noun', function ($sub) use ($q) {
                $sub->where('word', 'like', "%$q%");
            });
        }

        if ($sort === 'priority') {
            $builder->orderByRaw('CASE WHEN priority IS NULL THEN 1 ELSE 0 END')
                    ->orderBy('priority');
        } elseif ($sort === 'alpha') {
            $builder->join('nouns', 'nouns.id', '=', 'user_nouns.noun_id')
                    ->orderBy('nouns.word')
                    ->select('user_nouns.*');
        } else { // recent
            $builder->latest('user_nouns.created_at');
        }

        $paginator = $builder->paginate($perPage)->appends($request->query());

        return Inertia::render('Nouns/MyNouns', [
            'filters' => [ 'q' => $q, 'sort' => $sort, 'per_page' => $perPage ],
            'nouns' => [
                'data' => $paginator->getCollection()->map(function (UserNoun $un) {
                    return [
                        'id' => $un->noun->id,
                        'word' => $un->noun->word,
                        'gender' => $un->noun->gender,
                        'is_favorite' => true,
                        'priority' => $un->priority,
                        'notes' => $un->notes,
                    ];
                })->values(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'links' => $paginator->linkCollection(),
                ],
            ],
        ]);
    }

    // POST /nouns/{noun}/favorite
    public function favorite(Request $request, $noun)
    {
        $user = Auth::user();
        $nounModel = Noun::findOrFail($noun);
        UserNoun::firstOrCreate([
            'user_id' => $user->id,
            'noun_id' => $nounModel->id,
        ]);
        return back()->with('success', 'Added to My Nouns');
    }

    // DELETE /nouns/{noun}/favorite
    public function unfavorite(Request $request, $noun)
    {
        $user = Auth::user();
        $nounModel = Noun::findOrFail($noun);
        UserNoun::where('user_id', $user->id)->where('noun_id', $nounModel->id)->delete();
        return back()->with('success', 'Removed from My Nouns');
    }

    // PATCH /my-nouns/{noun}
    public function update(Request $request, $noun)
    {
        $data = $request->validate([
            'priority' => ['nullable', 'integer', 'between:1,5'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);
        $user = Auth::user();
        $nounModel = Noun::findOrFail($noun);
        $un = UserNoun::firstOrCreate([
            'user_id' => $user->id,
            'noun_id' => $nounModel->id,
        ]);
        $un->fill($data);
        $un->save();
        return back()->with('success', 'Updated');
    }

    // POST /my-nouns/bulk-add { noun_ids: number[] }
    public function bulkAdd(Request $request)
    {
        $payload = $request->validate([
            'noun_ids' => ['required', 'array'],
            'noun_ids.*' => ['integer', 'exists:nouns,id'],
        ]);
        $userId = Auth::id();
        foreach (array_unique($payload['noun_ids']) as $id) {
            UserNoun::firstOrCreate(['user_id' => $userId, 'noun_id' => $id]);
        }
        return back()->with('success', 'Added nouns');
    }
}
