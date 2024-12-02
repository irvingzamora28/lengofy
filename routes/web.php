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

Route::get('/', function (LanguageService $languageService) {
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
    ]);
})->name('welcome');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Game routes
    Route::get('/gender-duel-game', [GenderDuelGameController::class, 'lobby'])->name('gender-duel-game.lobby');
    Route::post('/gender-duel-game', [GenderDuelGameController::class, 'create'])->name('gender-duel-game.create');
    Route::get('/gender-duel-game/{genderDuelGame}', [GenderDuelGameController::class, 'show'])->name('gender-duel-game.show');
    Route::post('/gender-duel-game/{genderDuelGame}/ready', [GenderDuelGameController::class, 'ready'])->name('gender-duel-game.ready');
    Route::post('/gender-duel-game/{genderDuelGame}/join', [GenderDuelGameController::class, 'join'])->name('gender-duel-game.join');
    Route::delete('/gender-duel-game/{genderDuelGame}/leave', [GenderDuelGameController::class, 'leave'])->name('gender-duel-game.leave');
});

// Guest user routes
Route::post('/guest/create', [GuestUserController::class, 'createAndLogin'])->name('guest.create');
Route::post('/guest/convert', [GuestUserController::class, 'convertToRegular'])->name('guest.convert');
Route::post('/guest/reclaim', [GuestUserController::class, 'reclaim'])->name('guest.reclaim');
Route::delete('/guest/logout', [GuestUserController::class, 'logout'])->name('guest.logout');

require __DIR__.'/auth.php';
