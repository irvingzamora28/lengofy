<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\LanguagePair;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    public function redirectToGoogle(Request $request)
    {
        // Store context in session for the callback
        $context = $request->input('context', 'login'); // 'login' or 'register'
        Session::put('oauth_context', $context);

        // If coming from register and language pair is selected, store it
        if ($context === 'register' && $request->input('language_pair_id')) {
            Session::put('oauth_language_pair_id', $request->input('language_pair_id'));
        }

        return Socialite::driver('google')->redirect();
    }

    public function redirectToGoogleFromRegister(Request $request)
    {
        return $this->redirectToGoogle($request->merge(['context' => 'register']));
    }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Laravel\Socialite\Two\InvalidStateException $e) {
            // Handle invalid state - redirect back to login with error
            return redirect()->route('login')
                ->with('error', 'OAuth authentication failed. Please try again.');
        } catch (\Exception $e) {
            // Handle other OAuth errors
            return redirect()->route('login')
                ->with('error', 'OAuth authentication failed. Please try again.');
        }

        $user = User::updateOrCreate(
            ['google_id' => $googleUser->getId()],
            [
                'name'              => $googleUser->getName(),
                'email'             => $googleUser->getEmail(),
                'avatar'            => $googleUser->getAvatar(),
                'email_verified_at' => now(),
            ]
        );

        Auth::login($user, remember: true);

        // Handle language pair assignment based on OAuth context
        $context = Session::pull('oauth_context', 'login');
        $languagePairId = Session::pull('oauth_language_pair_id');

        // Refresh user to get latest data including language pair
        $user->refresh();

        if (!$user->languagePair) {
            if ($context === 'register' && $languagePairId) {
                // Register flow: use selected language pair
                $languagePair = LanguagePair::find($languagePairId);
                if ($languagePair && $languagePair->is_active) {
                    $user->language_pair_id = $languagePair->id;
                    $user->save();
                }
            } else {
                // Login flow or fallback: default to en->es
                $defaultPair = LanguagePair::where('is_active', true)
                    ->whereHas('sourceLanguage', fn($q) => $q->where('code', 'en'))
                    ->whereHas('targetLanguage', fn($q) => $q->where('code', 'es'))
                    ->first();

                if ($defaultPair) {
                    $user->language_pair_id = $defaultPair->id;
                    $user->save();
                }
            }

            // Refresh again to load the newly assigned language pair
            $user->refresh();
        }

        return redirect()->intended(route('dashboard'));
    }
}
