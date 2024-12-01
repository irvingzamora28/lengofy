<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\GameController;
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
    Route::get('/games', [GameController::class, 'lobby'])->name('games.lobby');
    Route::post('/games', [GameController::class, 'create'])->name('games.create');
    Route::get('/games/{game}', [GameController::class, 'show'])->name('games.show');
    Route::post('/games/{game}/ready', [GameController::class, 'ready'])->name('games.ready');
    Route::post('/games/{game}/submit', [GameController::class, 'submit'])->name('games.submit');
    Route::post('/games/{game}/join', [GameController::class, 'join'])->name('games.join');
    Route::delete('/games/{game}/leave', [GameController::class, 'leave'])->name('games.leave');
});

// Guest user routes
Route::post('/guest/create', [GuestUserController::class, 'createAndLogin'])->name('guest.create');
Route::post('/guest/convert', [GuestUserController::class, 'convertToRegular'])->name('guest.convert');
Route::post('/guest/reclaim', [GuestUserController::class, 'reclaim'])->name('guest.reclaim');
Route::delete('/guest/logout', [GuestUserController::class, 'logout'])->name('guest.logout');

require __DIR__.'/auth.php';
