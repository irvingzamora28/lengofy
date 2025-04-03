<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FeedbackAnalyticsController extends Controller
{
    /**
     * Display a listing of the feedback.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $feedback = Feedback::with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Admin/Feedback/Index', [
            'feedback' => $feedback,
        ]);
    }

    /**
     * Display the specified feedback.
     *
     * @param  \App\Models\Feedback  $feedback
     * @return \Inertia\Response
     */
    public function show(Feedback $feedback)
    {
        $feedback->load('user');

        return Inertia::render('Admin/Feedback/Show', [
            'feedback' => $feedback,
        ]);
    }

    /**
     * Update the status of the specified feedback.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Feedback  $feedback
     * @return \Illuminate\Http\RedirectResponse
     */
    public function updateStatus(Request $request, Feedback $feedback)
    {
        $request->validate([
            'status' => 'required|in:new,in_review,resolved',
        ]);

        $feedback->update([
            'status' => $request->status,
        ]);

        return redirect()->back()->with('success', 'Feedback status updated successfully.');
    }
}
