# Verb Conjugation Slot — Developer Guide

This guide explains how to run the Verb Conjugation Slot Machine game locally, how to import data, and how to test the game end-to-end.

## Prerequisites
- PHP/Laravel app running (see project README for standard setup)
- Bun runtime (required for the websocket server; can also be used to run scripts)
- Node.js is optional if you prefer Bun for frontend scripts; otherwise pnpm/npm work fine

## Local Run — Frontend + Backend
1. Install deps and start Vite dev server (choose one)
   - Using Bun (recommended):
     ```bash
     bun install
     bun run dev
     ```
   - Using npm:
     ```bash
     npm install
     npm run dev
     ```
2. Start Laravel app (via Sail, Valet, or your usual setup)
3. Ensure environment has an app URL (e.g., http://localhost:8000 or http://lengofy.test)

## WebSocket Server
The VCS multiplayer game uses a Bun-based websocket server. Scripts are declared in `package.json`.

- Start the server in dev mode:
  - Using Bun (native):
    ```bash
    bun run ws
    # Internally runs: bun run websocket/server.ts
    ```
  - Using npm (delegates to Bun under the hood via the script):
    ```bash
    npm run ws
    ```

- Build and run in prod mode:
  - Using Bun:
    ```bash
    bun run ws:build
    bun run ws:prod
    ```
  - Using npm:
    ```bash
    npm run ws:build
    npm run ws:prod
    ```

- Default local endpoint: `ws://localhost:6001`

The frontend page `resources/js/Pages/VerbConjugationSlotGame/Show.tsx` expects to receive `wsEndpoint` from the backend when rendering. For local dev you can pass `ws://localhost:6001` from your controller.

> Note: There is no `config/websocket.php` file at the moment. If you prefer a config‑driven approach, expose the endpoint via a Laravel config or env and pass it to the Inertia page props.

## Data Import (JSON → DB)
Use the Artisan import command documented in `docs/conjugations-import.md` to load pronouns, tenses, verbs, and conjugations.

- Command:
  ```bash
  php artisan conjugations:import {language}
  ```
  - Example:
    ```bash
    php artisan conjugations:import de
    php artisan conjugations:import es
    php artisan conjugations:import en
    ```

- Expected directory structure (per language):
  ```
  database/seeds/verbs/{language}/conjugations/
    ├─ pronouns.json
    ├─ tenses.json
    ├─ verbs.json
    └─ conjugations.json
  ```

- JSON schemas and examples are documented here:
  - `docs/verb-conjugation-slot-json.md`
  - Additional schema/ERD: `docs/conjugations-schema.md`

## Launching the Game
- Practice page route: typically `games.verb-conjugation-slot.practice`
- Multiplayer page route: typically `games.verb-conjugation-slot.show`
- Lobby route: typically `games.verb-conjugation-slot.lobby`

Navigate to the corresponding routes from the Dashboard or directly via the URL.

## Normalization & Answer Matching
- Server compares expected vs submitted answers using Unicode NFKC normalization + trim + lowercase.
- See `websocket/games/verb-conjugation-slot/VerbConjugationSlotManager.ts` (`handleSubmitConjugation`) for details.

## Testing
- Unit/Component tests (choose one):
  - Using Bun:
    ```bash
    bun run test
    ```
  - Using npm:
    ```bash
    npm run test
    ```
  - `resources/js/__tests__/VerbConjugationSlotGame/Show.multiplayer-sync.test.tsx` verifies multiplayer sync & scoring payload
  - `resources/js/__tests__/VerbConjugationSlotGame/Practice.timers.test.tsx` verifies Practice structure and timers (uses fake timers)

- Backend (Laravel) tests and setup
  1) One-time test environment setup
     ```bash
     cp .env.example .env.testing
     php artisan key:generate --env=testing
     php artisan migrate --env=testing
     ```

  2) Run all backend tests
     ```bash
     php artisan test --env=testing
     ```

  3) Run only the import command tests
     ```bash
     php artisan test --env=testing --filter=ImportConjugationsTest
     ```

  4) Manually run the import command (uses JSON from database/seeds/verbs/{lang}/conjugations/)
     ```bash
     php artisan conjugations:import de
     php artisan conjugations:import es
     php artisan conjugations:import en
     ```
     - Required files per language directory:
       - `pronouns.json`, `tenses.json`, `verbs.json`, `conjugations.json`
     - See `docs/conjugations-import.md` and `docs/verb-conjugation-slot-json.md` for schemas and examples.

- Manual E2E checklist:
  - Ready flow transitions to `in_progress` when all players are ready; host auto‑spins if no prompt yet
  - Reels align with prompt on both clients
  - Countdown timer (15s) resets each round
  - Both players’ correct answers are accepted; scores update

## Troubleshooting
- If reels occasionally stop blank in dev, check the console for `[VCS GameArea] stop index not found` warnings; pools will clamp safely but ensure datasets include all prompt components.
- If answers appear incorrect on Player 2 only, verify `spin_result` is received, and compare normalized strings in the logs (`[VCS Show] submit called` / `[VCS WS] compare`).
