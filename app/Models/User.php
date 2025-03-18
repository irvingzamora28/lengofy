<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\LanguagePair;
use App\Models\UserSetting;
use App\Models\LessonProgress;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'language_pair_id',
        'is_guest',
        'guest_token',
        'last_active_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_guest' => 'boolean',
            'last_active_at' => 'datetime',
        ];
    }

    public function languagePair()
    {
        return $this->belongsTo(LanguagePair::class);
    }

    // Relationship with user settings
    public function userSetting()
    {
        return $this->hasOne(UserSetting::class);
    }

    // Helper method to get all settings
    public function getAllSettings()
    {
        return UserSetting::getAllSettings($this);
    }

    public function getGenderDuelDifficultyAttribute()
    {
        return $this->userSetting?->gender_duel_difficulty ?? 'medium';
    }

    public function getGenderDuelSoundAttribute()
    {
        return $this->userSetting?->gender_duel_sound ?? true;
    }

    public function getGenderDuelTimerAttribute()
    {
        return $this->userSetting?->gender_duel_timer ?? true;
    }

    public function getWordPuzzleDifficultyAttribute()
    {
        return $this->userSetting?->word_puzzle_difficulty ?? 'medium';
    }

    public function scores()
    {
        return $this->hasMany(Score::class);
    }

    public function lessonProgress(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function toArray()
    {
        $attributes = parent::toArray();

        $attributes['gender_duel_difficulty'] = $this->gender_duel_difficulty;
        $attributes['gender_duel_sound'] = $this->gender_duel_sound;
        $attributes['gender_duel_timer'] = $this->gender_duel_timer;
        $attributes['word_puzzle_difficulty'] = $this->word_puzzle_difficulty;

        return $attributes;
    }

    protected static function booted()
    {
        static::created(function ($user) {
            // Create default user settings when a new user is created
            $user->userSetting()->create([
                'gender_duel_difficulty' => 'medium',
                'gender_duel_sound' => true,
                'gender_duel_timer' => true,
                'word_puzzle_difficulty' => 'medium',
            ]);
        });
    }
}
