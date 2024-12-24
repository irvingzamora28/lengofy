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
}
