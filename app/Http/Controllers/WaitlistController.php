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
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:waitlist_subscribers,email',
            'features' => 'required|array|min:1',
            'features.*' => 'exists:upcoming_features,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $subscriber = WaitlistSubscriber::create([
            'email' => $request->email
        ]);

        $subscriber->features()->attach($request->features);

        return response()->json([
            'message' => 'Successfully subscribed to waitlist',
            'subscriber' => $subscriber
        ]);
    }
}
