<?php

namespace App\Http\Controllers;

use App\Models\UserVerb;
use App\Models\Verb;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserVerbController extends Controller
{
    // GET /my-verbs
    public function index(Request $request)
    {
        $user = Auth::user();
        $q = trim((string) $request->query('q', ''));
        $sort = (string) $request->query('sort', 'recent'); // recent|priority|alpha
        $perPage = (int) $request->query('per_page', 20);

        $builder = UserVerb::query()
            ->with(['verb:id,infinitive,translation,language_id'])
            ->where('user_id', $user->id);

        if ($q !== '') {
            $builder->whereHas('verb', function ($sub) use ($q) {
                $sub->where('infinitive', 'like', "%$q%")
                    ->orWhere('translation', 'like', "%$q%");
            });
        }

        if ($sort === 'priority') {
            $builder->orderByRaw('CASE WHEN priority IS NULL THEN 1 ELSE 0 END')
                    ->orderBy('priority');
        } elseif ($sort === 'alpha') {
            $builder->join('verbs', 'verbs.id', '=', 'user_verbs.verb_id')
                    ->orderBy('verbs.infinitive')
                    ->select('user_verbs.*');
        } else { // recent
            $builder->latest('user_verbs.created_at');
        }

        $items = $builder->paginate($perPage)->appends($request->query());

        return Inertia::render('Verbs/MyVerbs', [
            'filters' => [ 'q' => $q, 'sort' => $sort, 'per_page' => $perPage ],
            'verbs' => $items->through(function (UserVerb $uv) {
                return [
                    'id' => $uv->verb->id,
                    'infinitive' => $uv->verb->infinitive,
                    'translation' => $uv->verb->translation,
                    'is_favorite' => true,
                    'priority' => $uv->priority,
                    'notes' => $uv->notes,
                ];
            }),
        ]);
    }

    // POST /verbs/{verb}/favorite
    public function favorite(Request $request, $verb)
    {
        $user = Auth::user();
        $verbModel = Verb::findOrFail($verb);
        UserVerb::firstOrCreate([
            'user_id' => $user->id,
            'verb_id' => $verbModel->id,
        ]);
        return back()->with('success', 'Added to My Verbs');
    }

    // DELETE /verbs/{verb}/favorite
    public function unfavorite(Request $request, $verb)
    {
        $user = Auth::user();
        $verbModel = Verb::findOrFail($verb);
        UserVerb::where('user_id', $user->id)->where('verb_id', $verbModel->id)->delete();
        return back()->with('success', 'Removed from My Verbs');
    }

    // PATCH /my-verbs/{verb}
    public function update(Request $request, $verb)
    {
        $data = $request->validate([
            'priority' => ['nullable', 'integer', 'between:1,5'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);
        $user = Auth::user();
        $verbModel = Verb::findOrFail($verb);
        $uv = UserVerb::firstOrCreate([
            'user_id' => $user->id,
            'verb_id' => $verbModel->id,
        ]);
        $uv->fill($data);
        $uv->save();
        return back()->with('success', 'Updated');
    }

    // POST /my-verbs/bulk-add { verb_ids: number[] }
    public function bulkAdd(Request $request)
    {
        $payload = $request->validate([
            'verb_ids' => ['required', 'array'],
            'verb_ids.*' => ['integer', 'exists:verbs,id'],
        ]);
        $userId = Auth::id();
        foreach (array_unique($payload['verb_ids']) as $id) {
            UserVerb::firstOrCreate(['user_id' => $userId, 'verb_id' => $id]);
        }
        return back()->with('success', 'Added verbs');
    }
}
