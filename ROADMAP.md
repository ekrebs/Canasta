# Canasta Product Roadmap

Last updated: 2026-02-14

This document is the source of truth for implementation sequencing and delivery standards.
Use it for future LLM/human sessions to keep work aligned.

## Product Goal

Build an online, server-authoritative Canasta game that starts with mocked players/lobbies,
supports real multiplayer, then scales to authenticated public play.

## Current Baseline

- Custom Node + Next + Socket.IO server is running.
- Mock login works (`player1`, `player2`).
- Lobby list renders.
- Join/ready/leave/game actions are not complete yet.
- Game engine exists but is not rules-complete.

## Execution Principles (Apply In Every Phase)

1. Server-authoritative game state only.
2. Shared event contracts with runtime validation (Zod).
3. Idempotent actions and deterministic state transitions.
4. Reconnect-safe identity and session recovery.
5. Tests and observability are required for every feature.

## Non-Functional Targets (Define Early, Tune Later)

- Turn action p95 latency: <= 250ms (excluding network variance).
- Reconnect recovery: <= 5s to rehydrate active game state.
- Duplicate action safety: no state corruption from retries/replays.
- Availability target for beta: 99.5%+.

## Workstreams That Start In Phase 1 And Continue

1. Security/hardening:
   - Payload validation
   - Rate limiting
   - Basic abuse controls
2. Testing:
   - Engine unit tests
   - Socket integration tests (multi-client)
   - Replay determinism tests (action log -> state)
3. Observability:
   - Structured logs
   - Error reporting
   - Basic service metrics

## Phase Plan

### Phase 0: Vertical Slice (Foundation)

Goal: one complete playable loop before full rules.

Scope:
- Join lobby -> ready -> start -> deal -> draw -> discard -> end turn.
- Minimal win condition stub (for loop completion only).
- Socket event contracts + validators committed first.

Done when:
- 2 browser sessions can complete at least one full turn cycle reliably.

### Phase 1: Playable With Mock Players/Lobbies

Goal: stable multiplayer prototype with mocked identity.

Scope:
- Implement `join-lobby`, `leave-lobby`, `client-ready`.
- Broadcast `lobby-updated`, `game-started`, `game-state`.
- Add in-memory game sessions keyed by lobby ID.
- Add reconnect mapping by user ID.

Done when:
- 2-4 browser sessions can join same lobby, ready up, start game, and play turns in sync.

### Phase 2: Full Canasta Rules And Action Model

Goal: rules-complete authoritative engine.

Scope:
- Legal action generation + server validation for:
  - `deal`
  - `draw-stock`
  - `draw-pile`
  - `meld`
  - `discard`
  - `go-out`
  - `end-turn`
- Frozen pile logic, wild card constraints, red 3 handling, going-out constraints.
- Round scoring and multi-round game completion.

Done when:
- Engine test suite covers critical rules and rejects illegal actions consistently.

### Phase 3: Neon Postgres Persistence

Goal: survive restarts and enable history.

Scope:
- Add DB schema and migrations for users, lobbies, memberships, games, turns, actions, scores.
- Persist action log + periodic snapshots.
- Rehydrate active lobbies/games on server start.

Done when:
- Active games survive restart with no manual repair.

### Phase 4: AI Players (Difficulty Tiers)

Goal: replace missing humans with bots using same action system.

Scope:
- Bot interface over legal actions.
- Easy: random valid move.
- Medium: heuristic policy.
- Hard: bounded lookahead/expected-value policy.

Done when:
- Human can complete full game against 1-3 bots at all difficulties.

### Phase 5: Clerk Authentication

Goal: replace mock identity with real auth.

Scope:
- Clerk sign-in/sign-up integration.
- Verify Clerk auth in API + socket handshake.
- Map Clerk user IDs to internal player profiles.
- Remove mock login route path from primary flow.

Done when:
- Only authenticated users can connect/play, and reconnect identity is stable.

### Phase 6: Public Multiplayer Hardening

Goal: production readiness for wider audience.

Scope:
- Load testing and soak testing.
- Stronger abuse mitigation and moderation hooks.
- SLO dashboards and alerting.
- Runbooks (incident, rollback, migration).

Done when:
- Service is stable under expected concurrency and operationally supportable.

## Suggested Immediate Backlog (Next 2 Weeks)

1. Implement Phase 0 vertical slice events + reducers end-to-end.
2. Add Zod schemas for all socket payloads and outbound events.
3. Add integration test: two clients join, ready, start, draw/discard one turn.
4. Add replay determinism test around turn actions.
5. Add reconnect recovery for active lobby/game state.

## Session Workflow For Future LLMs

1. Read this file first.
2. Pick exactly one phase milestone and one test milestone per PR.
3. Do not add new events without schema + tests.
4. Keep transport concerns separate from engine rules logic.
5. Update this file after each milestone with date and status.

## Milestone Log

- 2026-02-14: Initial roadmap created from architecture review and planning session.
- 2026-02-14: Phase 0 implementation started. Added authoritative lobby join/leave/ready and game action loop (`draw-stock`, `discard`, `end-turn`) over Socket.IO, plus client controls to drive the loop with mock users.
- 2026-02-16: Phase 0 → Phase 1 transition started.
  - ✅ Installed Vitest test framework
  - ✅ Created Game engine unit tests (25 passing)
  - ✅ Created socket integration test scaffold
  - ✅ Implemented structured logging utility with context tracking
  - ✅ Updated all socket event handlers to use logger
  - ✅ Installed Zod for payload validation
  - ✅ Created Zod schemas for all socket payloads (incoming + outgoing)
  - ✅ Added validatePayload utility with proper error handling
  - ✅ Integrated payload validation into all socket event handlers
  - 🏗️ Next: Debug draw/discard/end-turn actions in gameplay, add reconnect recovery
