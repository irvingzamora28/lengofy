<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\Score;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Illuminate\Support\Str;

class ScoreTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Migrate and seed base games if needed
        $this->artisan('migrate');
    }

    public function test_update_add_score_creates_and_updates_totals(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $game = Game::create([
            'name' => 'Test Game',
            'slug' => (string) Str::uuid(),
            'supported_language_pairs' => null,
        ]);

        // First submission creates a score row
        $payload = [
            'user_id' => $user->id,
            'game_id' => $game->id,
            'score' => 7,
            'correct_streak' => 3,
        ];

        $this->postJson(route('scores.update-add-score'), $payload)
            ->assertStatus(200)
            ->assertJsonFragment([
                'user_id' => $user->id,
                'game_id' => $game->id,
                'highest_score' => 7,
                'total_points' => 7,
            ]);

        $this->assertDatabaseHas('scores', [
            'user_id' => $user->id,
            'game_id' => $game->id,
            'highest_score' => 7,
            'total_points' => 7,
        ]);

        // Second submission increases totals and possibly highest score
        $payload2 = [
            'user_id' => $user->id,
            'game_id' => $game->id,
            'score' => 10,
            'correct_streak' => 5,
        ];

        $this->postJson(route('scores.update-add-score'), $payload2)
            ->assertStatus(200)
            ->assertJsonFragment([
                'highest_score' => 10,
                'total_points' => 17,
            ]);

        $this->assertDatabaseHas('scores', [
            'user_id' => $user->id,
            'game_id' => $game->id,
            'highest_score' => 10,
            'total_points' => 17,
        ]);
    }

    public function test_update_replaces_full_score_fields(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $game = Game::create([
            'name' => 'Test Game',
            'slug' => (string) Str::uuid(),
            'supported_language_pairs' => null,
        ]);

        // Pre-existing score
        Score::create([
            'user_id' => $user->id,
            'game_id' => $game->id,
            'highest_score' => 1,
            'total_points' => 1,
            'winning_streak' => 0,
        ]);

        $payload = [
            'user_id' => $user->id,
            'game_id' => $game->id,
            'highest_score' => 15,
            'total_points' => 120,
            'winning_streak' => 8,
        ];

        $this->postJson(route('scores.update'), $payload)
            ->assertStatus(200)
            ->assertJsonFragment([
                'highest_score' => 15,
                'total_points' => 120,
                'winning_streak' => 8,
            ]);

        $this->assertDatabaseHas('scores', [
            'user_id' => $user->id,
            'game_id' => $game->id,
            'highest_score' => 15,
            'total_points' => 120,
            'winning_streak' => 8,
        ]);
    }

    public function test_update_add_score_validation_errors(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        // Missing all required fields
        $this->postJson(route('scores.update-add-score'), [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['user_id', 'game_id', 'score', 'correct_streak']);

        // Invalid ids
        $this->postJson(route('scores.update-add-score'), [
            'user_id' => 999999,
            'game_id' => 999999,
            'score' => 1,
            'correct_streak' => 1,
        ])->assertStatus(422);
    }

    public function test_update_validation_errors(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        // Missing fields
        $this->postJson(route('scores.update'), [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['user_id', 'game_id', 'highest_score', 'total_points', 'winning_streak']);

        // Invalid ids
        $this->postJson(route('scores.update'), [
            'user_id' => 999999,
            'game_id' => 999999,
            'highest_score' => 1,
            'total_points' => 1,
            'winning_streak' => 0,
        ])->assertStatus(422);
    }
}
