<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\GuestUserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class GuestUserController extends Controller
{
    protected $guestUserService;

    public function __construct(GuestUserService $guestUserService)
    {
        $this->guestUserService = $guestUserService;
    }

    public function createAndLogin(Request $request)
    {
        $request->validate([
            'language_pair_id' => 'required|exists:language_pairs,id',
        ]);

        $user = $this->guestUserService->createGuestUser($request->language_pair_id);
        Auth::login($user);

        return redirect()->route('games.gender-duel.lobby');
    }

    public function convertToRegular(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . Auth::id(),
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = Auth::user();
        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'is_guest' => false,
            'guest_token' => null,
        ]);

        return redirect()->back();
    }

    public function reclaim(Request $request)
    {
        $request->validate([
            'guest_token' => 'required|string',
        ]);

        $user = User::where('guest_token', $request->guest_token)
            ->where('is_guest', true)
            ->first();

        if (!$user) {
            return back()->withErrors([
                'guest_token' => 'Invalid guest token.',
            ]);
        }

        Auth::login($user);
        return redirect()->route('games.gender-duel.lobby');
    }

    public function logout()
    {
        $user = Auth::user();

        if ($user && $user->is_guest) {
            // Store the user ID before logging out
            $userId = $user->id;

            // Logout the user
            Auth::logout();

            // Delete the guest user
            User::where('id', $userId)->delete();

            // Clear session
            request()->session()->invalidate();
            request()->session()->regenerateToken();
        }

        return redirect()->route('welcome');
    }
}
