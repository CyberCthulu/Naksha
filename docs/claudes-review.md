# Claude's Architectural Review — Naksha Codebase

Last updated: 2026-05-11 (eighth pass — post auth navigation and chart helper tests)
Reviewer: Claude (Sonnet 4.6)
Scope: source code + all migrations through `20260508021500_chart_preferences.sql`
Verification: `cd client && npm run typecheck` passes with zero errors. `npm test` passes (7 suites, 35 tests). Working tree clean.

---

## 1. Current Status Summary

The stabilization sprint is complete. Persisted `chart_data` is now validated before use (`parseChartData` in `client/lib/chartDataValidation.ts`). Auto-save failures are surfaced to users via a `saveWarning` card in `ChartScreenContent`. `AuthCallbackScreen` URL-deduplication guard was replaced with URL-keyed refs (`processingUrl`/`handledUrl`), all token-hash-exposing logs were removed, and auth errors now show an `Alert`. `useChartData` acquired a mounted/load-ID cancellation guard. `upsertJournal` no longer sends `id: undefined` in create mode. `CompleteProfileScreen` top dead space was fixed by removing the redundant inset duplication. A Jest test runner (`jest-expo`) is configured with 7 suites and 35 passing tests, including `useChartData` branch coverage, chart generation/persistence helper coverage, and auth/profile navigation screen coverage.

`ProfileScreen` presentational and interactive cards have been extracted to `client/components/profile/`. Shared profile completeness helpers live in `client/lib/profileCompletion.ts`. `ChartScreen` is a route-validation shell; all hooks and rendering live in `ChartScreenContent`.

The remaining open risks are: chart preferences not wired to chart math, guest chart creation UI not built, no ESLint script, Supabase types still hand-maintained, and large-component decomposition ongoing.

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
| Chart preferences in auth metadata, no DB table | `20260508021500`: `public.chart_preferences` table created with `user_id` PK, FK to `users(id) ON DELETE CASCADE`, `NOT NULL` columns with supported-value CHECK constraints, `updated_at` trigger, full RLS, and grants. |

### Frontend

| Item | Resolution |
|---|---|
| `saveChart` / `useChartData` / Dashboard chart lookup used different identity columns | All three use the canonical 6-column identity. `saveChart` throws if coordinates are null. Dashboard and hook skip save when coordinates are missing. |
| Missing-coordinate charts had confusing save state | `'View Only'` button (disabled) with inline explanatory card. Preserved through this slice. |
| `CompleteProfileScreen` did not forward coordinate setters | `setBirthLat`/`setBirthLon` forwarded; typing a new location clears stale coordinates. |
| OpenCage annotations not read; timezone never updated on pick | `no_annotations=1` removed. Timezone propagated from geocode result on autocomplete and manual-geocode fallback. |
| `CheckEmailScreen` OTP success navigation was implicit | `navigation.reset` routes deterministically to `Dashboard` or `CompleteProfile` after upsert. |
| Profile/birth data types duplicated across four files | `client/lib/domainTypes.ts` exports `UserProfileFields`, `UserRow`, `ChartProfile`, `ChartRouteParams<T>`, `ChartMode`, `SubscriptionRow`, `PurchaseRow`. All local aliases removed from consuming screens. |
| `SubscriptionRow` missing `created_at` despite query ordering by it | `created_at: string \| null` added to `SubscriptionRow` in `domainTypes.ts`. Compile-time-invisible mismatch resolved. |
| `CompleteProfileScreen` mirrored birth data into auth metadata on every save | `supabase.auth.updateUser` birth-field call removed. `public.users` is the sole write target after profile edits. |
| Chart preferences stored in `pref_*` auth metadata keys | `ProfileScreen` reads/writes `public.chart_preferences`. No `pref_*` keys are written to auth metadata. |
| `public.users` vs `auth.user_metadata` ownership ambiguous | Resolved. See §3.1 for the current intentional contract. |
| `ChartScreen` could crash from missing deep-link params | `route.params` accessed with optional chaining; missing-profile guard renders error view with "Back to Dashboard". |
| Unsupported chart preferences were selectable and saved | Three enforcement layers: UI disabled, `supportedChartPreferences` allowlist, DB CHECK constraints. |
| Chart save ownership unclear; ambiguous auto-save/manual-save semantics | **Product rule now explicit**: self charts (`chartMode: 'self'`) auto-save on load; guest charts (`chartMode: 'guest'`) skip auto-save and rely on manual save. `ChartRouteParams` carries `chartMode?: ChartMode`. `DashboardScreen` passes `chartMode: 'self'`. `useChartData` wraps auto-save in `if (chartMode === 'self')`. Missing-coordinate charts remain `'View Only'` regardless of mode. No schema change required. |
| `npm run typecheck` not available as a script | `client/package.json`: `"typecheck": "tsc --noEmit"` added. |
| `isProfileComplete` / `needsProfileCompletion` duplicated between `DashboardScreen` and `CheckEmailScreen` | Extracted to `client/lib/profileCompletion.ts`; both screens import from there. `ProfileCompletionData` type is the canonical shape for the six required fields. |
| `ProfileScreen` at ~524 lines mixing 6 concerns | Presentational cards extracted to `client/components/profile/`: `ProfileHeader`, `BirthDetailsCard`, `ChartPreferencesCard`, `ChoiceRow`, `SubscriptionCard`, `PurchasesCard`, `DataPrivacyCard`, `AccountActionsCard`, `InfoRow`. Data loading and save handlers remain in the screen. Current line count: 312. |
| `ChartScreen` called hooks before early-return guards (Rules of Hooks) | Shell/content split: `ChartScreen` owns route and timezone guards only; `ChartScreenContent` owns all hook calls and rendering after both guards pass. |
| Persisted `chart_data` cast to `ChartData` without runtime validation | `client/lib/chartDataValidation.ts`: `parseChartData(json): ChartData \| null` validates required shape. All three cast sites replaced: `useChartData` (fromSaved path + DB lookup), `MyCharts` (open + list render), `DashboardScreen` (sun/moon summary). Malformed rows fall back to recompute or show a safe error; valid data is unchanged. |
| Self chart auto-save failure was silent | `useChartData` catch block now sets `saveWarning` state. `ChartScreenContent` renders it as an inline card when `canSaveChart && saveWarning && chartMode === 'self'`. `isSaved` is explicitly set to `false` on failure, restoring the manual retry button. |
| `AuthCallbackScreen` `handledOnce` guard blocked delayed URL events | `handledOnce` boolean replaced with URL-keyed `processingUrl` / `handledUrl` refs. Guard is set only after a non-null URL is confirmed, allowing the event listener to process a URL that `getInitialURL()` missed on first call. All token-hash-exposing `console.log` calls removed. Auth errors on all three paths (verifyOtp, exchangeCodeForSession, setSession) now call `Alert.alert`. Catch block promoted from `console.log` to `console.warn`. `auth.ts` redirect-URL log removed. |
| `useChartData` set React state after unmount / stale load | `mountedRef` + `loadIdRef` + `saveIdRef` refs added. Every `await` in `loadChart` and `saveCurrentChart` is followed by an `isCurrentLoad()` / `isCurrentSave()` guard before any state mutation. `applyChartState` also guards on `mountedRef`. Cleanup increments both IDs on unmount and on dependency change. |
| `upsertJournal` sent `id: undefined` in create mode | Payload object typed explicitly; `id` is only added via `if (input.id != null) payload.id = input.id`. `undefined` and `null` both skip the assignment, letting Postgres assign a serial PK. Verified by a mocked Supabase Jest test (`lib/__tests__/journals.test.ts`). |
| No test runner | `jest-expo` preset configured (`jest.config.js`). `"test": "jest"` added to `package.json`. Initial suites covered `profileCompletion`, `chartDataValidation`, and `journals`; the current baseline is 7 suites / 35 tests. All mock Supabase; no network calls. |
| `useChartData` had no branch-level test coverage | `hooks/__tests__/useChartData.test.tsx` added (7 tests, mocked Supabase and chart helpers, `react-test-renderer`). Covers: valid `fromSaved` load (no auth/recompute), invalid `fromSaved` fallback to recompute, missing-coordinate view-only, self auto-save, guest no-auto-save, auto-save failure sets `saveWarning`, manual save success clears `saveWarning`. |
| Chart generation and persistence helpers had no tests | `lib/__tests__/charts.test.ts` added. Covers `buildChartData` shape with and without coordinates, `saveChart` coordinate guard, canonical upsert payload/onConflict, and Supabase error propagation. |
| Auth/profile navigation had no screen tests | `screens/__tests__/CheckEmailScreen.test.tsx` and `screens/__tests__/AuthCallbackScreen.test.tsx` added. Covers missing email/code validation, resend success/failure, OTP complete profile to `Dashboard`, OTP incomplete profile to `CompleteProfile`, AuthCallback token/code/fragment paths, delayed URL after null initial URL, and auth error alert plus finish routing. Total: 7 suites, 35 tests. |
| `CompleteProfileScreen` excessive top dead space | Removed `insets.top + 6` inline style from the top-bar `View`. `AuthContainer` already applies `insets.top + 16` to its scroll container, so the previous code double-counted the safe area. `useSafeAreaInsets` import and call removed from the screen. |

---

## 3. Remaining Architectural Risks

### 3.1 — auth.user_metadata role is intentionally limited (INFO, not a risk)

The current intended contract:

- **Signup** (`SignupScreen` → `signUpWithEmail`): writes all 8 profile/birth fields into `options.data` so `handle_new_user` can populate `public.users` at `auth.users` INSERT time. Required — this is the only mechanism for the email-link verification path.
- **CheckEmailScreen**: after OTP verification, upserts route-param profile into `public.users` directly.
- **Dashboard repair path**: reads auth metadata and merges into `public.users` only when the `users` row is incomplete. One-time recovery, not a display path.
- **All display and edit paths**: read exclusively from `public.users`.
- **Chart preferences**: in `public.chart_preferences`. No `pref_*` keys are written to auth metadata.

Stale `pref_*` keys in auth metadata for pre-migration users are inert — nothing reads them.

---

### 3.2 — Chart preferences stored correctly but not applied to chart math (LOW urgency, HIGH user trust risk)

`public.chart_preferences` stores house system, zodiac type, and orb mode. `buildChartData` and `findAspects` in `lib/astro.ts` still use hardcoded Whole Sign, Tropical, and fixed orbs. Unsupported options are visually disabled, so users cannot save non-functional values. The preferences table is inert storage until chart math reads it.

---

### 3.3 — Guest chart creation UI is not built (MEDIUM, future feature)

`chartMode: 'guest'` is defined and wired into `ChartRouteParams` and `useChartData`, but there is no screen or form that collects another person's birth details and navigates to `ChartScreen` with `chartMode: 'guest'`. No `birth_profiles` table exists for storing guest birth records. The infrastructure is ready; the UI entry point is not.

---

### 3.4 — No ESLint script (LOW, tooling gap)

`client/package.json` now has `typecheck` and `test`. ESLint is installed but `"lint": "eslint ."` has not been added to scripts. No import-order or no-unused-vars enforcement in CI.

---

### 3.5 — Large components still need gradual decomposition (ONGOING)

| File | Lines | Status |
|---|---|---|
| `ProfileScreen.tsx` | 312 | Presentational cards extracted; data loading and save handlers still inline |
| `DashboardScreen.tsx` | 351 | Profile repair + chart generation + UI — not yet extracted |
| `CompleteProfileScreen.tsx` | 325 | Data load + geocoding + timezone inference + UI — not yet extracted |
| `CheckEmailScreen.tsx` | 350 | OTP + upsert + navigation — not yet extracted |
| `useChartData.ts` | 325 | Load + lookup + hydrate + compute + save — not yet split |
| `InterpretationModal.tsx` | 292 | Circular pager + modal shell — not yet split |

---

### 3.6 — Broader DB cleanup remains future work (LOW, not blocking)

- `users` and `charts` timestamps use `TIMESTAMP WITHOUT TIME ZONE`; `journals` and `chart_preferences` use `WITH TIME ZONE`.
- No secondary indexes on `journals(user_id)`, `conversations(user_id)`, `messages(conversation_id)`.
- `conversations` and `messages` tables exist with full RLS, but `ChatScreen.tsx` and `lib/conversations.ts` are empty stubs.
- `usage_events.user_id` is nullable but INSERT RLS requires `user_id = auth.uid()`.
- EXECUTE on `handle_new_user` still granted to `anon` and `authenticated`.
- Stale `pref_*` keys in auth metadata for pre-migration users (inert, low priority).

---

## 4. Recommended Next 5 Tasks

Ranked by user impact × risk reduction × demo readiness.

**1. Add Dashboard profile repair and chart summary tests** *(highest remaining screen risk)*
Cover complete-profile load, incomplete-profile redirect, auth metadata repair for older accounts, saved chart summary hydration, invalid saved `chart_data` fallback, self chart auto-save, and missing-coordinate no-save behavior.
Files: `screens/__tests__/DashboardScreen.test.tsx`.

**2. Add CompleteProfile save/geocode lifecycle tests** *(profile source-of-truth reliability)*
Cover load/prefill, missing field validation, selected-coordinate save, manual geocode fallback, timezone update from geocode, and `public.users` update payload.
Files: `screens/__tests__/CompleteProfileScreen.test.tsx`.

**3. Add InterpretationModal pager tests** *(subtle UI state risk)*
Cover first/last circular paging, single-page behavior, close/reopen reset, and previous/next controls.
Files: `components/charts/__tests__/InterpretationModal.test.tsx` or a focused pager hook test if extracted first.

**4. Wire chart preferences to chart math** *(highest user trust impact)*
Read `house_system`, `zodiac_type`, and `orb_mode` from `public.chart_preferences` in `buildChartData` and `findAspects`. DB CHECK constraints and UI guards already limit values to currently supported defaults, so this is a read-path addition only. Expand CHECK constraints in a new migration when implementing each additional system.
Files: `lib/astro.ts`, `lib/charts.ts`, `hooks/useChartData.ts`, potentially `DashboardScreen.tsx`.

**5. Build guest chart creation UI** *(enables the chartMode infrastructure)*
Create a form screen that collects a name and birth details for another person and navigates to `ChartScreen` with `chartMode: 'guest'`. The hook and route contract are already in place; optionally add a `birth_profiles` table for persisting guest birth records.
Files: new screen, optionally new migration for `birth_profiles`.

---

## 5. Agent Instructions Going Forward

**Current data ownership contract — do not violate:**

- `public.users` — authoritative for all profile and birth data after signup. All read and edit paths use this table.
- `auth.user_metadata` — intentionally limited to: (a) signup handoff for `handle_new_user`, (b) legacy Dashboard repair for incomplete `users` rows. Do not add new writes to auth metadata for profile or birth fields.
- `public.chart_preferences` — authoritative for chart preferences. `ProfileScreen` is the only writer. Do not write `pref_*` keys to auth metadata.
- Stale `pref_*` keys in auth metadata: inert, do not read or write them.

**Chart mode contract:**

- `chartMode: 'self'` — the user's own natal chart. Auto-saves on load when coordinates are present. Button: `'Saved to My Charts'` once saved, `'Save Chart Data'` before.
- `chartMode: 'guest'` — another person's chart. Never auto-saves. Manual save available when coordinates are present. Button: `'Save Chart'`.
- Missing coordinates — always `'View Only'`, never saved, regardless of `chartMode`.
- `DashboardScreen` must always pass `chartMode: 'self'` when navigating to `Chart`.
- New callers navigating to `Chart` for a guest must pass `chartMode: 'guest'`.

**What changed that affects how you work here:**

- `client/lib/domainTypes.ts` is the canonical location for all shared row types: `UserRow`, `UserProfileFields`, `ChartProfile`, `ChartRouteParams`, `ChartMode`, `SubscriptionRow`, `PurchaseRow`. Do not declare local aliases for these in screens.
- `client/lib/profileCompletion.ts` owns `isProfileComplete`, `needsProfileCompletion`, `profileFromAuthMetadata`, and `ProfileCompletionData`. Import from there; do not redefine these in screens.
- `client/lib/chartDataValidation.ts` owns `parseChartData(json): ChartData | null`. Use it everywhere `chart_data` is read from the database. Do not use bare `as ChartData` casts on persisted blobs.
- `client/screens/ChartScreen.tsx` is now a route-validation shell only. Do not add hooks or rendering to it. All chart logic belongs in `client/components/charts/ChartScreenContent.tsx`.
- `client/components/profile/` contains extracted presentational cards for `ProfileScreen`. Data loading and save handlers remain in `ProfileScreen` itself; do not add Supabase calls to the card components.
- `useChartData` has mounted/load-ID/save-ID cancellation guards. Any new async state mutation inside the hook must be preceded by an `isCurrentLoad()` or `isCurrentSave()` check.
- `upsertJournal`: `id` is only added to the payload when `input.id != null`. Do not pass `id: undefined` in any Supabase upsert payload.
- `saveChart` throws if coordinates are null. Always assert `hasChartIdentityCoordinates(input)` before calling it.
- Chart identity is `(user_id, birth_date, birth_time, time_zone, birth_lat, birth_lon)`. All save/lookup call sites use all six columns.
- `public.chart_preferences` CHECK constraints currently allow only `'whole_sign'`, `'tropical'`, and `'medium'`. When implementing a new value, expand the CHECK constraint in a new migration before writing it from the frontend.
- New migrations must be incremental files in `supabase/migrations/` with timestamp prefix. Do not edit `20260508015720_remote_schema.sql`.
- Run `supabase db diff` to verify intent before and after any schema change.
- Run `cd client && npm run typecheck` before any handoff. Zero errors required.
- Run `cd client && npm test` before any handoff. All suites must pass.

**What not to touch casually:**
- `client/.env`
- `client/android/`
- `client/lib/lexicon/` (product prose)
- `ChartData` JSON shape (stored in Supabase rows)
- `handle_new_user` trigger — any new profile field must be added to both the INSERT and ON CONFLICT DO UPDATE paths, and the signup metadata write in `SignupScreen` must include it
- `charts_unique_canonical_birth_identity` constraint and `CHART_IDENTITY_CONFLICT_TARGET` constant — must change atomically together

**Verification commands:**
```bash
cd client && npm run typecheck     # must pass before any handoff
cd client && npm test              # must pass before any handoff
cd client && npm run start         # Expo dev server
supabase db diff                   # verify migration intent
supabase db reset                  # apply all migrations locally
```

**Remaining tooling gaps:**
- No `npm run lint` script (ESLint is installed; script not yet added)
- No `supabase db push` in CI
- No `supabase gen types` script for generated DB types
