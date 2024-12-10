<?php

namespace Tests\Unit\Services;

use App\Enums\GameStatus;
use App\Enums\GenderDuelGameStatus;
use App\Events\GenderDuelGameCreated;
use App\Models\GenderDuelGame;
use App\Models\LanguagePair;
use App\Models\Noun;
use App\Models\User;
use App\Services\GenderDuelGameService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class GameServiceTest extends TestCase
{
    use RefreshDatabase;

    private GenderDuelGameService $gameService;
    private User $user;
    private LanguagePair $languagePair;

    protected function setUp(): void
    {
        parent::setUp();

        // Create dependencies
        $this->gameService = app(GenderDuelGameService::class);

        // Fake events and broadcasting
        Event::fake();

        // Create a test user
        $this->user = User::factory()->create();

        // Create a language pair
        $this->languagePair = LanguagePair::factory()->create();

        // Create some test nouns for the target language
        Noun::factory()->count(5)->create([
            'language_id' => $this->languagePair->target_language_id
        ]);
    }

    #[Test]
    public function it_creates_a_new_game()
    {
        $maxPlayers = 4;

        $genderDuelGame = $this->gameService->createGame(
            $this->user,
            $this->languagePair->id,
            $maxPlayers
        );

        // Assert game was created with correct attributes
        $this->assertInstanceOf(GenderDuelGame::class, $genderDuelGame);
        $this->assertEquals(GenderDuelGameStatus::WAITING, $genderDuelGame->status);
        $this->assertEquals($maxPlayers, $genderDuelGame->max_players);
        $this->assertEquals(10, $genderDuelGame->total_rounds);
        $this->assertEquals($this->languagePair->id, $genderDuelGame->language_pair_id);
        $this->assertEquals($this->user->id, $genderDuelGame->creator_id);

        // Assert player was added
        $this->assertCount(1, $genderDuelGame->players);
        $this->assertEquals($this->user->id, $genderDuelGame->players->first()->user_id);
        $this->assertEquals(0, $genderDuelGame->players->first()->score);
        $this->assertFalse($genderDuelGame->players->first()->is_ready);

        // Assert event was dispatched
        Event::assertDispatched(GenderDuelGameCreated::class, function ($event) use ($genderDuelGame) {
            return $event->genderDuelGame->id === $genderDuelGame->id;
        });
    }

    #[Test]
    public function it_allows_joining_a_game_with_available_slots()
    {
        $genderDuelGame = $this->gameService->createGame(
            $this->user,
            $this->languagePair->id,
            2
        );

        $newPlayer = User::factory()->create([
            'language_pair_id' => $this->languagePair->id
        ]);

        $this->gameService->joinGame($genderDuelGame, $newPlayer);

        $this->assertCount(2, $genderDuelGame->refresh()->players);
        $this->assertTrue($genderDuelGame->players->contains('user_id', $newPlayer->id));
    }

    #[Test]
    public function it_prevents_joining_a_full_game()
    {
        $genderDuelGame = $this->gameService->createGame(
            $this->user,
            $this->languagePair->id,
            1 // Max 1 player
        );

        $newPlayer = User::factory()->create([
            'language_pair_id' => $this->languagePair->id
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Game is full');

        $this->gameService->joinGame($genderDuelGame, $newPlayer);
    }

    #[Test]
    public function it_marks_player_as_ready()
    {
        $genderDuelGame = $this->gameService->createGame(
            $this->user,
            $this->languagePair->id,
            2
        );

        $player2 = User::factory()->create([
            'language_pair_id' => $this->languagePair->id
        ]);
        $this->gameService->joinGame($genderDuelGame, $player2);

        // Mark first player ready
        $this->gameService->markPlayerReady($genderDuelGame, $this->user->id);
        $genderDuelGame->refresh();

        // Assert first player is ready
        $this->assertTrue($genderDuelGame->players->first()->is_ready);
    }
}
