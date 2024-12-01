<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class GuestUserService
{
    public function createGuestUser(int $languagePairId = null): User
    {
        $guestToken = Str::random(32);
        $guestId = Str::random(8);

        return User::create([
            'name' => 'Guest_' . $guestId,
            'email' => $guestId . '@guest.lengofy.local',
            'password' => Hash::make(Str::random(8)),
            'is_guest' => true,
            'guest_token' => $guestToken,
            'language_pair_id' => $languagePairId,
            'last_active_at' => now(),
        ]);
    }

    public function convertToRegularUser(User $user, array $data): User
    {
        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'is_guest' => false,
            'guest_token' => null,
        ]);

        return $user;
    }

    public function findByGuestToken(string $token): ?User
    {
        return User::where('guest_token', $token)
            ->where('is_guest', true)
            ->first();
    }

    public function updateLastActive(User $user): void
    {
        $user->update(['last_active_at' => now()]);
    }
}
