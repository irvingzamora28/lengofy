<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\GameController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Game routes
Route::get('/games', [GameController::class, 'lobby'])->name('games.lobby');
Route::post('/games', [GameController::class, 'create'])->name('games.create');
Route::get('/games/{game}', [GameController::class, 'show'])->name('games.show');
Route::post('/games/{game}/ready', [GameController::class, 'ready'])->name('games.ready');
Route::post('/games/{game}/submit', [GameController::class, 'submit'])->name('games.submit');
Route::post('/games/{game}/join', [GameController::class, 'join'])->name('games.join');
Route::delete('/games/{game}/leave', [GameController::class, 'leave'])->name('games.leave');

require __DIR__.'/auth.php';
