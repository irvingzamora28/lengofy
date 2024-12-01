<?php

namespace Tests\Unit\Services;

use App\Enums\GameStatus;
use App\Events\GameCreated;
use App\Models\Game;
use App\Models\LanguagePair;
use App\Models\Noun;
use App\Models\User;
use App\Services\GameService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class GameServiceTest extends TestCase
{
    use RefreshDatabase;

    private GameService $gameService;
    private User $user;
    private LanguagePair $languagePair;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create dependencies
        $this->gameService = app(GameService::class);
        
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
        
        $game = $this->gameService->createGame(
            $this->user,
            $this->languagePair->id,
            $maxPlayers
        );

        // Assert game was created with correct attributes
        $this->assertInstanceOf(Game::class, $game);
        $this->assertEquals(GameStatus::WAITING, $game->status);
        $this->assertEquals($maxPlayers, $game->max_players);
        $this->assertEquals(10, $game->total_rounds);
        $this->assertEquals($this->languagePair->id, $game->language_pair_id);
        $this->assertEquals($this->user->id, $game->creator_id);

        // Assert player was added
        $this->assertCount(1, $game->players);
        $this->assertEquals($this->user->id, $game->players->first()->user_id);
        $this->assertEquals(0, $game->players->first()->score);
        $this->assertFalse($game->players->first()->is_ready);

        // Assert event was dispatched
        Event::assertDispatched(GameCreated::class, function ($event) use ($game) {
            return $event->game->id === $game->id;
        });
    }

    #[Test]
    public function it_allows_joining_a_game_with_available_slots()
    {
        $game = $this->gameService->createGame(
            $this->user,
            $this->languagePair->id,
            2
        );

        $newPlayer = User::factory()->create([
            'language_pair_id' => $this->languagePair->id
        ]);

        $this->gameService->joinGame($game, $newPlayer);

        $this->assertCount(2, $game->refresh()->players);
        $this->assertTrue($game->players->contains('user_id', $newPlayer->id));
    }

    #[Test]
    public function it_prevents_joining_a_full_game()
    {
        $game = $this->gameService->createGame(
            $this->user,
            $this->languagePair->id,
            1 // Max 1 player
        );

        $newPlayer = User::factory()->create([
            'language_pair_id' => $this->languagePair->id
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Game is full');

        $this->gameService->joinGame($game, $newPlayer);
    }

    #[Test]
    public function it_marks_player_as_ready_and_starts_game_when_all_ready()
    {
        $game = $this->gameService->createGame(
            $this->user,
            $this->languagePair->id,
            2
        );

        $player2 = User::factory()->create([
            'language_pair_id' => $this->languagePair->id
        ]);
        $this->gameService->joinGame($game, $player2);

        // Mark first player ready
        $this->gameService->markPlayerReady($game, $this->user->id);
        $game->refresh();
        
        // Game should still be waiting
        $this->assertEquals(GameStatus::WAITING, $game->status);

        // Mark second player ready
        $this->gameService->markPlayerReady($game, $player2->id);
        $game->refresh();

        // Game should now be in progress
        $this->assertEquals(GameStatus::IN_PROGRESS, $game->status);
        $this->assertEquals(1, $game->current_round);
        $this->assertNotNull($game->current_word);
    }
}
