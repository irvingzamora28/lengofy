<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\GenderDuelGameController;
use App\Http\Controllers\GuestUserController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\MemoryTranslationGameController;
use App\Http\Controllers\ScoreController;
use App\Models\LanguagePair;
use App\Models\Score;
use App\Models\Game;
use App\Services\LanguageService;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Http\Request;

Route::middleware(['guest'])->group(function () {
    Route::get('/', function (LanguageService $languageService) {
        $locale = app()->getLocale();
        return Inertia::render('Welcome', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'laravelVersion' => Application::VERSION,
            'phpVersion' => PHP_VERSION,
            'languagePairs' => LanguagePair::where('is_active', true)
                ->with(['sourceLanguage', 'targetLanguage'])
                ->get()
                ->mapWithKeys(function ($pair) use ($languageService) {
                    return [
                        $pair->id => [
                            'id' => $pair->id,
                            'sourceLanguage' => [
                                'code' => $pair->sourceLanguage->code,
                                'name' => $pair->sourceLanguage->name,
                                'flag' => $languageService->getFlag($pair->sourceLanguage->code),
                            ],
                            'targetLanguage' => [
                                'code' => $pair->targetLanguage->code,
                                'name' => $pair->targetLanguage->name,
                                'flag' => $languageService->getFlag($pair->targetLanguage->code),
                            ],
                        ],
                    ];
                })->all(),
            'translations' => [
                'welcome' => __('welcome', [], $locale)
            ],
            'locale' => $locale
        ]);
    })->name('welcome');

    Route::get('/gender-duel', function (LanguageService $languageService) {
        $locale = app()->getLocale();
        return Inertia::render('GenderDuelGame/Landing', [
            'languagePairs' => LanguagePair::where('is_active', true)
                ->with(['sourceLanguage', 'targetLanguage'])
                ->get()
                ->mapWithKeys(function ($pair) use ($languageService) {
                    return [
                        $pair->id => [
                            'id' => $pair->id,
                            'sourceLanguage' => [
                                'code' => $pair->sourceLanguage->code,
                                'name' => $pair->sourceLanguage->name,
                                'flag' => $languageService->getFlag($pair->sourceLanguage->code),
                            ],
                            'targetLanguage' => [
                                'code' => $pair->targetLanguage->code,
                                'name' => $pair->targetLanguage->name,
                                'flag' => $languageService->getFlag($pair->targetLanguage->code),
                            ],
                        ],
                    ];
                })->all(),
            'locale' => $locale
        ]);
    })->name('gender-duel.play');

    Route::get('/memory-translation', function (LanguageService $languageService) {
        $locale = app()->getLocale();
        return Inertia::render('MemoryTranslationGame/Landing', [
            'languagePairs' => LanguagePair::where('is_active', true)
                ->with(['sourceLanguage', 'targetLanguage'])
                ->get()
                ->mapWithKeys(function ($pair) use ($languageService) {
                    return [
                        $pair->id => [
                            'id' => $pair->id,
                            'sourceLanguage' => [
                                'code' => $pair->sourceLanguage->code,
                                'name' => $pair->sourceLanguage->name,
                                'flag' => $languageService->getFlag($pair->sourceLanguage->code),
                            ],
                            'targetLanguage' => [
                                'code' => $pair->targetLanguage->code,
                                'name' => $pair->targetLanguage->name,
                                'flag' => $languageService->getFlag($pair->targetLanguage->code),
                            ],
                        ],
                    ];
                })->all(),
            'locale' => $locale
        ]);
    })->name('memory-translation.play');
});

Route::get('/dashboard', function () {
    $scores = Score::with(['user', 'game'])->orderBy('highest_score', 'desc')
        ->orderBy('total_points', 'desc')
        ->orderBy('winning_streak', 'desc')
        ->limit(10)
        ->get();

    $games = Game::all();

    $user = auth()->user()->load(['languagePair' => function($query) {
        $query->with(['sourceLanguage:id,code,name', 'targetLanguage:id,code,name']);
    }]);

    return Inertia::render('Dashboard', [
        'scores' => $scores,
        'games' => $games,
        'auth' => [
            'user' => array_merge($user->toArray(), [
                'language_pair' => $user->languagePair ? [
                    'id' => $user->languagePair->id,
                    'sourceLanguage' => $user->languagePair->sourceLanguage,
                    'targetLanguage' => $user->languagePair->targetLanguage,
                ] : null
            ])
        ],
        'flash' => [
            'error' => session('error'),
            'success' => session('success'),
        ],
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/game-settings/{redirectRoute?}', [ProfileController::class, 'updateGameSettings'])
        ->name('profile.game-settings.update');

    // Game routes
    Route::prefix('games')->middleware(['auth', 'verified'])->group(function () {
        // Gender Duel routes
        Route::prefix('gender-duel')->middleware([App\Http\Middleware\CheckGameAvailability::class])->group(function () {
            Route::get('/', [GenderDuelGameController::class, 'lobby'])->name('games.gender-duel.lobby');
            Route::post('/', [GenderDuelGameController::class, 'create'])->name('games.gender-duel.create');
            Route::get('/practice', [GenderDuelGameController::class, 'practice'])->name('games.gender-duel.practice');
            Route::get('/get-words', [GenderDuelGameController::class, 'getGenderDuelWords'])->name('games.gender-duel.get-words');
            Route::get('/{genderDuelGame}', [GenderDuelGameController::class, 'show'])->name('games.gender-duel.show');
            Route::post('/{genderDuelGame}/join', [GenderDuelGameController::class, 'join'])->name('games.gender-duel.join');
            Route::post('/{genderDuelGame}/ready', [GenderDuelGameController::class, 'ready'])->name('games.gender-duel.ready');
        });

        // Memory Translation routes
        Route::prefix('memory-translation')->middleware([App\Http\Middleware\CheckGameAvailability::class])->group(function () {
            Route::get('/', [MemoryTranslationGameController::class, 'lobby'])->name('games.memory-translation.lobby');
            Route::get('/play', [MemoryTranslationGameController::class, 'play'])->name('games.memory-translation.play');
        });
    });

    // Score routes
    Route::post('/scores/update', [ScoreController::class, 'update'])->name('scores.update');
    Route::post('/scores/update-add-score', [ScoreController::class, 'updateAddScore'])->name('scores.update-add-score');

    // Category routes
    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'index'])->name('categories.index');
    });
});

// Guest user routes
Route::post('/guest/create', [GuestUserController::class, 'createAndLogin'])->name('guest.create');
Route::post('/guest/convert', [GuestUserController::class, 'convertToRegular'])->name('guest.convert');
Route::post('/guest/reclaim', [GuestUserController::class, 'reclaim'])->name('guest.reclaim');
Route::delete('/guest/logout', [GuestUserController::class, 'logout'])->name('guest.logout');

// Language switcher route
Route::post('/language/switch', function (Request $request) {
    $request->validate([
        'locale' => 'required|in:en,es,de'
    ]);

    // Store the language preference in the session
    session(['locale' => $request->locale]);

    // Optional: Store in a cookie for persistence
    return redirect()->back()->cookie('locale', $request->locale, 60 * 24 * 365);
})->name('language.switch');

require __DIR__ . '/auth.php';
