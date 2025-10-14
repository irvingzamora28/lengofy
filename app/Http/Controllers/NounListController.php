<?php

namespace App\Http\Controllers;

use App\Models\NounList;
use App\Models\NounListItem;
use App\Models\Noun;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NounListController extends Controller
{
    /**
     * Display all noun lists for the current user.
     * GET /noun-lists
     */
    public function index()
    {
        $user = Auth::user();

        $lists = NounList::where('user_id', $user->id)
            ->withCount('items')
            ->orderBy('order_index')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($list) => [
                'id' => $list->id,
                'name' => $list->name,
                'description' => $list->description,
                'items_count' => $list->items_count,
                'created_at' => $list->created_at->toDateTimeString(),
            ]);

        return Inertia::render('Nouns/Lists/Index', [
            'lists' => $lists,
        ]);
    }

    /**
     * Show the form for creating a new noun list.
     * GET /noun-lists/create
     */
    public function create()
    {
        return Inertia::render('Nouns/Lists/Create');
    }

    /**
     * Store a newly created noun list.
     * POST /noun-lists
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $user = Auth::user();

        $list = NounList::create([
            'user_id' => $user->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'order_index' => NounList::where('user_id', $user->id)->max('order_index') + 1,
        ]);

        return redirect()->route('noun-lists.show', $list->id)
            ->with('success', 'List created successfully');
    }

    /**
     * Display a specific noun list with its nouns.
     * GET /noun-lists/{list}
     */
    public function show(Request $request, NounList $list)
    {
        $this->authorize('view', $list);

        $q = trim((string) $request->query('q', ''));
        $perPage = (int) $request->query('per_page', 20);

        $query = $list->items()
            ->with(['noun'])
            ->orderBy('order_index')
            ->orderBy('created_at');

        if ($q !== '') {
            $query->whereHas('noun', function ($sub) use ($q) {
                $sub->where('word', 'like', "%$q%");
            });
        }

        $items = $query->paginate($perPage)->appends($request->query());

        return Inertia::render('Nouns/Lists/Show', [
            'list' => [
                'id' => $list->id,
                'name' => $list->name,
                'description' => $list->description,
                'items_count' => $list->items()->count(),
            ],
            'filters' => [
                'q' => $q,
                'per_page' => $perPage,
            ],
            'nouns' => $items->through(function (NounListItem $item) use ($request) {
                $user = $request->user();
                $sourceLanguageId = null;
                
                if ($user && $user->languagePair) {
                    $sourceLanguageId = $user->languagePair->source_language_id;
                }
                
                $translation = null;
                if ($sourceLanguageId) {
                    $translation = $item->noun->getTranslation((string) $sourceLanguageId);
                }

                return [
                    'id' => $item->noun->id,
                    'word' => $item->noun->word,
                    'translation' => $translation,
                    'gender' => $item->noun->gender,
                    'notes' => $item->notes,
                    'order_index' => $item->order_index,
                ];
            }),
        ]);
    }

    /**
     * Show the form for editing a noun list.
     * GET /noun-lists/{list}/edit
     */
    public function edit(NounList $list)
    {
        $this->authorize('update', $list);

        return Inertia::render('Nouns/Lists/Edit', [
            'list' => [
                'id' => $list->id,
                'name' => $list->name,
                'description' => $list->description,
            ],
        ]);
    }

    /**
     * Update a noun list.
     * PATCH /noun-lists/{list}
     */
    public function update(Request $request, NounList $list)
    {
        $this->authorize('update', $list);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $list->update($data);

        return redirect()->route('noun-lists.show', $list->id)
            ->with('success', 'List updated successfully');
    }

    /**
     * Delete a noun list.
     * DELETE /noun-lists/{list}
     */
    public function destroy(NounList $list)
    {
        $this->authorize('delete', $list);

        $list->delete();

        return redirect()->route('noun-lists.index')
            ->with('success', 'List deleted successfully');
    }

    /**
     * Add a noun to a list.
     * POST /noun-lists/{list}/nouns
     */
    public function addNoun(Request $request, NounList $list)
    {
        $this->authorize('update', $list);

        $data = $request->validate([
            'noun_id' => ['required', 'integer', 'exists:nouns,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $noun = Noun::findOrFail($data['noun_id']);

        // Check if already in list
        $existing = NounListItem::where('noun_list_id', $list->id)
            ->where('noun_id', $noun->id)
            ->first();

        if ($existing) {
            return back()->with('info', 'Noun already in this list');
        }

        $maxOrder = NounListItem::where('noun_list_id', $list->id)->max('order_index') ?? 0;

        NounListItem::create([
            'noun_list_id' => $list->id,
            'noun_id' => $noun->id,
            'order_index' => $maxOrder + 1,
            'notes' => $data['notes'] ?? null,
        ]);

        return back()->with('success', 'Noun added to list');
    }

    /**
     * Add multiple nouns to a list.
     * POST /noun-lists/{list}/nouns/bulk
     */
    public function bulkAddNouns(Request $request, NounList $list)
    {
        $this->authorize('update', $list);

        $data = $request->validate([
            'noun_ids' => ['required', 'array'],
            'noun_ids.*' => ['integer', 'exists:nouns,id'],
        ]);

        $maxOrder = NounListItem::where('noun_list_id', $list->id)->max('order_index') ?? 0;
        $added = 0;

        foreach (array_unique($data['noun_ids']) as $nounId) {
            $existing = NounListItem::where('noun_list_id', $list->id)
                ->where('noun_id', $nounId)
                ->first();

            if (!$existing) {
                NounListItem::create([
                    'noun_list_id' => $list->id,
                    'noun_id' => $nounId,
                    'order_index' => ++$maxOrder,
                ]);
                $added++;
            }
        }

        return back()->with('success', "Added {$added} noun(s) to list");
    }

    /**
     * Remove a noun from a list.
     * DELETE /noun-lists/{list}/nouns/{noun}
     */
    public function removeNoun(NounList $list, Noun $noun)
    {
        $this->authorize('update', $list);

        NounListItem::where('noun_list_id', $list->id)
            ->where('noun_id', $noun->id)
            ->delete();

        return back()->with('success', 'Noun removed from list');
    }

    /**
     * Update a noun's notes in a list.
     * PATCH /noun-lists/{list}/nouns/{noun}
     */
    public function updateNounNotes(Request $request, NounList $list, Noun $noun)
    {
        $this->authorize('update', $list);

        $data = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $item = NounListItem::where('noun_list_id', $list->id)
            ->where('noun_id', $noun->id)
            ->firstOrFail();

        $item->update(['notes' => $data['notes']]);

        return back()->with('success', 'Notes updated');
    }

    /**
     * Get all lists for the current user (JSON).
     * GET /api/noun-lists
     */
    public function apiIndex()
    {
        $user = Auth::user();

        $lists = NounList::where('user_id', $user->id)
            ->withCount('items')
            ->orderBy('order_index')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($list) => [
                'id' => $list->id,
                'name' => $list->name,
                'description' => $list->description,
                'items_count' => $list->items_count,
            ]);

        return response()->json(['data' => $lists]);
    }

    /**
     * Get lists that contain a specific noun (JSON).
     * GET /api/nouns/{noun}/lists
     */
    public function getNounLists(Noun $noun)
    {
        $user = Auth::user();

        $allLists = NounList::where('user_id', $user->id)
            ->orderBy('order_index')
            ->orderBy('created_at', 'desc')
            ->get();

        $nounListIds = NounListItem::where('noun_id', $noun->id)
            ->whereIn('noun_list_id', $allLists->pluck('id'))
            ->pluck('noun_list_id')
            ->all();

        $lists = $allLists->map(fn($list) => [
            'id' => $list->id,
            'name' => $list->name,
            'description' => $list->description,
            'contains_noun' => in_array($list->id, $nounListIds, true),
        ]);

        return response()->json(['data' => $lists]);
    }
}
