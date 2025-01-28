<?php

namespace App\Http\Controllers;

use App\Models\WaitlistSubscriber;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class WaitlistController extends Controller
{
    public function subscribe(Request $request)
    {
        // Custom validation messages
        $messages = [
            'email.unique' => 'You are already subscribed! We will notify you when these features launch.',
        ];

        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:waitlist_subscribers,email',
            'features' => 'nullable|array',
            'features.*' => 'exists:upcoming_features,id'
        ], $messages);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $subscriber = WaitlistSubscriber::create([
            'email' => $request->email
        ]);

        // Attach features only if they are provided
        if ($request->has('features')) {
            $subscriber->features()->attach($request->features);
        }

        return response()->json([
            'message' => 'Successfully subscribed to waitlist',
            'subscriber' => $subscriber
        ]);
    }
}
