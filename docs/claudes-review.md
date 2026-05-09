# Claude's Architectural Review — Naksha Codebase

Last updated: 2026-05-09 (third pass — post profile source-of-truth sprint)
Reviewer: Claude (Sonnet 4.6)
Scope: source code + all migrations through `20260508021500_chart_preferences.sql`
Verification: `cd client && npx tsc --noEmit` passes with zero errors.

---

## 1. Current Status Summary

The codebase has completed a meaningful source-of-truth consolidation sprint. `public.users` is now the durable authority for profile and birth data; `auth.user_metadata` is intentionally limited to the signup/bootstrap handoff for `handle_new_user` and a legacy repair fallback in Dashboard. Chart preferences have moved out of auth metadata into a dedicated `public.chart_preferences` table with proper RLS, CHECK constraints, and an `updated_at` trigger.

The remaining open risks are narrower than before: chart preferences are stored correctly but still not wired to chart math, chart save ownership is unresolved, and foundational tooling (tests, lint) is absent.

---

## 2. Resolved Since Last Review

### Schema / Migrations

| Item | Resolution |
|---|---|
| No migrations in repo | `supabase/migrations/` now contains the remote schema dump plus six incremental migrations. Schema contract is reproducible from source. |
| Two contradictory unique constraints on `charts` | `20260508021000`: both old constraints dropped; `charts_unique_canonical_birth_identity` created as `UNIQUE INDEX … NULLS NOT DISTINCT` on `(user_id, birth_date, birth_time, time_zone, birth_lat, birth_lon)`. |
| `handle_new_user` trigger omitted `birth_lat`/`birth_lon` | `20260508021100`: trigger rewritten with per-field exception-safe casts, coordinates added to INSERT and ON CONFLICT DO UPDATE. Gains `SET search_path = public`. |
| Client INSERT policy on `purchases` allowed self-granting | `20260508021200`: `"Insert own purchases"` policy dropped. |
| `journals.chart_id` FK blocked chart deletion | `20260508021300`: FK recreated with `ON DELETE SET NULL`. |
| Email confirmations disabled in local dev | `config.toml`: `enable_confirmations = true`. |
| `updated_at` never auto-refreshed on `users` or `charts` | `20260508021400`: `BEFORE UPDATE` triggers wired to both tables using the existing `set_updated_at()` function. |
| Chart preferences in auth metadata, no DB table | `20260508021500`: `public.chart_preferences` table created with `user_id` PK, FK to `users(id) ON DELETE CASCADE`, `NOT NULL` columns with supported-value CHECK constraints (`house_system in ('whole_sign')`, `zodiac_type in ('tropical')`, `orb_mode in ('medium')`), `updated_at` trigger, full RLS (SELECT/INSERT/UPDATE to `authenticated`), and grants. |

### Frontend

| Item | Resolution |
|---|---|
| `saveChart` / `useChartData` / Dashboard chart lookup used different identity columns | All three now use the canonical 6-column identity. `saveChart` throws if coordinates are null. Dashboard and hook skip save when coordinates are missing. |
| Missing-coordinate charts had confusing save state | `'View Only'` button (disabled) with inline explanatory card. |
| `CompleteProfileScreen` did not forward coordinate setters | `setBirthLat`/`setBirthLon` forwarded; typing a new location clears stale coordinates. |
| OpenCage annotations not read; timezone never updated on pick | `no_annotations=1` removed. Timezone propagated from geocode result on autocomplete selection and on manual-location geocoding fallback. |
| `CheckEmailScreen` OTP success navigation was implicit | `navigation.reset` now routes deterministically to `Dashboard` or `CompleteProfile` after upsert. |
| Profile/birth data types duplicated across four files | `client/lib/domainTypes.ts` exports canonical `UserProfileFields`, `UserRow`, `ChartProfile`, `ChartRouteParams<T>`. |
| `CompleteProfileScreen` mirrored birth data into auth metadata on every save | `supabase.auth.updateUser` birth-field call removed from `onSave`. `public.users` is the sole write target after profile edits. |
| Chart preferences stored in `pref_*` auth metadata keys | `ProfileScreen` now reads from `public.chart_preferences` on load (creates row with defaults on first visit), and upserts to `public.chart_preferences` on preference change. No `pref_*` keys are written to auth metadata. |
| `public.users` vs `auth.user_metadata` ownership ambiguous | Resolved. See §3.1 below for the current intentional contract. |
| `ChartScreen` could crash from missing deep-link params | `route.params` now accessed with optional chaining; the missing-profile guard renders an error view with a "Back to Dashboard" button. |
| Unsupported chart preferences were selectable and saved | Unsupported options disabled in UI, `supportedChartPreferences` allowlist filters before DB write, and DB CHECK constraints reject any unsupported value at the database level — three enforcement layers. |

---

## 3. Remaining Architectural Risks

### 3.1 — auth.user_metadata role is now intentionally limited (INFO, not a risk)

The current intended contract:

- **Signup** (`SignupScreen` → `signUpWithEmail`): writes all 8 profile/birth fields into `options.data` so that `handle_new_user` can populate `public.users` at `auth.users` INSERT time. This write is required and must remain — it is the only mechanism for the email-link verification path where `CheckEmailScreen` is bypassed.
- **CheckEmailScreen**: after OTP verification, upserts route-param profile into `public.users` directly.
- **Dashboard repair path**: if `public.users` is incomplete (older accounts, edge cases), reads auth metadata and merges into `public.users`. One-time recovery, not a display path.
- **All display and edit paths**: read exclusively from `public.users`.
- **Chart preferences**: now in `public.chart_preferences`. No `pref_*` keys are written to auth metadata.

Stale `pref_*` keys remain in auth metadata for existing users who previously saved preferences. They are now inert — nothing reads them. A future cleanup migration or a one-time `supabase.auth.updateUser({ data: { pref_house_system: null, ... } })` on load can clear them, but this is low priority.

---

### 3.2 — Chart preferences stored correctly but not applied to chart math (LOW urgency, HIGH user trust risk)

`public.chart_preferences` stores each user's chosen house system, zodiac type, and orb mode. `buildChartData` and `findAspects` in `lib/astro.ts` still use hardcoded Whole Sign houses, Tropical zodiac, and fixed orbs. Unsupported options are visually disabled in `ProfileScreen`, so users cannot accidentally save non-functional values. But even selecting "Standard fixed orbs" (the only active orb option) produces no observable difference because it was already the hardcoded behavior.

**Risk**: Low immediate confusion (unsupported options are clearly marked), but the preferences table is inert data until chart math reads it.

---

### 3.3 — Chart save ownership is unresolved (MEDIUM, UX clarity)

Auto-save runs in both `DashboardScreen.load` and `useChartData.loadChart`. The manual "Save Chart Data" / "Already Saved" / "View Only" button in `ChartScreen` is correct for the no-coordinate case, but for coordinate-bearing charts the auto-save typically fires before the user can tap. There is no explicit product decision about whether persistence is fully automatic, manual, or both.

**Risk**: The button shows "Already Saved" immediately in normal use, which is accurate but feels like a non-feature. A deliberate choice and matching UX copy would clarify this.

---

### 3.4 — No test or lint scripts (ONGOING)

`client/package.json` has `start`, `android`, `ios`, `web` only. No `test` or `lint` script. TypeScript compilation is the only automated correctness check.

---

### 3.5 — Large components still need gradual decomposition (ONGOING)

| File | Lines | Primary concern |
|---|---|---|
| `ProfileScreen.tsx` | ~524 | Account, preferences, subscriptions, purchases, privacy, delete — 6 concerns |
| `DashboardScreen.tsx` | ~376 | Profile repair + chart generation + UI |
| `CompleteProfileScreen.tsx` | ~341 | Data load + geocoding + timezone inference + UI |
| `useChartData.ts` | ~305 | Load + lookup + hydrate + compute + save |
| `InterpretationModal.tsx` | ~292 | Circular pager + modal shell |
| `ChartScreen.tsx` | ~272 | Layout + interpretation assembly |

`CompleteProfileScreen.tsx` note: the `auth metadata sync` concern listed previously is now resolved; the remaining coupling is geocoding + timezone inference + UI in one file.

---

### 3.6 — ProfileScreen uses a local `DBUser` type instead of `UserRow` from domainTypes (LOW)

`ProfileScreen.tsx` still declares a local `DBUser` type (matching `UserRow` exactly) rather than importing from `client/lib/domainTypes.ts`. This is the last screen with an unreplaced local profile type.

---

### 3.7 — Broader DB cleanup remains future work (LOW, not blocking)

- `users` and `charts` timestamps use `TIMESTAMP WITHOUT TIME ZONE`; `journals` and `chart_preferences` use `WITH TIME ZONE`.
- No secondary indexes on `journals(user_id)`, `conversations(user_id)`, `messages(conversation_id)`.
- `conversations` and `messages` tables exist with full RLS, but `ChatScreen.tsx` and `lib/conversations.ts` are empty stubs.
- `usage_events.user_id` is nullable but INSERT RLS requires `user_id = auth.uid()`.
- EXECUTE on `handle_new_user` still granted to `anon` and `authenticated`.
- Stale `pref_*` keys in auth metadata for pre-migration users (inert, low priority).

---

## 4. Recommended Next 5 Tasks

Ranked by user impact × risk reduction × demo value.

**1. Wire chart preferences to chart math** *(highest user trust impact)*
Read `house_system`, `zodiac_type`, and `orb_mode` from `public.chart_preferences` (or pass them through from ProfileScreen state) into `buildChartData` and `findAspects`. The DB CHECK constraints and UI guards already limit values to the implemented defaults, so this is a read-path addition rather than a new feature. Expand the CHECK constraints as each new system is implemented.
Files: `lib/astro.ts`, `lib/charts.ts`, `hooks/useChartData.ts`, potentially `DashboardScreen.tsx`.

**2. Decide and simplify chart save semantics**
Choose one clear rule: auto-save only (remove the manual button or repurpose it), or an explicit save action. Update `DashboardScreen`, `useChartData`, and `ChartScreen` copy and side effects to match. The current "Already Saved" state is technically correct but unintuitive.
Files: `DashboardScreen.tsx`, `hooks/useChartData.ts`, `screens/ChartScreen.tsx`.

**3. Replace `ProfileScreen`'s local `DBUser` with `UserRow`**
One-line change: remove the local `DBUser` declaration and import `UserRow` from `domainTypes`. Eliminates the last unreplaced local profile type.
File: `client/screens/ProfileScreen.tsx`.

**4. Add ESLint and a test runner**
Add `eslint` and `test` scripts to `package.json`. Add at minimum: `buildChartData` round-trip, `normalizeZone` edge cases, `supportedChartPreferences` allowlist, `isProfileComplete` boundary conditions.
Files: `client/package.json`, new test files.

**5. Generate or centralize Supabase row types**
Replace the remaining hand-written row types (`SubscriptionRow`, `PurchaseRow` in `ProfileScreen`) with types derived from the actual schema, or move them into `domainTypes.ts`. `SubscriptionRow` is currently missing `created_at` which the query orders by — a compile-time-invisible mismatch.
Files: `client/lib/domainTypes.ts`, `client/screens/ProfileScreen.tsx`.

---

## 5. Agent Instructions Going Forward

**Current data ownership contract — do not violate:**

- `public.users` — authoritative for all profile and birth data after signup. All read and edit paths use this table.
- `auth.user_metadata` — intentionally limited to: (a) signup handoff for `handle_new_user`, (b) legacy Dashboard repair for accounts with an incomplete `users` row. Do not add new writes to auth metadata for profile or birth fields.
- `public.chart_preferences` — authoritative for chart preferences (house system, zodiac type, orb mode, show house degrees). `ProfileScreen` is the only writer. Do not write `pref_*` keys to auth metadata.
- Stale `pref_*` keys in auth metadata: inert, do not read them, do not write them.

**What changed that affects how you work here:**

- `client/lib/domainTypes.ts` is the canonical location for `UserRow`, `UserProfileFields`, `ChartProfile`, `ChartRouteParams`. Import from there; do not declare local aliases.
- `saveChart` throws if coordinates are null. Always assert `hasChartIdentityCoordinates(input)` before calling it.
- Chart identity is `(user_id, birth_date, birth_time, time_zone, birth_lat, birth_lon)`. All three call sites (save, dashboard lookup, hook lookup) use all six columns.
- `public.chart_preferences` CHECK constraints currently allow only `'whole_sign'`, `'tropical'`, and `'medium'`. When implementing a new preference value, update the CHECK constraint in a new migration before writing that value from the frontend.
- New migrations must be incremental files in `supabase/migrations/` with timestamp prefix. Do not edit `20260508015720_remote_schema.sql`.
- Run `supabase db diff` to verify intent before and after any schema change.
- Run `cd client && npx tsc --noEmit` before any handoff. Zero errors required.

**What not to touch casually:**
- `client/.env`
- `client/android/`
- `client/lib/lexicon/` (product prose)
- `ChartData` JSON shape (stored in Supabase rows)
- `handle_new_user` trigger — any new profile field must be added to both the INSERT and ON CONFLICT DO UPDATE paths, and the signup metadata write in `SignupScreen` must include it
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
