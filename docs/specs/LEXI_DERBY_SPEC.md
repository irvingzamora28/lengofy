# Lexi Derby (Horse Race) — Implementation Plan

This document specifies the full implementation plan for the multiplayer horse‑race language game “Lexi Derby,” aligned with the current Gender Duel architecture. Build to these specs so the feature integrates cleanly with existing backend, frontend, and Bun WebSocket infrastructure.

---

## Goals

- **Game feel**: Fairground horse race. Correct answers advance your horse along a track. Faster and streaked answers grant bonuses. Competitive and real‑time.
- **Content**: Use existing nouns (and later verbs). Respect user’s `languagePair`. Allow filtering by selected noun/verb lists and lessons.
- **Difficulty**: `easy` | `medium` | `hard` controls timing, distractors, advancement, streak thresholds, and power‑ups.
- **Architecture**: Mirror the Gender Duel pattern (no Redis). Use DB rows for matches/players; Bun WS holds in‑memory room state. Reuse service patterns.

---

## References (existing system)

- WebSocket manager: `websocket/games/gender-duel/GenderDuelManager.ts`
- Controller: `app/Http/Controllers/GenderDuelGameController.php`
- Frontend game area: `resources/js/Components/GenderDuelGame/GameArea.tsx`
- Migrations:
  - `database/migrations/2024_03_19_000003_create_gender_duel_games_table.php`
  - `database/migrations/2024_03_19_000004_create_gender_duel_game_players_table.php`

Lexi Derby should follow the same structure with Derby‑specific naming.

---

## Data Model

Create Derby tables mirroring Gender Duel with Derby‑specific fields.

- `derby_games`
  - `id`
  - `creator_id` FK `users.id`
  - `language_pair_id` FK `language_pairs.id`
  - `status` enum: `waiting` | `in_progress` | `completed` (default `waiting`)
  - `max_players` int (default 4)
  - `race_mode` enum: `time` | `distance` (default `time`)
  - `race_duration_s` int (default 120) — used when `race_mode=time`
  - `total_segments` int (default 20) — used when `race_mode=distance`
  - `difficulty` enum: `easy` | `medium` | `hard` (default `medium`)
  - `noun_list_ids` json nullable — array of list IDs
  - `verb_list_ids` json nullable — array of list IDs
  - `lesson_ids` json nullable — array of lesson IDs
  - `created_at`, `updated_at`

- `derby_game_players`
  - `id`
  - `game_id` FK `derby_games.id` cascade on delete
  - `user_id` FK `users.id` nullable (or `guest_id` UUID)
  - `guest_id` uuid nullable
  - `player_name` string
  - `score` unsignedMediumInteger default 0
  - `progress` decimal(5,4) default 0.0 range 0..1 (server authoritative)
  - `is_ready` bool default false
  - `created_at`, `updated_at`

Model classes: `DerbyGame`, `DerbyGamePlayer` with relationships similar to Gender Duel models.

---

## Difficulty Design

Centralize a PHP config/enum (e.g., `App\Enums\DerbyDifficulty`) with:

- `answer_window_s`: easy 6, medium 4, hard 2.5
- `distractor_total`: easy 2, medium 3, hard 4–5
- `base_advance`: easy 1.0, medium 1.0, hard 0.9 (segment units)
- `time_bonus`: easy +0.5 @ <1.5s; medium +0.4 @ <1.0s; hard +0.35 @ <0.7s
- `streak_threshold`: easy 3; medium 4; hard 5
- `streak_boost`: easy +10% 10s; medium +12% 8s; hard +15% 6s
- `wrong_lockout_ms`: easy 600; medium 800; hard 1000
- `powerups`:
  - easy: `big_hoof`
  - medium: `big_hoof`, `draft`
  - hard: `big_hoof`, `draft`, `jam`

Use these server‑side to compute progress and client‑side to tune UI timers.

---

## Backend HTTP (Controller + Service)

Create `app/Http/Controllers/DerbyGameController.php` using `GenderDuelGameController` as a template. Routes mirror Gender Duel ones (`lobby`, `create`, `show`, `join`, `ready`, `leave`, `end`).

- `lobby()`
  - Query waiting `derby_games` for the user’s `language_pair_id`.
  - Map to props: `id`, `hostId`, `players`, `max_players`, language flags, difficulty, filters summary.
  - Provide `wsEndpoint` from `config('websocket.game_endpoint')`.

- `create(Request)`
  - Validate: `language_pair_id`, `max_players`, `difficulty`, `race_mode`, optional `race_duration_s`, `total_segments`, `noun_list_ids[]`, `verb_list_ids[]`, `lesson_ids[]`.
  - Call `DerbyGameService::createGame(user, ...)`.
  - Redirect to `derby.show` with `justCreated=true`.

- `show(DerbyGame, Request)`
  - Load players + language pair.
  - Provide an initial prompt pool OR let WS manager spawn prompts on start (recommended).
  - Return Inertia view `DerbyGame/Show` with:
    - `derby_game` state: `id`, `status`, `players[]`, `max_players`, `difficulty`, `language_name`, `source_language`, `target_language`, `race_mode`, `race_duration_s`, `total_segments`, filters.
    - `wsEndpoint`.

- `join`, `ready`, `leave`, `end`
  - Mirror Gender Duel behavior and authorization checks.

Service `App\Services\DerbyGameService`:

- `createGame` — create `DerbyGame`, add creator as player.
- `joinGame`, `leaveGame`, `markPlayerReady`, `endGame` — same patterns as Gender Duel.
- `getPromptPool(DerbyGame)` — optional; typically WS manager generates prompts on the fly using shared vocab services.

Use existing services for vocab:

- `LanguageService` (flags, language pair info)
- `NounService` for noun retrieval; add list/lesson filters
- Verb service if present for later conjugation mode

---

## WebSocket (Bun) — `DerbyManager`

Create `websocket/games/derby/DerbyManager.ts` based on `GenderDuelManager.ts`.

- Room lifecycle
  - `join_derby_game`/`player_joined`: create room set + initial `DerbyGameState` if not present; push players; broadcast state.
  - `player_ready`: mark ready; when all ready → `handleStart()`.
  - `restart_derby_game`: reinitialize state, keep same players.
  - `derby_game_end`/`player_left`: update state; cleanup if empty.

- State shape `DerbyGameState`
  - `id`, `status`
  - `players: { id, user_id, player_name, score, is_ready, progress }[]`
  - `difficulty`, `max_players`
  - `race_mode`, `race_duration_s`, `total_segments`
  - `language_name`
  - `filters: { noun_list_ids[], verb_list_ids[], lesson_ids[], language_pair_id }`
  - `current_prompt`, `last_answer`, `streaks`, `powerups`

- Messages handled
  - Inbound: `join_derby_game`, `derby_game_created`, `player_ready`, `submit_answer`, `player_left`, `derby_game_end`, `restart_derby_game`.
  - Broadcasts:
    - `derby_game_state_updated` — authoritative snapshot deltas (players, progress, status, current_prompt).
    - `prompt_spawned` — prompt payload (mode, options, answer window).
    - `answer_submitted` — who answered, correctness, echo result for UI.
    - `progress_updated` — `{ playerId, progress }` when deltas applied.

- Prompt spawning
  - On start, create a prompt loop per difficulty (e.g., every 2–4s) OR present a continuous prompt panel with per‑player lockouts (simpler: continuous panel; no global cadence; despawn only when answer is submitted).
  - Source selection respects `filters` from initial state (noun lists, verb lists, lessons, language pair).

- Answer handling
  - Validate answer vs current prompt.
  - Compute `delta` using difficulty config:
    - `delta = base_advance + time_bonus(stime) * streak_multiplier`
  - Update `player.progress = min(1.0, progress + delta)`.
  - Apply wrong‑answer lockout and set `last_answer`.
  - Finish criteria:
    - `race_mode=time`: a match timer ends race; rank by progress.
    - `race_mode=distance`: first to `>=1.0` wins; others ranked by progress.

- Timers & cleanup
  - Use per‑match timers map like `transitionTimers` in Gender Duel for race end and lockouts.
  - `cleanup(gameId)` on completion; `cleanupCompletely(gameId)` after grace period or empty room.

---

## Frontend (Inertia/React)

Pages and components under `resources/js/`.

- `Pages/DerbyGame/Lobby.tsx`
  - Mirrors Gender Duel lobby: list waiting games; create form with filters and difficulty.

- `Pages/DerbyGame/Show.tsx`
  - Parent page that wires WS, passes props to components, and handles send/receive of messages.

- Components
  - `Components/DerbyGame/Track.tsx` (graphics)
    - Lanes with horse sprites.
    - Props: `players[]` (id, name, color), `progressMap: Record<playerId, number>`, `difficulty`, `status`.
    - Movement: translate X from 0..trackWidth by progress; ease to target. Add dust/scale pulse on progress deltas.
    - Parallax background; leader highlight.
  - `Components/DerbyGame/PromptPanel.tsx`
    - Renders the active prompt (article/gender or translation) and MCQ options.
    - Times the answer window per difficulty; sends `submit_answer`.
    - Shows lockout overlay on wrong answers; shows per‑player streak meter.
  - `Components/DerbyGame/HUD.tsx`
    - Timer (for time mode), standings, difficulty badge, power‑up buttons (future).

- Styling/Assets
  - Phase 1: CSS/SVG sprites for 3–6 frame trot animation using `steps(n)` or keyframe swaps.
  - Optional Phase 2: Switch to Phaser for richer particles and camera motion.

---

## Prompt Generator

Server‑side generator that constructs prompts based on filters & difficulty.

- Modes (v1)
  - `article_gender`: show noun `word`; options are valid articles per target language derived from `gender`.
  - `translation`: direction based on `language_pair_id` (source→target or reverse), with distractors from same list(s).

- Distractors
  - `easy`: 1 distractor; unrelated or simple confuser.
  - `medium`: 2 distractors from same category/list.
  - `hard`: 3–4 plausible distractors (same gender family, look‑alikes, near translations).

- Selection pipeline
  1. Build candidate pool from chosen lists/lessons; de‑duplicate and avoid recently used.
  2. Sample prompt.
  3. Build `options[]` according to difficulty; shuffle with Fisher–Yates.
  4. Emit to WS as `prompt_spawned { prompt_id, mode, word, options, answerWindowMs }`.

---

## Message Contracts (WS)

Inbound (client → WS manager):

```jsonc
{ "type": "join_derby_game", "derbyGameId": 123, "userId": 45, "data": { /* players[], difficulty, filters, etc. from controller props */ } }
{ "type": "player_ready", "derbyGameId": 123, "userId": 45, "data": { "player_id": 789 } }
{ "type": "submit_answer", "derbyGameId": 123, "userId": 45, "data": { "prompt_id": 777, "answer": "der" | "la" | "Mesa" | "timeout", "elapsed_ms": 900 } }
{ "type": "player_left", "derbyGameId": 123, "userId": 45 }
{ "type": "restart_derby_game", "derbyGameId": 123, "userId": 45, "data": { /* fresh state */ } }
```

Outbound (WS manager → clients):

```jsonc
{ "type": "derby_game_state_updated", "data": { "status": "waiting|in_progress|completed", "players": [/* id,user_id,name,score,is_ready,progress */], "current_prompt": {/* optional */} } }
{ "type": "prompt_spawned", "data": { "prompt_id": 777, "mode": "article_gender|translation", "word": "mesa", "options": ["el","la","los"], "answerWindowMs": 4000 } }
{ "type": "answer_submitted", "data": { "playerId": 789, "userId": 45, "player_name": "Ana", "answer": "la", "correct": true } }
{ "type": "progress_updated", "data": { "playerId": 789, "progress": 0.35 } }
```

---

## Graphics & Movement

- Server authoritative `progress` in [0,1].
- Client maintains `progressTarget` and `progressVisual` per player; lerp `visual → target` for smooth movement.
- On `progress_updated`, trigger:
  - Scale pulse animation on the horse.
  - Dust particle burst (CSS or canvas).
- Parallax background scrolling tied to average of leaders’ progress.
- Leader highlight (glow or crown). Player colors distinct and stable per seat.

Assets (initial): simple SVG horses with 3–6 frames in a sprite sheet per color; lanes are styled divs with subtle shadows.

---

## Routing & Navigation

- Add Lobby/Show routes mirroring Gender Duel under `routes/web.php` (e.g., `games.derby.*`).
- Show game card under the `games` tab, following existing dashboard/lobby patterns.

---

## Validation & Security

- Only allow joining/showing games for the same `language_pair_id` as the current user (like Gender Duel).
- Cap `max_players` to 6 at most (start with 4).
- Sanitize list IDs and lessons; ensure user has access if there are visibility rules.
- Prevent spamming answers by enforcing per‑player lockouts on the WS manager (based on difficulty `wrong_lockout_ms`).

---

## Telemetry (optional)

- Log per‑prompt answer times, correctness, and common distractor picks to improve distractor generation.
- Capture finish placements and streak lengths for analytics.

---

## Testing Plan

- **Unit**: Difficulty config math for progress deltas and streaks. Prompt generator correctness and distractor counts.
- **Feature (HTTP)**: Create/join/ready/leave/end flows mirror Gender Duel; filters persist and are passed to WS props.
- **WS**: Simulate two players answering; assert progress convergence and completion in both `time` and `distance` modes.
- **UI**: Visual progress increments on `progress_updated`; timer behavior per difficulty; lockout overlay shows on wrong answers.

---

## Rollout Plan

1. DB migrations and models.
2. Controller + Service (HTTP flows) with inert prompts.
3. WS manager skeleton; wire join/ready/start and `prompt_spawned`.
4. Frontend Track + PromptPanel with basic styles; live progress updates.
5. Difficulty math; time/distance modes.
6. Filters (noun/verb lists, lessons) in create form and generator.
7. Polish: particles, streak/power‑up feedback, results view.

---

## Acceptance Criteria

- Users can create a Derby match with difficulty and optional list filters; other users with the same language pair can join.
- On “Ready” from all players, the race starts and prompts appear.
- Correct answers advance horses; faster answers and streaks yield visible extra movement.
- Race ends by timer (default 120s) or when someone reaches the finish; placements are shown.
- No Redis introduced; architecture mirrors Gender Duel: DB + Controller + Bun WS manager in‑memory state.

---

## Notes for Developers

- Follow the structure and naming conventions in `GenderDuelManager.ts` for message handling; adapt only game‑specific logic (progress instead of rounds).
- Centralize all difficulty constants in one place and import on both WS manager and frontend to avoid drift (duplicate JS constants if needed, but keep PHP canonical for server rules).
- Start with nouns + article/gender prompts; wire translation prompts second; verbs can be toggled on later without schema changes.
