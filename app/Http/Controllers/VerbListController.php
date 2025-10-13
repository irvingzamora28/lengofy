<?php

namespace App\Http\Controllers;

use App\Models\VerbList;
use App\Models\VerbListItem;
use App\Models\Verb;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class VerbListController extends Controller
{
    /**
     * Display all verb lists for the current user.
     * GET /verb-lists
     */
    public function index()
    {
        $user = Auth::user();
        
        $lists = VerbList::where('user_id', $user->id)
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

        return Inertia::render('Verbs/Lists/Index', [
            'lists' => $lists,
        ]);
    }

    /**
     * Show the form for creating a new verb list.
     * GET /verb-lists/create
     */
    public function create()
    {
        return Inertia::render('Verbs/Lists/Create');
    }

    /**
     * Store a newly created verb list.
     * POST /verb-lists
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $user = Auth::user();
        
        $list = VerbList::create([
            'user_id' => $user->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'order_index' => VerbList::where('user_id', $user->id)->max('order_index') + 1,
        ]);

        return redirect()->route('verb-lists.show', $list->id)
            ->with('success', 'List created successfully');
    }

    /**
     * Display a specific verb list with its verbs.
     * GET /verb-lists/{list}
     */
    public function show(Request $request, VerbList $list)
    {
        $this->authorize('view', $list);

        $q = trim((string) $request->query('q', ''));
        $perPage = (int) $request->query('per_page', 20);

        $query = $list->items()
            ->with(['verb:id,infinitive,translation,language_id'])
            ->orderBy('order_index')
            ->orderBy('created_at');

        if ($q !== '') {
            $query->whereHas('verb', function ($sub) use ($q) {
                $sub->where('infinitive', 'like', "%$q%")
                    ->orWhere('translation', 'like', "%$q%");
            });
        }

        $items = $query->paginate($perPage)->appends($request->query());

        return Inertia::render('Verbs/Lists/Show', [
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
            'verbs' => $items->through(function (VerbListItem $item) {
                return [
                    'id' => $item->verb->id,
                    'infinitive' => $item->verb->infinitive,
                    'translation' => $item->verb->translation,
                    'notes' => $item->notes,
                    'order_index' => $item->order_index,
                ];
            }),
        ]);
    }

    /**
     * Show the form for editing a verb list.
     * GET /verb-lists/{list}/edit
     */
    public function edit(VerbList $list)
    {
        $this->authorize('update', $list);

        return Inertia::render('Verbs/Lists/Edit', [
            'list' => [
                'id' => $list->id,
                'name' => $list->name,
                'description' => $list->description,
            ],
        ]);
    }

    /**
     * Update a verb list.
     * PATCH /verb-lists/{list}
     */
    public function update(Request $request, VerbList $list)
    {
        $this->authorize('update', $list);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $list->update($data);

        return redirect()->route('verb-lists.show', $list->id)
            ->with('success', 'List updated successfully');
    }

    /**
     * Delete a verb list.
     * DELETE /verb-lists/{list}
     */
    public function destroy(VerbList $list)
    {
        $this->authorize('delete', $list);

        $list->delete();

        return redirect()->route('verb-lists.index')
            ->with('success', 'List deleted successfully');
    }

    /**
     * Add a verb to a list.
     * POST /verb-lists/{list}/verbs
     */
    public function addVerb(Request $request, VerbList $list)
    {
        $this->authorize('update', $list);

        $data = $request->validate([
            'verb_id' => ['required', 'integer', 'exists:verbs,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $verb = Verb::findOrFail($data['verb_id']);

        // Check if already in list
        $existing = VerbListItem::where('verb_list_id', $list->id)
            ->where('verb_id', $verb->id)
            ->first();

        if ($existing) {
            return back()->with('info', 'Verb already in this list');
        }

        $maxOrder = VerbListItem::where('verb_list_id', $list->id)->max('order_index') ?? 0;

        VerbListItem::create([
            'verb_list_id' => $list->id,
            'verb_id' => $verb->id,
            'order_index' => $maxOrder + 1,
            'notes' => $data['notes'] ?? null,
        ]);

        return back()->with('success', 'Verb added to list');
    }

    /**
     * Add multiple verbs to a list.
     * POST /verb-lists/{list}/verbs/bulk
     */
    public function bulkAddVerbs(Request $request, VerbList $list)
    {
        $this->authorize('update', $list);

        $data = $request->validate([
            'verb_ids' => ['required', 'array'],
            'verb_ids.*' => ['integer', 'exists:verbs,id'],
        ]);

        $maxOrder = VerbListItem::where('verb_list_id', $list->id)->max('order_index') ?? 0;
        $added = 0;

        foreach (array_unique($data['verb_ids']) as $verbId) {
            $existing = VerbListItem::where('verb_list_id', $list->id)
                ->where('verb_id', $verbId)
                ->first();

            if (!$existing) {
                VerbListItem::create([
                    'verb_list_id' => $list->id,
                    'verb_id' => $verbId,
                    'order_index' => ++$maxOrder,
                ]);
                $added++;
            }
        }

        return back()->with('success', "Added {$added} verb(s) to list");
    }

    /**
     * Remove a verb from a list.
     * DELETE /verb-lists/{list}/verbs/{verb}
     */
    public function removeVerb(VerbList $list, Verb $verb)
    {
        $this->authorize('update', $list);

        VerbListItem::where('verb_list_id', $list->id)
            ->where('verb_id', $verb->id)
            ->delete();

        return back()->with('success', 'Verb removed from list');
    }

    /**
     * Update a verb's notes in a list.
     * PATCH /verb-lists/{list}/verbs/{verb}
     */
    public function updateVerbNotes(Request $request, VerbList $list, Verb $verb)
    {
        $this->authorize('update', $list);

        $data = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $item = VerbListItem::where('verb_list_id', $list->id)
            ->where('verb_id', $verb->id)
            ->firstOrFail();

        $item->update(['notes' => $data['notes']]);

        return back()->with('success', 'Notes updated');
    }

    /**
     * Get all lists for the current user (JSON).
     * GET /api/verb-lists
     */
    public function apiIndex()
    {
        $user = Auth::user();
        
        $lists = VerbList::where('user_id', $user->id)
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
     * Get lists that contain a specific verb (JSON).
     * GET /api/verbs/{verb}/lists
     */
    public function getVerbLists(Verb $verb)
    {
        $user = Auth::user();
        
        $allLists = VerbList::where('user_id', $user->id)
            ->orderBy('order_index')
            ->orderBy('created_at', 'desc')
            ->get();

        $verbListIds = VerbListItem::where('verb_id', $verb->id)
            ->whereIn('verb_list_id', $allLists->pluck('id'))
            ->pluck('verb_list_id')
            ->all();

        $lists = $allLists->map(fn($list) => [
            'id' => $list->id,
            'name' => $list->name,
            'description' => $list->description,
            'contains_verb' => in_array($list->id, $verbListIds, true),
        ]);

        return response()->json(['data' => $lists]);
    }
}
