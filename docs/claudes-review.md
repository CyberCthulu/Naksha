# Claude's Architectural Review — Naksha Codebase

Last updated: 2026-05-11 (fifth pass — post ProfileScreen extraction, profileCompletion helpers, ChartScreen shell/content split)
Reviewer: Claude (Sonnet 4.6)
Scope: source code + all migrations through `20260508021500_chart_preferences.sql`
Verification: `cd client && npm run typecheck` passes with zero errors. Working tree clean.

---

## 1. Current Status Summary

Chart save semantics now have an explicit product rule: self charts (the user's own natal chart) auto-save on load; guest charts (other people's birth data) skip auto-save and require a deliberate manual save. The `chartMode: 'self' | 'guest'` param on `ChartRouteParams` encodes this rule at the route boundary with no schema change required. `domainTypes.ts` is now the complete home for all shared row types including `SubscriptionRow` (with `created_at` restored) and `PurchaseRow`.

`ProfileScreen` presentational and interactive cards have been extracted to `client/components/profile/`. Shared profile completeness helpers live in `client/lib/profileCompletion.ts`. `ChartScreen` is now a route-validation shell; all hooks and rendering live in `ChartScreenContent`.

The remaining open risks are: persisted `chart_data` is cast without runtime validation, self chart auto-save failure is silent, `AuthCallbackScreen` `handledOnce` guard needs review, `useChartData` has no async cancellation guard, chart preferences still not wired to chart math, guest chart creation UI not built, and foundational tooling (tests, lint) absent.

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

### 3.4 — No test or lint scripts (ONGOING)

`client/package.json` now has `typecheck` (`tsc --noEmit`), but still no `test` or `lint` scripts. No coverage of auth flows, chart generation math, chart persistence, or interpretation page building.

---

### 3.5 — Persisted `chart_data` cast without runtime validation (MEDIUM)

`useChartData` and `MyCharts` cast the `chart_data` column from Supabase directly to `ChartData` with no runtime check. `useChartData` uses `?? []` fallbacks for `planets` and `aspects`, which guards against `null` but not wrong types. A malformed or schema-drifted row will surface as a crash inside `hydrateSavedChart` or downstream list rendering. A lightweight validator (`parseChartData`) that returns `null` on shape mismatch would prevent cascading errors.

---

### 3.6 — Self chart auto-save failure is not visible to users (LOW, UX risk)

When `saveChart` throws during auto-save, `useChartData` catches the error, logs a warning, and continues rendering. The user sees a fully rendered chart but it was not persisted. There is no alert, badge, or retry prompt. Surfacing this as a transient alert or a degraded save-state indicator would prevent silent data loss.

---

### 3.7 — `AuthCallbackScreen` `handledOnce` guard needs review (LOW-MEDIUM)

`AuthCallbackScreen` is registered outside the auth/unauthenticated stack split and is reachable in both states. The `handledOnce` ref marks the flow complete immediately, before async verification work finishes. If a deep-link URL arrives after an initial partial failure, the second URL is silently ignored. This path should be reviewed and tested before shipping.

---

### 3.8 — `useChartData` has no async cancellation guard (LOW)

`useChartData` sets React state inside async callbacks with no check for whether the component is still mounted. Rapid navigation (e.g., opening and immediately closing `ChartScreen`) can produce state-update-on-unmounted-component warnings or, in edge cases, stale state in a later mount.

---

### 3.9 — `upsertJournal` create-mode with `undefined id` is untested (LOW)

`upsertJournal` passes `id: input.id` in the payload. When creating a new entry from `JournalEditorScreen`, `id` is `undefined`. Whether Supabase's upsert correctly omits the `id` field in this case (allowing a serial PK to be assigned) or silently errors has not been verified with a test.

---

### 3.10 — Large components still need gradual decomposition (ONGOING)

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

Ranked by risk reduction × user trust × demo readiness.

**1. Add a test runner and first test suite** *(foundational; highest risk reduction)*
Add `jest` + `@testing-library/react-native`. First suite: `profileCompletion` boundary cases, `buildChartData` round-trip, `saveChart` coordinate guard, `useChartData` self/guest/view-only branches, OTP navigation reset (complete → Dashboard, incomplete → CompleteProfile), `upsertJournal` create-mode with `undefined id`.
Files: `client/package.json`, new test files.

**2. Add runtime validation for persisted `chart_data`** *(prevents silent crashes on schema-drifted rows)*
Replace bare `as ChartData` casts in `useChartData` and `MyCharts` with a `parseChartData(json)` validator that returns `null` on shape mismatch and shows a recoverable error state. No schema change needed.
Files: `client/hooks/useChartData.ts`, `client/screens/MyCharts.tsx`, new `client/lib/chartValidation.ts`.

**3. Surface auto-save failure to the user** *(prevents silent data loss)*
When `saveChart` throws during auto-save in `useChartData`, show an alert or a degraded save-state indicator rather than swallowing the error. The outer try/catch structure is already there; only the failure branch needs a user-visible response.
File: `client/hooks/useChartData.ts`.

**4. Review and harden `AuthCallbackScreen`** *(reduces auth/deep-link fragility)*
Clean up verbose logging. Review `handledOnce` guard for delayed or retried deep-link URLs. Add tests for token/code/fragment paths and the delayed-URL edge case.
Files: `client/screens/AuthCallbackScreen.tsx`, `client/lib/auth.ts`.

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
- `client/screens/ChartScreen.tsx` is now a route-validation shell only. Do not add hooks or rendering to it. All chart logic belongs in `client/components/charts/ChartScreenContent.tsx`.
- `client/components/profile/` contains extracted presentational cards for `ProfileScreen`. Data loading and save handlers remain in `ProfileScreen` itself; do not add Supabase calls to the card components.
- `saveChart` throws if coordinates are null. Always assert `hasChartIdentityCoordinates(input)` before calling it.
- Chart identity is `(user_id, birth_date, birth_time, time_zone, birth_lat, birth_lon)`. All save/lookup call sites use all six columns.
- `public.chart_preferences` CHECK constraints currently allow only `'whole_sign'`, `'tropical'`, and `'medium'`. When implementing a new value, expand the CHECK constraint in a new migration before writing it from the frontend.
- New migrations must be incremental files in `supabase/migrations/` with timestamp prefix. Do not edit `20260508015720_remote_schema.sql`.
- Run `supabase db diff` to verify intent before and after any schema change.
- Run `cd client && npm run typecheck` before any handoff. Zero errors required.

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
cd client && npm run start         # Expo dev server
supabase db diff                   # verify migration intent
supabase db reset                  # apply all migrations locally
```

**Remaining tooling gaps:**
- No `npm test` script
- No `npm run lint` script
- No `supabase db push` in CI
