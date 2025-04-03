<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class FeedbackController extends Controller
{
    /**
     * Store a newly created feedback in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'feedback_type' => 'required|in:content,game,ui_ux,bug,feature,general',
            'message' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator->errors());
        }

        $user = Auth::user();

        $feedback = new Feedback([
            'feedback_type' => $request->feedback_type,
            'message' => $request->message,
            'is_guest' => $user->is_guest ?? false,
        ]);

        $feedback->user()->associate($user);
        $feedback->save();

        // Use a simple success message that will be displayed by the toast notification in the frontend
        return back()->with('success', 'feedback_submitted');
    }
}
