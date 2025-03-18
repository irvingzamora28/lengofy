<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

class UserSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'gender_duel_difficulty',
        'gender_duel_sound',
        'gender_duel_timer',
        'preferred_language',
        'memory_translation_difficulty',
        'word_puzzle_difficulty',
        'dark_mode',
        'timezone',
        'additional_settings'
    ];

    protected $casts = [
        'user_id' => 'integer',
        'gender_duel_sound' => 'boolean',
        'gender_duel_timer' => 'boolean',
        'dark_mode' => 'boolean',
        'additional_settings' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Ensure difficulty is always a valid value
    public function setGenderDuelDifficultyAttribute($value)
    {
        $validDifficulties = ['easy', 'medium', 'hard'];
        $this->attributes['gender_duel_difficulty'] = in_array($value, $validDifficulties)
            ? $value
            : 'medium';
    }

    // Static method to get a specific setting
    public static function get(User $user, string $key, $default = null)
    {
        $settings = self::firstOrCreate(
            ['user_id' => $user->id],
            [
                'gender_duel_difficulty' => 'medium',
                'gender_duel_sound' => true,
                'gender_duel_timer' => true,
                'word_puzzle_difficulty' => 'medium',
            ]
        );

        // Check core settings first
        $coreSettings = [
            'gender_duel_difficulty',
            'gender_duel_sound',
            'gender_duel_timer',
            'preferred_language',
            'word_puzzle_difficulty',
            'dark_mode',
            'timezone'
        ];

        if (in_array($key, $coreSettings)) {
            return $settings->$key ?? $default;
        }

        // If not a core setting, check additional_settings
        $additionalSettings = $settings->additional_settings ?? [];
        return Arr::get($additionalSettings, $key, $default);
    }

    // Static method to set a setting
    public static function set(User $user, string $key, $value)
    {
        $settings = self::firstOrCreate(
            ['user_id' => $user->id],
            [
                'gender_duel_difficulty' => 'medium',
                'gender_duel_sound' => true,
                'gender_duel_timer' => true,
            ]
        );

        // Core settings
        $coreSettings = [
            'gender_duel_difficulty',
            'gender_duel_sound',
            'gender_duel_timer',
            'preferred_language',
            'dark_mode',
            'timezone'
        ];

        if (in_array($key, $coreSettings)) {
            $settings->$key = $value;
            $settings->save();
            return $value;
        }

        // Additional settings (stored in JSON)
        $additionalSettings = $settings->additional_settings ?? [];
        Arr::set($additionalSettings, $key, $value);
        $settings->additional_settings = $additionalSettings;
        $settings->save();

        return $value;
    }

    // Get all settings for a user
    public static function getAllSettings(User $user)
    {
        $settings = self::firstOrCreate(
            ['user_id' => $user->id],
            [
                'gender_duel_difficulty' => 'medium',
                'gender_duel_sound' => true,
                'gender_duel_timer' => true,
                'memory_translation_difficulty' => 'medium',
                'word_puzzle_difficulty' => 'medium',
            ]
        );

        // Combine core and additional settings
        return array_merge(
            Arr::except($settings->toArray(), ['id', 'user_id', 'created_at', 'updated_at', 'additional_settings']),
            $settings->additional_settings ?? []
        );
    }
}
