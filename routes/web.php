<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\GenderDuelGameController;
use App\Http\Controllers\GuestUserController;
use App\Http\Controllers\Auth\GuestController;
use App\Models\LanguagePair;
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
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/game-settings', [ProfileController::class, 'updateGameSettings'])
        ->name('profile.game-settings.update');

    // Game routes
    Route::get('/games/gender-duel', [GenderDuelGameController::class, 'lobby'])->name('games.gender-duel.lobby');
    Route::post('/games/gender-duel', [GenderDuelGameController::class, 'create'])->name('games.gender-duel.create');
    Route::get('/games/gender-duel/{genderDuelGame}', [GenderDuelGameController::class, 'show'])->name('games.gender-duel.show');
    Route::post('/games/gender-duel/{genderDuelGame}/ready', [GenderDuelGameController::class, 'ready'])->name('games.gender-duel.ready');
    Route::post('/games/gender-duel/{genderDuelGame}/join', [GenderDuelGameController::class, 'join'])->name('games.gender-duel.join');
    Route::delete('/games/gender-duel/{genderDuelGame}/leave', [GenderDuelGameController::class, 'leave'])->name('games.gender-duel.leave');
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
