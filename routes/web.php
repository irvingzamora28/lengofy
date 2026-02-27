<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\GenderDuelGameController;
use App\Http\Controllers\DerbyGameController;
use App\Http\Controllers\VerbConjugationSlotGameController;
use App\Http\Controllers\GuestUserController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\MemoryTranslationGameController;
use App\Http\Controllers\ScoreController;
use App\Http\Controllers\WordSearchPuzzleGameController;
use App\Http\Controllers\VerbConjugationController;
use App\Http\Controllers\UserVerbController;
use App\Http\Controllers\VerbListController;
use App\Http\Controllers\NounController;
use App\Http\Controllers\UserNounController;
use App\Http\Controllers\NounListController;
use App\Http\Middleware\EnsurePlayerInGame;
use App\Models\FeatureCategory;
use App\Models\LanguagePair;
use App\Models\Score;
use App\Models\Game;
use App\Models\GenderDuelGame;
use App\Models\VerbConjugationSlotGame;
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

    Route::get('/verb-conjugation-slot', function (LanguageService $languageService) {
        $locale = app()->getLocale();
        return Inertia::render('VerbConjugationSlotGame/Landing', [
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
    })->name('verb-conjugation-slot.play');

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

    Route::get('/games/verb-conjugation-slot/{verbConjugationSlotGame}/invite', function ($verbConjugationSlotGame) {
        $game = VerbConjugationSlotGame::findOrFail($verbConjugationSlotGame);
        return Inertia::render('Games/GuestInvitation', [
            'gameName' => 'Verb Conjugation Slot Machine',
            'gameRoute' => 'games.verb-conjugation-slot.join-from-invite',
            'gameId' => $game->id,
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'languagePairId' => $game->language_pair_id,
        ]);
    })->name('games.verb-conjugation-slot.invite');
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
        'lessons' => $lessons ?? [],
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
            Route::post('/{genderDuelGame}/end', [GenderDuelGameController::class, 'end'])->name('games.gender-duel.end');
            Route::get('/get-words', [GenderDuelGameController::class, 'getGenderDuelWords'])->name('games.gender-duel.get-words');
            Route::get('/{genderDuelGame}/join-from-invite', [GenderDuelGameController::class, 'joinFromInvite'])->name('games.gender-duel.join-from-invite');
            Route::post('/{genderDuelGame}/join', [GenderDuelGameController::class, 'join'])->name('games.gender-duel.join');
            Route::post('/{genderDuelGame}/ready', [GenderDuelGameController::class, 'ready'])->name('games.gender-duel.ready');
            Route::delete('/{genderDuelGame}/leave', [GenderDuelGameController::class, 'leave'])->name('games.gender-duel.leave');
        });

        // Derby (Horse Race) routes
        Route::prefix('derby')->middleware([App\Http\Middleware\CheckGameAvailability::class])->group(function () {
            Route::get('/', [DerbyGameController::class, 'lobby'])->name('games.derby.lobby');
            Route::post('/', [DerbyGameController::class, 'create'])->name('games.derby.create');
            Route::get('/practice', [DerbyGameController::class, 'practice'])->name('games.derby.practice');
            Route::post('/{derbyGame}/end', [DerbyGameController::class, 'end'])->name('games.derby.end');
            Route::get('/{derbyGame}/join-from-invite', [DerbyGameController::class, 'joinFromInvite'])->name('games.derby.join-from-invite');
            Route::post('/{derbyGame}/join', [DerbyGameController::class, 'join'])->name('games.derby.join');
            Route::post('/{derbyGame}/ready', [DerbyGameController::class, 'ready'])->name('games.derby.ready');
            Route::delete('/{derbyGame}/leave', [DerbyGameController::class, 'leave'])->name('games.derby.leave');
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
            Route::post('/{memoryTranslationGame}/end', [MemoryTranslationGameController::class, 'end'])->name('games.memory-translation.end');
        });

        // Word Puzzle Routes
        Route::prefix('word-search-puzzle')->name('games.word-search-puzzle.')->group(function () {
            Route::get('/', [WordSearchPuzzleGameController::class, 'lobby'])->name('lobby');
            Route::post('/create', [WordSearchPuzzleGameController::class, 'create'])->name('create');
            Route::post('/validate-word', [WordSearchPuzzleGameController::class, 'validateWord'])->name('validate-word');
            Route::post('/found-word', [WordSearchPuzzleGameController::class, 'storeFoundWord']);
            Route::post('{wordSearchPuzzleGame}/join', [WordSearchPuzzleGameController::class, 'join'])->name('join');
            Route::get('/{wordSearchPuzzleGame}/join-from-invite', [WordSearchPuzzleGameController::class, 'joinFromInvite'])->name('join-from-invite');
            Route::post('/{wordSearchPuzzleGame}/ready', [WordSearchPuzzleGameController::class, 'ready'])->name('ready');
            Route::delete('/{wordSearchPuzzleGame}/leave', [WordSearchPuzzleGameController::class, 'leave'])->name('leave');
            Route::post('/{wordSearchPuzzleGame}/end', [WordSearchPuzzleGameController::class, 'end'])->name('end');
            Route::get('/practice', [WordSearchPuzzleGameController::class, 'practice'])->name('practice');
            Route::get('/get-words', [WordSearchPuzzleGameController::class, 'getWords'])->name('get-words');
        });

        // Verb Conjugation Slot Machine routes
        Route::prefix('verb-conjugation-slot')->middleware([App\Http\Middleware\CheckGameAvailability::class])->group(function () {
            Route::get('/', [VerbConjugationSlotGameController::class, 'lobby'])->name('games.verb-conjugation-slot.lobby');
            Route::post('/', [VerbConjugationSlotGameController::class, 'create'])->name('games.verb-conjugation-slot.create');
            Route::get('/practice', [VerbConjugationSlotGameController::class, 'practice'])->name('games.verb-conjugation-slot.practice');
            Route::get('/get-prompts', [VerbConjugationSlotGameController::class, 'getPrompts'])->name('games.verb-conjugation-slot.get-prompts');
            Route::get('/{verbConjugationSlotGame}/join-from-invite', [VerbConjugationSlotGameController::class, 'joinFromInvite'])->name('games.verb-conjugation-slot.join-from-invite');
            Route::post('/{verbConjugationSlotGame}/join', [VerbConjugationSlotGameController::class, 'join'])->name('games.verb-conjugation-slot.join');
            Route::post('/{verbConjugationSlotGame}/ready', [VerbConjugationSlotGameController::class, 'ready'])->name('games.verb-conjugation-slot.ready');
            Route::delete('/{verbConjugationSlotGame}/leave', [VerbConjugationSlotGameController::class, 'leave'])->name('games.verb-conjugation-slot.leave');
            Route::post('/{verbConjugationSlotGame}/end', [VerbConjugationSlotGameController::class, 'end'])->name('games.verb-conjugation-slot.end');
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
    // Dedicated practice page (Exercises UI)
    Route::get('/lessons/{level}/{lesson_number}/practice', [LessonController::class, 'practice'])
        ->name('lessons.practice');
    // Lesson exercises API
    Route::get('/lessons/{level}/{lesson_number}/exercises', [LessonController::class, 'exercises'])->name('lessons.exercises.index');
    Route::get('/lessons/{level}/{lesson_number}/exercises/{exercise}', [LessonController::class, 'showExercise'])->name('lessons.exercises.show');
    Route::post('/lessons/{level}/{lesson_number}/complete', [LessonController::class, 'markComplete'])->name('lessons.complete');

    // Verbs list (search + pagination)
    Route::get('/verbs', [VerbConjugationController::class, 'index'])->name('verbs.index');

    // Random verbs (JSON)
    Route::get('/verbs/random', [VerbConjugationController::class, 'random'])->name('verbs.random');

    // Verb study page (single verb with per-tense tables)
    Route::get('/verbs/{verb}', [VerbConjugationController::class, 'show'])->name('verbs.show');

    // My Verbs (favorites)
    Route::get('/my-verbs', [UserVerbController::class, 'index'])->name('my-verbs.index');
    Route::post('/verbs/{verb}/favorite', [UserVerbController::class, 'favorite'])->name('verbs.favorite');
    Route::delete('/verbs/{verb}/favorite', [UserVerbController::class, 'unfavorite'])->name('verbs.unfavorite');
    Route::patch('/my-verbs/{verb}', [UserVerbController::class, 'update'])->name('my-verbs.update');
    Route::post('/my-verbs/bulk-add', [UserVerbController::class, 'bulkAdd'])->name('my-verbs.bulk-add');

    // Verb Lists (custom study lists)
    Route::get('/verb-lists', [VerbListController::class, 'index'])->name('verb-lists.index');
    Route::get('/verb-lists/create', [VerbListController::class, 'create'])->name('verb-lists.create');
    Route::post('/verb-lists', [VerbListController::class, 'store'])->name('verb-lists.store');
    Route::get('/verb-lists/{list}', [VerbListController::class, 'show'])->name('verb-lists.show');
    Route::get('/verb-lists/{list}/edit', [VerbListController::class, 'edit'])->name('verb-lists.edit');
    Route::patch('/verb-lists/{list}', [VerbListController::class, 'update'])->name('verb-lists.update');
    Route::delete('/verb-lists/{list}', [VerbListController::class, 'destroy'])->name('verb-lists.destroy');
    Route::post('/verb-lists/{list}/verbs', [VerbListController::class, 'addVerb'])->name('verb-lists.add-verb');
    Route::post('/verb-lists/{list}/verbs/bulk', [VerbListController::class, 'bulkAddVerbs'])->name('verb-lists.bulk-add-verbs');
    Route::delete('/verb-lists/{list}/verbs/{verb}', [VerbListController::class, 'removeVerb'])->name('verb-lists.remove-verb');
    Route::patch('/verb-lists/{list}/verbs/{verb}', [VerbListController::class, 'updateVerbNotes'])->name('verb-lists.update-verb-notes');

    // API routes for verb lists
    Route::get('/api/verb-lists', [VerbListController::class, 'apiIndex'])->name('api.verb-lists.index');
    Route::get('/api/verbs/{verb}/lists', [VerbListController::class, 'getVerbLists'])->name('api.verbs.lists');

    // API routes for tenses
    Route::get('/api/tenses', [App\Http\Controllers\Api\TenseController::class, 'index'])->name('api.tenses.index');

    // Nouns list
    Route::get('/nouns', [NounController::class, 'index'])->name('nouns.index');
    // My Nouns (favorites)
    Route::get('/my-nouns', [UserNounController::class, 'index'])->name('my-nouns.index');
    Route::post('/nouns/{noun}/favorite', [UserNounController::class, 'favorite'])->name('nouns.favorite');
    Route::delete('/nouns/{noun}/favorite', [UserNounController::class, 'unfavorite'])->name('nouns.unfavorite');
    Route::patch('/my-nouns/{noun}', [UserNounController::class, 'update'])->name('my-nouns.update');
    Route::post('/my-nouns/bulk-add', [UserNounController::class, 'bulkAdd'])->name('my-nouns.bulk-add');

    // Noun Lists (custom study lists)
    Route::get('/noun-lists', [NounListController::class, 'index'])->name('noun-lists.index');
    Route::get('/noun-lists/create', [NounListController::class, 'create'])->name('noun-lists.create');
    Route::post('/noun-lists', [NounListController::class, 'store'])->name('noun-lists.store');
    Route::get('/noun-lists/{list}', [NounListController::class, 'show'])->name('noun-lists.show');
    Route::get('/noun-lists/{list}/edit', [NounListController::class, 'edit'])->name('noun-lists.edit');
    Route::patch('/noun-lists/{list}', [NounListController::class, 'update'])->name('noun-lists.update');
    Route::delete('/noun-lists/{list}', [NounListController::class, 'destroy'])->name('noun-lists.destroy');
    Route::post('/noun-lists/{list}/nouns', [NounListController::class, 'addNoun'])->name('noun-lists.add-noun');
    Route::post('/noun-lists/{list}/nouns/bulk', [NounListController::class, 'bulkAddNouns'])->name('noun-lists.bulk-add-nouns');
    Route::delete('/noun-lists/{list}/nouns/{noun}', [NounListController::class, 'removeNoun'])->name('noun-lists.remove-noun');
    Route::patch('/noun-lists/{list}/nouns/{noun}', [NounListController::class, 'updateNounNotes'])->name('noun-lists.update-noun-notes');

    // API routes for noun lists
    Route::get('/api/noun-lists', [NounListController::class, 'apiIndex'])->name('api.noun-lists.index');
    Route::get('/api/nouns/{noun}/lists', [NounListController::class, 'getNounLists'])->name('api.nouns.lists');
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

    Route::get('/derby/{derbyGame:id}', [DerbyGameController::class, 'show'])
        ->middleware(EnsurePlayerInGame::class)
        ->name('games.derby.show');

    Route::get('/word-search-puzzle/{wordSearchPuzzleGame:id}', [WordSearchPuzzleGameController::class, 'show'])
        ->middleware(EnsurePlayerInGame::class)
        ->name('games.word-search-puzzle.show');

    Route::get('/verb-conjugation-slot/{verbConjugationSlotGame:id}', [VerbConjugationSlotGameController::class, 'show'])
        ->middleware(EnsurePlayerInGame::class)
        ->name('games.verb-conjugation-slot.show');
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
