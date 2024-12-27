<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\GenderDuelGameController;
use App\Http\Controllers\GuestUserController;
use App\Http\Controllers\Auth\GuestController;
use App\Http\Controllers\ScoreController;
use App\Models\LanguagePair;
use App\Models\Score;
use App\Services\LanguageService;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Http\Request;

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

Route::get('/dashboard', function () {
    $scores = Score::with(['user', 'game'])->orderBy('highest_score', 'desc')
        ->orderBy('total_points', 'desc')
        ->orderBy('winning_streak', 'desc')
        ->limit(10)
        ->get();
    return Inertia::render('Dashboard', [
        'scores' => $scores,
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/game-settings/{redirectRoute?}', [ProfileController::class, 'updateGameSettings'])
        ->name('profile.game-settings.update');

    // Game routes
    Route::prefix('games/gender-duel')->group(function () {
        Route::get('/', [GenderDuelGameController::class, 'lobby'])->name('games.gender-duel.lobby');
        Route::post('/', [GenderDuelGameController::class, 'create'])->name('games.gender-duel.create');
        Route::post('/practice', [GenderDuelGameController::class, 'practice'])->name('games.gender-duel.practice');
        Route::get('/{genderDuelGame}', [GenderDuelGameController::class, 'show'])->name('games.gender-duel.show');
        Route::post('/{genderDuelGame}/join', [GenderDuelGameController::class, 'join'])->name('games.gender-duel.join');
        Route::post('/{genderDuelGame}/ready', [GenderDuelGameController::class, 'ready'])->name('games.gender-duel.ready');
        Route::delete('/{genderDuelGame}/leave', [GenderDuelGameController::class, 'leave'])->name('games.gender-duel.leave');
    });

    // Score routes
    Route::post('/scores/update', [ScoreController::class, 'update']);
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

require __DIR__.'/auth.php';
