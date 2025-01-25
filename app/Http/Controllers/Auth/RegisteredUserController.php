<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\LanguagePair;
use App\Services\LanguageService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{

    public function __construct(
        private LanguageService $languageService,
    ) {
    }

    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register', [
            'languagePairs' => LanguagePair::where('is_active', true)
                ->with(['sourceLanguage', 'targetLanguage'])
                ->get()
                ->mapWithKeys(function ($pair) {
                    return [
                        $pair->id => [
                            'id' => $pair->id,
                            'sourceLanguage' => [
                                'code' => $pair->sourceLanguage->code,
                                'name' => $pair->sourceLanguage->name,
                                'flag' => $this->languageService->getFlag($pair->sourceLanguage->code),
                            ],
                            'targetLanguage' => [
                                'code' => $pair->targetLanguage->code,
                                'name' => $pair->targetLanguage->name,
                                'flag' => $this->languageService->getFlag($pair->targetLanguage->code),
                            ],
                        ],
                    ];
                })->all()
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'language_pair_id' => 'required|exists:language_pairs,id',
            // validate redirect_route
            'redirect_route' => ['sometimes', 'string:games.gender-duel.join-from-invite,games.memory-translation.join-from-invite'],
            // validate game_id
            'game_id' => ['required_if:redirect_route,games.gender-duel.join-from-invite,games.memory-translation.join-from-invite|integer'],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'language_pair_id' => $request->language_pair_id,
        ]);

        event(new Registered($user));

        Auth::login($user);
        // Check if we need to redirect to a game
        if ($request->redirect_route && $request->game_id) {
            $paramName = str_contains($request->redirect_route, 'gender-duel') ? 'genderDuelGame' : 'memoryTranslationGame';
            return redirect()->route($request->redirect_route, [
                $paramName => $request->game_id
            ]);
        }

        return redirect(route('dashboard', absolute: false));
    }
}
