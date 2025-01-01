<?php

namespace App\Http\Controllers;

use App\Models\Score;
use Illuminate\Http\Request;

class ScoreController extends Controller
{
    public function update(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'game_id' => 'required|exists:games,id',
            'highest_score' => 'required|integer',
            'total_points' => 'required|integer',
            'winning_streak' => 'required|integer',
        ]);

        // Update or create the score record
        $score = Score::updateOrCreate(
            [
                'user_id' => $validated['user_id'],
                'game_id' => $validated['game_id'],
            ],
            [
                'highest_score' => $validated['highest_score'],
                'total_points' => $validated['total_points'],
                'winning_streak' => $validated['winning_streak'],
            ]
        );

        return response()->json($score, 200);
    }

    public function updateAddScore(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'game_id' => 'required|exists:games,id',
            'score' => 'required|integer',
            'correct_streak' => 'required|integer',
        ]);

        $score = Score::where('user_id', $validated['user_id'])
            ->where('game_id', $validated['game_id'])
            ->first();

        if ($score) {
            $score->highest_score = max($score->highest_score, $validated['score']);
            $score->correct_streak = max($score->correct_streak, $validated['correct_streak']);
            $score->total_points += $validated['score'];
            $score->save();
        } else {
            $score = Score::create([
                'user_id' => $validated['user_id'],
                'game_id' => $validated['game_id'],
                'highest_score' => $validated['score'],
                'total_points' => $validated['score'],
            ]);
        }

        return response()->json($score, 200);
    }
}
