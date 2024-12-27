<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Http\Requests\UpdateGameSettingsRequest;
use App\Models\LanguagePair;
use App\Models\UserSetting;
use App\Services\LanguageService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(
        private LanguageService $languageService,
    ) {}

    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'languagePairs' => LanguagePair::where('is_active', true)
                ->with(['sourceLanguage', 'targetLanguage'])
                ->get()
                ->mapWithKeys(function ($pair) {
                    return [
                        $pair->id => [
                            'id' => $pair->id,
                            'sourceLanguage' => [
                                'code' => $pair->sourceLanguage->code,
                                'name' => $pair->sourceLanguage->name,
                                'flag' => $this->languageService->getFlag($pair->sourceLanguage->code),
                            ],
                            'targetLanguage' => [
                                'code' => $pair->targetLanguage->code,
                                'name' => $pair->targetLanguage->name,
                                'flag' => $this->languageService->getFlag($pair->targetLanguage->code),
                            ],
                        ],
                    ];
                })->all(),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Update game settings with redirect response.
     */
    public function updateGameSettings(UpdateGameSettingsRequest $request, string $redirectRoute = 'profile.edit')
    {
        try {
            $this->updateUserSettings($request->validated(), $request->user()->userSetting);

            return Redirect::route($redirectRoute)
                ->with('status', 'Game settings updated successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to update game settings', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return Redirect::route($redirectRoute)
                ->withErrors(['error' => 'Failed to update game settings. Please try again.']);
        }
    }

    /**
     * Common logic for updating user settings.
     */
    protected function updateUserSettings(array $settings, $userSettings)
    {
        foreach ($settings as $key => $value) {
            if ($value !== null) {
                $userSettings->{$key} = $value;
            }
        }
        $userSettings->save();
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
