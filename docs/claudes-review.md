# Claude's Architectural Review — Naksha Codebase

Last updated: 2026-05-08 (second pass — post-migration sprint review)
Reviewer: Claude (Sonnet 4.6)
Scope: source code + all migrations through `20260508021300_journals_chart_delete_set_null.sql`
Verification: `cd client && npx tsc --noEmit` passes with zero errors.

---

## 1. Current Status Summary

The codebase is in materially better shape than the initial review. The highest-risk data integrity bugs (contradictory chart constraints, missing coordinate propagation, client-writable purchase records, silent chart deletion failure) are resolved in migrations. The frontend is consistent with the new DB contract. Several long-standing UX ambiguities (save button states, post-verification navigation, timezone propagation on location pick) are resolved. Shared domain types reduce per-screen type drift.

The remaining open risks are lower-severity: scaffolded features that are inert rather than dangerous, two systems that own profile data without a merge authority, and missing DB-level automation (`updated_at` triggers on `users` and `charts`). These are appropriate candidates for the next sprint.

---

## 2. Resolved Since Last Review

### Schema / Migrations

| Item | Resolution |
|---|---|
| No migrations in repo | `supabase/migrations/` now contains the remote schema dump plus four incremental migrations. Schema contract is reproducible from source. |
| Two contradictory unique constraints on `charts` | `20260508021000`: both old constraints dropped; `charts_unique_canonical_birth_identity` created as a `UNIQUE INDEX … NULLS NOT DISTINCT` on `(user_id, birth_date, birth_time, time_zone, birth_lat, birth_lon)`, then attached as a named constraint. `NULLS NOT DISTINCT` treats `(NULL, NULL)` coordinates as a single identity. |
| `handle_new_user` trigger omitted `birth_lat`/`birth_lon` | `20260508021100`: trigger rewritten with per-field exception-safe casts (`BEGIN … EXCEPTION WHEN others THEN v_field := null END`), `birth_lat`/`birth_lon` added to INSERT and ON CONFLICT DO UPDATE with `coalesce` pattern. Trigger also gains `SET search_path = public`. |
| Client INSERT policy on `purchases` allowed self-granting | `20260508021200`: `"Insert own purchases"` policy dropped. |
| `journals.chart_id` FK blocked chart deletion | `20260508021300`: FK recreated with `ON DELETE SET NULL`. Deleting a chart now nullifies the `chart_id` on linked journals instead of raising an FK violation. |
| Email confirmations disabled in local dev | `config.toml`: `enable_confirmations = true`. OTP verification flow is now testable locally via Inbucket (port 54324). |

### Frontend

| Item | Resolution |
|---|---|
| `saveChart` / `useChartData` / Dashboard chart lookup used different identity columns | All three now use the canonical 6-column identity `(user_id, birth_date, birth_time, time_zone, birth_lat, birth_lon)`. `saveChart` throws if coordinates are null. Dashboard and hook skip save when coordinates are missing. |
| Missing-coordinate charts were silently unsaved, button states confusing | Charts without coordinates are computed and displayed but never persisted. Button shows `'View Only'` (disabled). An inline card explains that a birth location is needed to save. |
| `CompleteProfileScreen` did not pass coordinate setters to `ProfileFields` | `setBirthLat` and `setBirthLon` now forwarded; typing a new location clears stale coordinates immediately. |
| OpenCage API called with `no_annotations=1`; timezone never updated on pick | `no_annotations=1` removed. `GeocodeResult.timeZone` now carries the IANA name from `annotations.timezone.name`. `ProfileFields.onSelectLocation` calls `normalizeZone` and, if valid, updates `setTimeZone`. `CompleteProfileScreen.onSave` also updates `normalized` from geocode result before the DB write. |
| `CheckEmailScreen` OTP success left navigation implicit | After successful OTP + profile upsert, `navigation.reset` now routes deterministically to `Dashboard` (profile complete) or `CompleteProfile` (profile incomplete). Commented-out block removed. |
| Profile data types duplicated across four screens/hooks | `client/lib/domainTypes.ts` exports `UserProfileFields`, `UserRow`, `ChartProfile`, `ChartRouteParams<T>`. Local `User`, `DBUser`, `ProfileForChart`, `RouteParams` types removed from `DashboardScreen`, `CompleteProfileScreen`, `ChartScreen`, `useChartData`. |

---

## 3. Remaining Architectural Risks

### 3.1 — Chart preferences are scaffolding, not applied (LOW urgency, HIGH user trust risk)

`ProfileScreen` allows selecting house system (Placidus, Equal House, Whole Sign), zodiac type (Tropical, Sidereal), and orb mode. These are written to `auth.user_metadata` but never read by `buildChartData` or `findAspects`. Orbs in `lib/astro.ts` are hardcoded constants. Users who change preferences see no change in their chart output.

**Risk**: erodes trust. Preference options should be either wired or visually marked non-interactive.

---

### 3.2 — Profile data in two systems with no merge authority (MEDIUM)

Birth details live in both `public.users` and `auth.user_metadata`. The data flows are:

- `handle_new_user` reads `auth.raw_user_meta_data` and writes `public.users` at signup (auth metadata → users, one-time).
- `DashboardScreen` reads auth metadata and merges it into `public.users` only when the `users` row is incomplete (auth metadata → users, repair path only).
- `CompleteProfileScreen` explicitly writes both `public.users` and auth metadata on save.
- There is no general `public.users` → auth metadata reconciliation. Edits made directly to the `users` row (e.g., via Supabase Studio) are never reflected in auth metadata, and `ProfileScreen` reads preferences exclusively from auth metadata.

`ProfileScreen` reads preferences from auth metadata only, not from `users`. Any profile field stored in only one system can silently diverge.

**Risk**: stale display data and hard-to-diagnose inconsistencies as the app grows.

---

### 3.3 — `updated_at` auto-trigger missing on `users` and `charts` (LOW, easy fix)

`set_updated_at()` trigger function exists and is wired to `journals`. It is not wired to `users` or `charts`. `users.updated_at` is set by `handle_new_user`'s ON CONFLICT DO UPDATE path but not by subsequent `UPDATE` calls from `CompleteProfileScreen`. `charts.updated_at` is frozen at insert time — the upsert never refreshes it.

**Risk**: `updated_at` columns on both tables are unreliable for ordering or change detection.

---

### 3.4 — Deep link to `naksha://chart` without params can crash (LOW, easy fix)

`App.tsx` linking config exposes `Chart: 'chart'`. `ChartScreen` destructures `route.params` and immediately accesses required fields on `profile`. If `naksha://chart` is opened without params, `profile` is `undefined` and the access throws.

**Risk**: rare in practice (the link is not advertised), but any deep link tester or future share-chart feature will hit it.

---

### 3.5 — No test or lint scripts (ONGOING)

`client/package.json` has `start`, `android`, `ios`, `web` only. No `test` or `lint` script. TypeScript compilation (`npx tsc --noEmit`) is the only automated correctness check. No coverage of auth flows, chart generation math, chart persistence, or interpretation page building.

---

### 3.6 — Large components still need gradual decomposition (ONGOING)

| File | Lines | Primary concern |
|---|---|---|
| `ProfileScreen.tsx` | ~524 | 6 concerns: account, preferences, subscriptions, purchases, privacy, delete |
| `DashboardScreen.tsx` | ~376 | Profile repair + chart generation + UI |
| `useChartData.ts` | ~305 | Load + lookup + hydrate + compute + save |
| `CompleteProfileScreen.tsx` | ~341 | Data load + geocoding + auth metadata sync + UI |
| `InterpretationModal.tsx` | ~292 | Circular pager + modal shell |
| `ChartScreen.tsx` | ~272 | Layout + interpretation assembly |

---

### 3.7 — Broader DB cleanup remains future work (LOW, not blocking)

Items identified in the schema pass that no migration addressed yet:

- `users` and `charts` timestamps use `TIMESTAMP WITHOUT TIME ZONE`; `journals` uses `WITH TIME ZONE`. Inconsistent serialization.
- No secondary indexes on `journals(user_id)`, `conversations(user_id)`, `messages(conversation_id)`.
- `conversations` and `messages` tables are fully defined in the DB with RLS, but `ChatScreen.tsx` is empty and `lib/conversations.ts` is a stub.
- `usage_events.user_id` is nullable but the INSERT RLS policy requires `user_id = auth.uid()`, preventing the anonymous-event use case the schema implies.
- EXECUTE on `handle_new_user` still granted to `anon` and `authenticated` (unnecessary privilege).

---

## 4. Recommended Next 5 Tasks

Ranked by user impact × risk reduction × demo value.

**1. Wire or visually disable chart preferences** *(highest user trust impact)*
Either read `house_system`, `zodiac_type`, and `orb_mode` from auth metadata in `buildChartData` / `findAspects`, or disable the non-default options in `ProfileScreen` with a visible label. Active preferences that have no effect are a trust problem before a technical one.
Files: `ProfileScreen.tsx`, `lib/astro.ts`, `lib/charts.ts`.

**2. Add `updated_at` triggers to `users` and `charts`** *(low risk, high correctness value)*
One migration: two `CREATE TRIGGER` statements using the existing `set_updated_at()` function. Makes `updated_at` trustworthy for sorting and change detection on both tables.
File: new migration `supabase/migrations/YYYYMMDDHHMMSS_updated_at_triggers.sql`.

**3. Guard ChartScreen against missing route params** *(low risk, prevents rare crash)*
Add a null check on `route.params` before destructuring. Route to an error screen or back to Dashboard if params are absent.
File: `client/screens/ChartScreen.tsx`.

**4. Establish single profile source of truth** *(medium effort, prevents long-term divergence)*
Decide: `public.users` is authoritative; auth metadata is a cache. Remove writes to auth metadata from `CompleteProfileScreen` and `ProfileScreen`. Let the `handle_new_user` trigger remain as the initial write only. Read preferences from a `chart_preferences` table instead of auth metadata.
Files: `CompleteProfileScreen.tsx`, `ProfileScreen.tsx`, new migration.

**5. Add ESLint and a test runner** *(foundational for maintainability)*
Add `eslint` script to `package.json` (config already present). Add `jest` or `vitest` with at least three tests: `buildChartData` round-trip, `normalizeZone` edge cases, `isProfileComplete` boundary conditions.
File: `client/package.json`, new test files.

---

## 5. Agent Instructions Going Forward

**What changed that affects how you work here:**

- `client/lib/domainTypes.ts` is now the canonical location for `UserRow`, `UserProfileFields`, `ChartProfile`, `ChartRouteParams`. Do not add new local type aliases for these shapes — import from `domainTypes`.
- `saveChart` now throws if coordinates are null. Never call it without first asserting `hasChartIdentityCoordinates(input)`.
- Chart identity is `(user_id, birth_date, birth_time, time_zone, birth_lat, birth_lon)`. All three call sites (save, dashboard lookup, hook lookup) must use all six columns.
- New migrations must be incremental files in `supabase/migrations/` with timestamp prefix. Do not edit the remote schema dump.
- Run `supabase db diff` to verify intent before and after any schema change.
- Run `cd client && npx tsc --noEmit` before any handoff. Zero errors required.

**What not to touch casually:**
- `client/.env`
- `client/android/`
- `client/lib/lexicon/` (product prose)
- `ChartData` JSON shape (stored in Supabase rows)
- `handle_new_user` trigger (any new profile field must be added to both the INSERT and ON CONFLICT DO UPDATE paths)
- `charts_unique_canonical_birth_identity` constraint and `CHART_IDENTITY_CONFLICT_TARGET` constant — must change atomically together

**Verification commands:**
```bash
cd client && npx tsc --noEmit      # must pass before any handoff
cd client && npm run start         # Expo dev server
supabase db diff                   # verify migration intent
supabase db reset                  # apply all migrations locally
```

**Remaining tooling gaps:**
- No `npm test` script
- No `npm run lint` script
- No `supabase db push` in CI
