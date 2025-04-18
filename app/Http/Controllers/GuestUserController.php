<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\GenderDuelGame;
use App\Models\GenderDuelGamePlayer;
use App\Services\GuestUserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
            'redirect_route' => 'nullable|in:games.gender-duel.practice,games.memory-translation.practice,games.gender-duel.show,games.memory-translation.show,games.gender-duel.join-from-invite,games.memory-translation.join-from-invite',
            'game_id' => 'required_if:redirect_route,games.gender-duel.show,games.memory-translation.show,games.gender-duel.join-from-invite,games.memory-translation.join-from-invite|integer',
        ]);

        $user = $this->guestUserService->createGuestUser($request->language_pair_id);
        Auth::login($user);

        if ($request->redirect_route && $request->game_id) {
            // For game routes, we need to pass the game ID
            $paramName = str_contains($request->redirect_route, 'gender-duel') ? 'genderDuelGame' : 'memoryTranslationGame';
            return redirect()->route($request->redirect_route, [
                $paramName => $request->game_id
            ]);
        }

        return redirect()->route($request->redirect_route ?? 'dashboard', [
            'difficulty' => 'medium',
            'category' => 0,
        ]);
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

            // Delete related gender_duel_games records
            GenderDuelGame::where('creator_id', $userId)->delete();
            GenderDuelGamePlayer::where('user_id', $userId)->delete();

            // Delete the guest user
            User::where('id', $userId)->delete();

            // Clear session
            request()->session()->invalidate();
            request()->session()->regenerateToken();
        }

        return redirect()->route('welcome');
    }
}
