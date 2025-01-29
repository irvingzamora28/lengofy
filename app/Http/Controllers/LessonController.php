<?php

namespace App\Http\Controllers;

use App\Models\LessonProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;
use Inertia\Inertia;

class LessonController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $languagePair = $user->languagePair;

        if (!$languagePair) {
            return redirect()->route('dashboard')
                ->with('error', 'Please select a language pair first.');
        }

        $pairCode = $languagePair->sourceLanguage->code . '-' . $languagePair->targetLanguage->code;

        // Get user's progress for their lessons
        $progress = $user->lessonProgress()
            ->where('language_pair', $pairCode)
            ->select('language_pair', 'level', 'lesson', 'completed')
            ->get()
            ->keyBy(function ($item) {
                return "{$item->language_pair}/{$item->level}/{$item->lesson}";
            });

        // Get lessons only for user's language pair
        $pairs = [];
        $lessonsPath = resource_path("lessons/{$pairCode}");

        if (File::exists($lessonsPath)) {
            $levels = [];
            foreach (File::directories($lessonsPath) as $levelPath) {
                $level = basename($levelPath);
                $lessons = [];

                foreach (File::files($levelPath) as $lessonFile) {
                    if ($lessonFile->getExtension() === 'md') {
                        $content = File::get($lessonFile->getPathname());
                        $metadata = $this->parseMetadata($content);

                        $lessons[] = [
                            'filename' => $lessonFile->getFilename(),
                            'path' => str_replace('.md', '', $lessonFile->getFilename()),
                            'metadata' => $metadata,
                        ];
                    }
                }

                if (!empty($lessons)) {
                    usort($lessons, function($a, $b) {
                        return ($a['metadata']['lessonNumber'] ?? 0) <=> ($b['metadata']['lessonNumber'] ?? 0);
                    });

                    // Add progress information to lessons
                    foreach ($lessons as &$lesson) {
                        $progressKey = "{$pairCode}/{$level}/{$lesson['path']}";
                        $lesson['completed'] = $progress->has($progressKey) ? $progress[$progressKey]->completed : false;
                    }

                    $levels[] = [
                        'name' => $level,
                        'lessons' => $lessons,
                    ];
                }
            }

            if (!empty($levels)) {
                $pairs[] = [
                    'pair' => $pairCode,
                    'levels' => $levels,
                ];
            }
        }

        return Inertia::render('Lessons/Index', [
            'languagePairs' => $pairs
        ]);
    }

    public function show($languagePair, $level, $lesson)
    {
        $lessonPath = resource_path("lessons/{$languagePair}/{$level}/{$lesson}.md");

        if (!File::exists($lessonPath)) {
            abort(404);
        }

        $content = File::get($lessonPath);

        // Get user's progress for this lesson
        $progress = LessonProgress::firstOrCreate(
            [
                'user_id' => auth()->id(),
                'language_pair' => $languagePair,
                'level' => $level,
                'lesson' => $lesson,
            ]
        );

        if (request()->wantsJson()) {
            return Response::make($content, 200, [
                'Content-Type' => 'text/markdown'
            ]);
        }

        // Get next and previous lessons
        $allLessons = $this->getLessonsInLevel($languagePair, $level);
        $currentIndex = array_search($lesson, array_column($allLessons, 'path'));

        $previousLesson = $currentIndex > 0 ? $allLessons[$currentIndex - 1] : null;
        $nextLesson = $currentIndex < count($allLessons) - 1 ? $allLessons[$currentIndex + 1] : null;

        return Inertia::render('Lessons/Show', [
            'languagePair' => $languagePair,
            'level' => $level,
            'lesson' => $lesson,
            'content' => $content,
            'progress' => $progress->only(['completed', 'completed_at']),
            'navigation' => [
                'previous' => $previousLesson ? [
                    'path' => $previousLesson['path'],
                    'title' => $previousLesson['metadata']['title'] ?? '',
                ] : null,
                'next' => $nextLesson ? [
                    'path' => $nextLesson['path'],
                    'title' => $nextLesson['metadata']['title'] ?? '',
                ] : null,
            ],
        ]);
    }

    public function markComplete(Request $request, $languagePair, $level, $lesson)
    {
        $progress = LessonProgress::firstOrCreate(
            [
                'user_id' => auth()->id(),
                'language_pair' => $languagePair,
                'level' => $level,
                'lesson' => $lesson,
            ]
        );

        $progress->update([
            'completed' => true,
            'completed_at' => now(),
        ]);

        return back()->with('success', 'Lesson marked as complete!');
    }

    public function progress()
    {
        $user = auth()->user();
        $languagePair = $user->languagePair;

        if (!$languagePair) {
            return redirect()->route('lessons.index')
                ->with('error', 'Please select a language pair first.');
        }

        $pairCode = $languagePair->sourceLanguage->code . '-' . $languagePair->targetLanguage->code;
        $lessonsCount = $this->getLessonsCountForPair($pairCode);
        $userProgress = $user->lessonProgress()
            ->where('language_pair', $pairCode)
            ->where('completed', true)
            ->get();

        $overallProgress = [
            'completed' => $userProgress->count(),
            'total' => $lessonsCount['total'],
            'percentage' => $lessonsCount['total'] > 0
                ? round(($userProgress->count() / $lessonsCount['total']) * 100, 1)
                : 0,
        ];

        $progressByLevel = [];
        foreach ($lessonsCount['byLevel'] as $level => $count) {
            $completed = $userProgress
                ->where('level', $level)
                ->count();

            $lastCompleted = $userProgress
                ->where('level', $level)
                ->sortByDesc('completed_at')
                ->first();

            $progressByLevel[] = [
                'level' => $level,
                'completed_count' => $completed,
                'total_count' => $count,
                'last_completed_at' => $lastCompleted ? $lastCompleted->completed_at : null,
            ];
        }

        return Inertia::render('Lessons/Progress', [
            'progress' => [
                'overall' => $overallProgress,
                'byLevel' => $progressByLevel,
                'languagePair' => [
                    'code' => $pairCode,
                    'source' => $languagePair->sourceLanguage->name,
                    'target' => $languagePair->targetLanguage->name,
                ],
            ],
        ]);
    }

    public function search(Request $request)
    {
        $query = $request->input('query');
        $results = [];

        if ($query) {
            $user = auth()->user();
            $languagePair = $user->languagePair;

            if (!$languagePair) {
                return redirect()->route('lessons.index')
                    ->with('error', 'Please select a language pair first.');
            }

            $pairCode = $languagePair->sourceLanguage->code . '-' . $languagePair->targetLanguage->code;
            $pairPath = resource_path("lessons/{$pairCode}");

            if (File::exists($pairPath)) {
                foreach (File::directories($pairPath) as $levelPath) {
                    $level = basename($levelPath);

                    foreach (File::files($levelPath) as $lessonFile) {
                        if ($lessonFile->getExtension() === 'md') {
                            $content = File::get($lessonFile->getPathname());

                            // Search in content and metadata
                            if (stripos($content, $query) !== false) {
                                $metadata = $this->parseMetadata($content);

                                $results[] = [
                                    'language_pair' => $pairCode,
                                    'level' => $level,
                                    'lesson' => str_replace('.md', '', $lessonFile->getFilename()),
                                    'title' => $metadata['title'] ?? '',
                                    'topics' => $metadata['topics'] ?? [],
                                ];
                            }
                        }
                    }
                }
            }
        }

        if ($request->wantsJson()) {
            return response()->json($results);
        }

        return Inertia::render('Lessons/Search', [
            'query' => $query,
            'results' => $results,
            'languagePair' => [
                'code' => $pairCode ?? null,
                'source' => $languagePair->sourceLanguage->name ?? null,
                'target' => $languagePair->targetLanguage->name ?? null,
            ],
        ]);
    }

    private function getLessonsInLevel($languagePair, $level)
    {
        $levelPath = resource_path("lessons/{$languagePair}/{$level}");
        $lessons = [];

        if (File::exists($levelPath)) {
            foreach (File::files($levelPath) as $lessonFile) {
                if ($lessonFile->getExtension() === 'md') {
                    $content = File::get($lessonFile->getPathname());
                    $metadata = $this->parseMetadata($content);

                    $lessons[] = [
                        'path' => str_replace('.md', '', $lessonFile->getFilename()),
                        'metadata' => $metadata,
                    ];
                }
            }

            usort($lessons, function($a, $b) {
                return ($a['metadata']['lessonNumber'] ?? 0) <=> ($b['metadata']['lessonNumber'] ?? 0);
            });
        }

        return $lessons;
    }

    private function parseMetadata($content) {
        preg_match('/^---\n(.*?)\n---/s', $content, $matches);
        $metadata = [];

        if (isset($matches[1])) {
            foreach (explode("\n", $matches[1]) as $line) {
                if (strpos($line, ':') !== false) {
                    [$key, $value] = explode(':', $line, 2);
                    $key = trim($key);
                    $value = trim($value, " \t\n\r\0\x0B\"");

                    // Handle array values (topics)
                    if ($key === 'topics') {
                        // If the value is wrapped in brackets [item1, item2]
                        if (preg_match('/^\[(.*)\]$/', $value, $matches)) {
                            $value = array_map('trim', explode(',', $matches[1]));
                        } else {
                            $value = [];
                        }
                    }

                    $metadata[$key] = $value;
                }
            }
        }

        return $metadata;
    }

    private function getLessonsCountForPair($languagePair)
    {
        $pairPath = resource_path("lessons/{$languagePair}");
        $total = 0;
        $byLevel = [];

        if (File::exists($pairPath)) {
            foreach (File::directories($pairPath) as $levelPath) {
                $level = basename($levelPath);
                $count = count(File::files($levelPath));

                $total += $count;
                $byLevel[$level] = $count;
            }
        }

        return [
            'total' => $total,
            'byLevel' => $byLevel,
        ];
    }
}
