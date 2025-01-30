<?php

namespace App\Http\Controllers;

use App\Models\LessonProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\DB; // Import DB facade
use Illuminate\Support\Facades\Validator;
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
        $lessons = DB::table('lessons')
            ->where('language_pair_id', $languagePair->id) // Ensure we only search within the user's language pair
            ->get();

        // Process lessons for rendering
        foreach ($lessons as $lesson) {
            // Add progress information to lessons
            $progressKey = "{$pairCode}/{$lesson->level}/{$lesson->title}";
            $lesson->completed = $progress->has($progressKey) ? $progress[$progressKey]->completed : false;
            $pairs[] = [
                'pair' => $pairCode,
                'lesson' => $lesson,
            ];
        }

        return Inertia::render('Lessons/Index', [
            'languagePairs' => $pairs
        ]);
    }

    public function show($level, $lesson_number)
    {
        // TODO: Implement a more efficient way to get the previous and next lessons (We just need the lesson's numbers)
        $user = auth()->user();
        $languagePair = $user->languagePair;

        $lessonData = DB::table('lessons')->where('language_pair_id', $languagePair->id)->where('lesson_number', $lesson_number)->first();
        if (!$lessonData) {
            abort(404);
        }

        // Get all lessons for the current language pair and level
        $allLessons = DB::table('lessons')
            ->where('language_pair_id', $languagePair->id)
            ->where('level', $lessonData->level)
            ->get();
        $currentIndex = array_search($lesson_number, array_column($allLessons->toArray(), 'lesson_number'));

        // Get next and previous lessons
        $previousLesson = $currentIndex > 0 ? $allLessons[$currentIndex - 1] : null;
        $nextLesson = $currentIndex < count($allLessons) - 1 ? $allLessons[$currentIndex + 1] : null;

        // Get user's progress for this lesson
        $progress = LessonProgress::firstOrCreate(
            [
                'user_id' => auth()->id(),
                'language_pair_id' => $languagePair->id,
                'level' => $level,
                'lesson_number' => $lesson_number,
            ]
        );

        if (request()->wantsJson()) {
            return Response::make($lessonData->content, 200, [
                'Content-Type' => 'text/markdown'
            ]);
        }

        // Remove the metadata from the content
        $lessonData->content = preg_replace('/^---\n(.*?)\n---/s', '', $lessonData->content);

        return Inertia::render('Lessons/Show', [
            'languagePairName' => $languagePair->sourceLanguage->name . ' → ' . $languagePair->targetLanguage->name,
            'level' => $lessonData->level,
            'lesson_number' => $lesson_number,
            'title' => $lessonData->title,
            'content' => $lessonData->content,
            'progress' => $progress->only(['completed', 'completed_at']),
            'navigation' => [
                'previous' => $previousLesson ? [
                    'title' => $previousLesson->title,
                    'lesson_number' => $previousLesson->lesson_number,
                ] : null,
                'next' => $nextLesson ? [
                    'title' => $nextLesson->title,
                    'lesson_number' => $nextLesson->lesson_number,
                ] : null,
            ],
        ]);
    }

    public function markComplete(string $level, int $lesson_number)
    {
        $validator = Validator::make(
            ['level' => $level, 'lesson_number' => $lesson_number],
            [
                'level' => 'required|string|in:beginner,elementary,pre-intermediate,intermediate,upper-intermediate,advanced,proficiency',
                'lesson_number' => 'required',
            ]
        );

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $user = auth()->user();

        $languagePair = $user->languagePair;

        $progress = LessonProgress::firstOrCreate(
            [
                'user_id' => $user->id,
                'language_pair_id' => $languagePair->id,
                'level' => $level,
                'lesson_number' => $lesson_number,
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
        $user = auth()->user();
        $languagePair = $user->languagePair;
        $query = $request->input('query');
        $results = DB::table('lessons')
            ->where('language_pair_id', $languagePair->id) // Ensure we only search within the user's language pair
            ->where(function ($innerQuery) use ($query) {
                $innerQuery->where('title', 'like', "%{$query}%")
                    ->orWhere('content', 'like', "%{$query}%");
            })
            ->get();
        // Decode the JSON string in the topics field
        $results = $results->map(function ($result) {
            $result->topics = json_decode($result->topics, true);
            return $result;
        });

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

            usort($lessons, function ($a, $b) {
                return ($a['metadata']['lessonNumber'] ?? 0) <=> ($b['metadata']['lessonNumber'] ?? 0);
            });
        }

        return $lessons;
    }

    private function parseMetadata($content)
    {
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
