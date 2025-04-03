<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\GenderDuelGameController;
use App\Http\Controllers\GuestUserController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\MemoryTranslationGameController;
use App\Http\Controllers\ScoreController;
use App\Http\Controllers\WordSearchPuzzleGameController;
use App\Http\Middleware\EnsurePlayerInGame;
use App\Models\FeatureCategory;
use App\Models\LanguagePair;
use App\Models\Score;
use App\Models\Game;
use App\Models\GenderDuelGame;
use App\Models\MemoryTranslationGame;
use App\Services\LanguageService;
use App\Services\LessonService;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Http\Request;

Route::middleware(['guest'])->group(function () {
    Route::get('/', function (LanguageService $languageService) {
        $locale = app()->getLocale();

        $upcomingFeatures = FeatureCategory::with('features')->get();
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
            'upcomingFeatures' => FeatureCategory::with('features')->get(),
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

    // Guest invitation routes
    Route::get('/games/memory-translation/{memoryTranslationGame}/invite', function ($memoryTranslationGame) {
        $game = MemoryTranslationGame::findOrFail($memoryTranslationGame);
        return Inertia::render('Games/GuestInvitation', [
            'gameName' => 'Memory Translation',
            'gameRoute' => 'games.memory-translation.join-from-invite',
            'gameId' => $game->id,
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'languagePairId' => $game->language_pair_id,
        ]);
    })->name('games.memory-translation.invite');

    Route::get('/games/gender-duel/{genderDuelGame}/invite', function ($genderDuelGame) {
        $game = GenderDuelGame::findOrFail($genderDuelGame);
        return Inertia::render('Games/GuestInvitation', [
            'gameName' => 'Gender Duel',
            'gameRoute' => 'games.gender-duel.join-from-invite',
            'gameId' => $game->id,
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'languagePairId' => $game->language_pair_id,
        ]);
    })->name('games.gender-duel.invite');
});

Route::get('/dashboard', function (LessonService $lessonService) {
    $user = auth()->user();
    $lessons = $lessonService->getLessonsForUser($user);
    $scores = Score::with(['user', 'game'])->orderBy('highest_score', 'desc')
        ->orderBy('total_points', 'desc')
        ->orderBy('winning_streak', 'desc')
        ->limit(10)
        ->get();

    $games = Game::all();

    $user = auth()->user()->load(['languagePair' => function ($query) {
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
        'lessons' => $lessons,
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
        
    // Feedback route
    Route::post('/feedback', [\App\Http\Controllers\FeedbackController::class, 'store'])->name('feedback.store');

    // Game routes
    Route::prefix('games')->middleware(['auth', 'verified'])->group(function () {
        // Gender Duel routes
        Route::prefix('gender-duel')->middleware([App\Http\Middleware\CheckGameAvailability::class])->group(function () {
            Route::get('/', [GenderDuelGameController::class, 'lobby'])->name('games.gender-duel.lobby');
            Route::post('/', [GenderDuelGameController::class, 'create'])->name('games.gender-duel.create');
            Route::get('/practice', [GenderDuelGameController::class, 'practice'])->name('games.gender-duel.practice');
            Route::get('/get-words', [GenderDuelGameController::class, 'getGenderDuelWords'])->name('games.gender-duel.get-words');
            Route::get('/{genderDuelGame}/join-from-invite', [GenderDuelGameController::class, 'joinFromInvite'])->name('games.gender-duel.join-from-invite');
            Route::post('/{genderDuelGame}/join', [GenderDuelGameController::class, 'join'])->name('games.gender-duel.join');
            Route::post('/{genderDuelGame}/ready', [GenderDuelGameController::class, 'ready'])->name('games.gender-duel.ready');
            Route::delete('/{genderDuelGame}/leave', [GenderDuelGameController::class, 'leave'])->name('games.gender-duel.leave');
        });

        // Memory Translation routes
        Route::prefix('memory-translation')->middleware([App\Http\Middleware\CheckGameAvailability::class])->group(function () {
            Route::get('/', [MemoryTranslationGameController::class, 'lobby'])->name('games.memory-translation.lobby');
            Route::post('/create', [MemoryTranslationGameController::class, 'create'])->name('games.memory-translation.create');
            Route::get('/practice', [MemoryTranslationGameController::class, 'practice'])->name('games.memory-translation.practice');
            Route::get('/get-words', [MemoryTranslationGameController::class, 'getMemoryTranslationWords'])->name('games.memory-translation.get-words');
            Route::get('/{memoryTranslationGame}/join-from-invite', [MemoryTranslationGameController::class, 'joinFromInvite'])->name('games.memory-translation.join-from-invite');
            Route::post('/{memoryTranslationGame}/join', [MemoryTranslationGameController::class, 'join'])->name('games.memory-translation.join');
            Route::post('/{memoryTranslationGame}/ready', [MemoryTranslationGameController::class, 'ready'])->name('games.memory-translation.ready');
            Route::delete('/{memoryTranslationGame}/leave', [MemoryTranslationGameController::class, 'leave'])->name('games.memory-translation.leave');
        });

        // Word Puzzle Routes
        Route::prefix('word-search-puzzle')->name('games.word-search-puzzle.')->group(function () {
            Route::get('/', [WordSearchPuzzleGameController::class, 'lobby'])->name('lobby');
            Route::post('/create', [WordSearchPuzzleGameController::class, 'create'])->name('create');
            Route::post('/validate-word', [WordSearchPuzzleGameController::class, 'validateWord'])->name('validate-word');
            Route::post('/found-word', [WordSearchPuzzleGameController::class, 'storeFoundWord']);
            Route::post('{wordSearchPuzzleGame}/join', [WordSearchPuzzleGameController::class, 'join'])->name('join');
            Route::get('/{wordSearchPuzzleGame}/join-from-invite', [WordSearchPuzzleGameController::class, 'joinFromInvite'])->name('join-from-invite');
            Route::post('{wordSearchPuzzleGame}/ready', [WordSearchPuzzleGameController::class, 'ready'])->name('ready');
            Route::delete('{wordSearchPuzzleGame}/leave', [WordSearchPuzzleGameController::class, 'leave'])->name('leave');
            Route::get('/practice', [WordSearchPuzzleGameController::class, 'practice'])->name('practice');
            Route::get('/get-words', [WordSearchPuzzleGameController::class, 'getWords'])->name('get-words');
        });
    });

    // Score routes
    Route::post('/scores/update', [ScoreController::class, 'update'])->name('scores.update');
    Route::post('/scores/update-add-score', [ScoreController::class, 'updateAddScore'])->name('scores.update-add-score');

    // Category routes
    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'index'])->name('categories.index');
    });

    // Lesson routes
    Route::get('/lessons', [LessonController::class, 'index'])->name('lessons.index');
    Route::get('/lessons/progress', [LessonController::class, 'progress'])->name('lessons.progress');
    Route::get('/lessons/search', [LessonController::class, 'search'])->name('lessons.search');
    Route::get('/lessons/{level}/{lesson_number}', [LessonController::class, 'show'])->name('lessons.show');
    Route::post('/lessons/{level}/{lesson_number}/complete', [LessonController::class, 'markComplete'])->name('lessons.complete');

});

// Admin routes
Route::prefix('leng-admon')->name('admin.')->group(function () {
    // Guest routes
    Route::middleware('guest:admin')->group(function () {
        Route::get('/login', [App\Http\Controllers\Admin\Auth\AdminAuthController::class, 'showLogin'])
            ->name('login');
        Route::post('/login', [App\Http\Controllers\Admin\Auth\AdminAuthController::class, 'login']);
    });

    // Authenticated routes
    Route::middleware('auth:admin')->group(function () {
        Route::post('/logout', [App\Http\Controllers\Admin\Auth\AdminAuthController::class, 'logout'])
            ->name('logout');

        // Analytics routes
        Route::get('/feature-analytics', [App\Http\Controllers\Admin\FeatureAnalyticsController::class, 'index'])
            ->name('feature-analytics');
        Route::get('/page-analytics', [App\Http\Controllers\Admin\PageAnalyticsController::class, 'index'])
            ->name('page-analytics');
        Route::get('/feedback-analytics', [App\Http\Controllers\Admin\FeedbackAnalyticsController::class, 'index'])
            ->name('feedback-analytics');
        Route::get('/feedback-analytics/{feedback}', [App\Http\Controllers\Admin\FeedbackAnalyticsController::class, 'show'])
            ->name('feedback-analytics.show');
        Route::patch('/feedback-analytics/{feedback}/status', [App\Http\Controllers\Admin\FeedbackAnalyticsController::class, 'updateStatus'])
            ->name('feedback-analytics.update-status');

        // Users routes
        Route::get('/users', [App\Http\Controllers\Admin\UsersController::class, 'index'])
            ->name('users');
        Route::get('/users/{user}', [App\Http\Controllers\Admin\UsersController::class, 'show'])
            ->name('users.show');
    });
});

// Game show routes - accessible to both guests and authenticated users
Route::prefix('games')->group(function () {
    Route::get('/memory-translation/{memoryTranslationGame:id}', [MemoryTranslationGameController::class, 'show'])
        ->middleware(EnsurePlayerInGame::class)
        ->name('games.memory-translation.show');

    Route::get('/gender-duel/{genderDuelGame:id}', [GenderDuelGameController::class, 'show'])
    ->middleware(EnsurePlayerInGame::class)
    ->name('games.gender-duel.show');

    Route::get('/word-search-puzzle/{wordSearchPuzzleGame:id}', [WordSearchPuzzleGameController::class, 'show'])
    ->middleware(EnsurePlayerInGame::class)
    ->name('games.word-search-puzzle.show');
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
