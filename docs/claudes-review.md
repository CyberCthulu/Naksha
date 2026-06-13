# Claude's Architectural Review — Naksha Codebase

Last updated: 2026-06-13 (post re-entry audit — Today's Energy v1, interpretation clipping/swipe fixes, SafeAreaProvider)
Reviewer: Claude (Sonnet 4.6)
Scope: source code + all migrations through `20260508021500_chart_preferences.sql`
Verification: `cd client && npm run typecheck` passes with zero errors. `npm test` passes (13 suites, 77 tests). `npm run lint` passes cleanly. `git diff --check` passes. `git status` clean on `main`, in sync with `origin/main`.

---

## 1. Current Status Summary

The cleanup/stabilization phase is complete enough for feature expansion. Persisted `chart_data` is validated before use (`parseChartData` in `client/lib/chartDataValidation.ts`). Chart preferences are now read through `getChartCalculationPreferences`, passed into `buildChartData` as `ChartCalculationPreferences`, and `orb_mode` is plumbed into `findAspects`; current output intentionally remains Whole Sign, Tropical, and medium-orb only. Guest Chart Creation UI v1 is built: `CreateGuestChartScreen` collects another person's birth details, `CreateGuestChart` is registered in navigation, Dashboard exposes "Create Someone Else's Chart", and submit navigates to `Chart` with `chartMode: 'guest'`. Auto-save failures are surfaced to users via a `saveWarning` card in `ChartScreenContent`. `AuthCallbackScreen` URL-deduplication guard was replaced with URL-keyed refs (`processingUrl`/`handledUrl`), all token-hash-exposing logs were removed, and auth errors now show an `Alert`. `useChartData` has mounted/load-ID cancellation guards. `upsertJournal` no longer sends `id: undefined` in create mode. `CompleteProfileScreen` top dead space was fixed. ESLint is configured and clean. Supabase generated types are checked in, the Supabase client is typed with `Database`, and shared DB row aliases derive from generated `Tables`.

Since the previous review, three more slices landed and were verified during the 2026-06-13 re-entry audit:

- **Interpretation paragraph/clipping fixes**: `InterpretationCard.tsx` was reworked to split content into paragraphs/sentences and render them as discrete text segments, fixing final-word/paragraph clipping. Manually verified — clipping appears fully fixed.
- **InterpretationModal swipe/infinite restore**: the circular pager (duplicate first/last pages, `setPageWithoutAnimation`, internal-jump guard) was restored and manually verified. Per-page scroll position is preserved across swipes by current behavior; this is intentional/acceptable UX, not a bug.
- **`SafeAreaProvider`** was added at the app root in `App.tsx`, wrapping `SpaceProvider`.
- **Daily Transits / Today's Energy v1** is implemented end-to-end (see §2 for details) and confirmed loading in manual run-through. It is intentionally v1/basic/generic — transit Sun/Moon sign plus a single strongest fast-transit-to-natal aspect, with a fallback message when nothing is exact.

Jest now has 13 suites and 77 passing tests (up from 11/64), including chart preference plumbing, Dashboard, guest chart creation, CompleteProfile, InterpretationModal, InterpretationCard, and daily transit helper coverage.

`ProfileScreen` presentational and interactive cards have been extracted to `client/components/profile/`. Shared profile completeness helpers live in `client/lib/profileCompletion.ts`. `ChartScreen` is a route-validation shell; all hooks and rendering live in `ChartScreenContent`.

Manual auth recheck during the re-entry audit confirmed login/signup/OTP/profile flows work as documented, **except password reset is not implemented** (see §3 and §7).

The remaining open risks are product/automation gaps: guest chart persistence/profile management is not implemented, synastry/compatibility/composite charts and premium gating are not implemented, stubbed chat/subscription/service modules remain unimplemented, additional astrology systems are not implemented, password reset and account/data deletion are not implemented, and schema/migration validation is not automated or CI-backed. Future cleanup should be attached to specific feature work or real defects, not broad open-ended refactoring.

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
| No test runner | `jest-expo` preset configured (`jest.config.js`). `"test": "jest"` added to `package.json`. Current baseline is 11 suites / 64 tests. All mock Supabase; no network calls. |
| Guest chart creation UI was only groundwork | `CreateGuestChartScreen` added, `CreateGuestChart` route registered, and Dashboard now exposes "Create Someone Else's Chart". The form collects name, birth date, birth time, location, time zone, and selected coordinates when available, then navigates to `Chart` with `chartMode: 'guest'`. Typed-location charts can pass null coordinates and rely on existing View Only behavior. No schema, migrations, `birth_profiles` table, synastry, compatibility, composite chart, report, or premium-gating work was added. |
| `useChartData` had no branch-level test coverage | `hooks/__tests__/useChartData.test.tsx` added (7 tests, mocked Supabase and chart helpers, `react-test-renderer`). Covers: valid `fromSaved` load (no auth/recompute), invalid `fromSaved` fallback to recompute, missing-coordinate view-only, self auto-save, guest no-auto-save, auto-save failure sets `saveWarning`, manual save success clears `saveWarning`. |
| Chart generation and persistence helpers had no tests | `lib/__tests__/charts.test.ts` added. Covers `buildChartData` shape with and without coordinates, `saveChart` coordinate guard, canonical upsert payload/onConflict, and Supabase error propagation. |
| Auth/profile navigation had no screen tests | `screens/__tests__/CheckEmailScreen.test.tsx` and `screens/__tests__/AuthCallbackScreen.test.tsx` added. Covers missing email/code validation, resend success/failure, OTP complete profile to `Dashboard`, OTP incomplete profile to `CompleteProfile`, AuthCallback token/code/fragment paths, delayed URL after null initial URL, and auth error alert plus finish routing. |
| Dashboard / CompleteProfile / InterpretationModal lacked focused tests | `DashboardScreen.test.tsx`, `CompleteProfileScreen.test.tsx`, and `InterpretationModal.test.tsx` added. Coverage includes profile repair, chart summary hydration/fallback, self auto-save, missing-coordinate no-save, profile load/validation/save/geocode/timezone behavior, and circular modal pager behavior. |
| ESLint setup and warning cleanup | `eslint-config-expo` flat config added with `"lint": "eslint ."`. Targeted warning cleanup removed unused imports/vars, merged duplicate imports, fixed the modal hook dependency, and scoped the React-three-fiber JSX prop override to `SpaceBackground`. `npm run lint` passes cleanly. |
| Generated Supabase row types | `client/lib/database.types.ts` generated from the linked Supabase project. `client/lib/supabase.ts` uses `createClient<Database>()`. `UserRow`, `SubscriptionRow`, `PurchaseRow`, `JournalRow`, and `ChartPreferencesRow` derive from generated `Tables<'...'>`; app/domain chart types remain handwritten. |
| Chart preferences were stored but not read by chart math | `ChartCalculationPreferences` and defaults added. `getChartCalculationPreferences` reads `public.chart_preferences` with default fallback. `buildChartData` accepts preferences, `findAspects` receives `orb_mode`, and `useChartData` plus `DashboardScreen` pass preferences into computed chart builds. Current behavior remains Whole Sign, Tropical, and medium orbs only. |
| `CompleteProfileScreen` excessive top dead space | Removed `insets.top + 6` inline style from the top-bar `View`. `AuthContainer` already applies `insets.top + 16` to its scroll container, so the previous code double-counted the safe area. `useSafeAreaInsets` import and call removed from the screen. |

### Re-entry audit (2026-06-13)

| Item | Resolution |
|---|---|
| `InterpretationCard` clipped final words/paragraphs | Reworked to split interpretation content into paragraphs and sentences (`splitParagraphs`/`splitSentences`/`splitTextSegments`) and render each as its own `Text` segment with a trailing block spacer. `components/charts/__tests__/InterpretationCard.test.tsx` added. Manually verified — clipping appears fully fixed. Do not casually modify this file again unless a real bug appears. |
| `InterpretationModal` swipe/infinite paging needed restoring after the clipping fix | Circular pager behavior restored: pages are wrapped with duplicate first/last entries, `setPageWithoutAnimation` repositions on programmatic index changes, and an internal-jump ref prevents feedback loops on wrap. `components/charts/__tests__/InterpretationModal.test.tsx` expanded to cover prev/next, circular boundaries, close/reopen reset. Manually verified working. Per-page scroll position is preserved across swipes by current behavior — this is acceptable UX, not a release blocker. |
| App root had no safe-area context provider | `SafeAreaProvider` (from `react-native-safe-area-context`) added at the top of the component tree in `App.tsx`, wrapping `SpaceProvider`. |
| No daily/transit-based feature surface existed | `client/lib/dailyTransits.ts` added: `computeTransitPlanets` (in `lib/astro.ts`), `findDailyTransitAspects`, `findStrongestDailyTransitAspect`, and `buildTodayEnergy` compute transit Sun/Moon signs and the strongest fast-transit-to-natal aspect (Moon/Sun/Mercury/Venus/Mars vs. natal planets) using existing `findAspects`/orb-mode plumbing. `lib/__tests__/dailyTransits.test.ts` added. `DashboardScreen` renders a "Today's Energy" card showing transit Sun/Moon sign and the strongest aspect (or a fallback message when none is exact). Manually confirmed loading. This is intentionally v1/basic/generic — single strongest aspect only, self chart only, no relationship/synastry expansion. |

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

### 3.2 — Additional chart systems are not implemented (MEDIUM, product gap)

`public.chart_preferences` is now read by chart calculation paths, but only the current defaults are supported: Whole Sign houses, Tropical zodiac, and medium orbs. Placidus, Equal House, Sidereal, Vedic, tight/loose orbs, and house-degree display remain disabled/coming soon until their math, DB constraints, UI states, and tests exist.

---

### 3.3 — Guest chart persistence/profile management is not implemented (MEDIUM, future feature)

`CreateGuestChartScreen` now covers the one-off guest chart flow and navigates to `ChartScreen` with `chartMode: 'guest'`. No `birth_profiles` table exists for storing reusable guest birth records, and there is no guest profile library, relationship metadata, synastry, compatibility, composite charting, reports, or premium gating. Guest charts remain manual-save only when coordinates exist; typed-location guest charts with null coordinates rely on existing View Only behavior.

---

### 3.4 — Large components still need gradual decomposition (ONGOING)

| File | Lines | Status |
|---|---|---|
| `ProfileScreen.tsx` | 312 | Presentational cards extracted; data loading and save handlers still inline |
| `DashboardScreen.tsx` | 455 | Profile repair + chart generation + Today's Energy v1 + UI; covered by focused tests, not yet extracted. Grew further with the Today's Energy card — primary decomposition candidate if this surface expands. |
| `CompleteProfileScreen.tsx` | 323 | Data load + geocoding + timezone inference + UI; covered by focused tests, not yet extracted |
| `CheckEmailScreen.tsx` | 350 | OTP + upsert + navigation — not yet extracted |
| `useChartData.ts` | 422 | Load + lookup + hydrate + compute + save — not yet split |
| `InterpretationModal.tsx` | 333 | Circular pager + modal shell; recently reworked for swipe/clipping fix and covered by expanded tests, not yet split |
| `InterpretationCard.tsx` | 195 | Paragraph/sentence splitting for clipping-safe rendering; small and tested — avoid refactor unless text rendering changes |

Future decomposition should be attached to a feature, product requirement, or real defect. The cleanup phase no longer needs broad open-ended refactoring as a standalone priority.

---

### 3.5 — Broader DB cleanup remains future work (LOW, not blocking)

- `users` and `charts` timestamps use `TIMESTAMP WITHOUT TIME ZONE`; `journals` and `chart_preferences` use `WITH TIME ZONE`.
- No secondary indexes on `journals(user_id)`, `conversations(user_id)`, `messages(conversation_id)`.
- `conversations` and `messages` tables exist with full RLS, but `ChatScreen.tsx` and `lib/conversations.ts` are empty stubs.
- `usage_events.user_id` is nullable but INSERT RLS requires `user_id = auth.uid()`.
- EXECUTE on `handle_new_user` still granted to `anon` and `authenticated`.
- Stale `pref_*` keys in auth metadata for pre-migration users (inert, low priority).
- Schema/migration validation is still manual rather than CI-backed.

---

### 3.6 — Today's Energy v1 is intentionally basic (LOW, future feature)

`client/lib/dailyTransits.ts` and the Dashboard "Today's Energy" card are implemented and manually confirmed loading. Current scope is intentionally minimal: transit Sun/Moon sign plus a single strongest fast-transit-to-natal aspect (or a fallback message), computed for the logged-in user's own chart only. No forecast detail screen, historical/trend view, notifications, caching, premium gating, or user-configurable transit settings exist. Expanding this surface should be a deliberate future slice, not an incidental change.

---

### 3.7 — Password reset and account/data deletion are not implemented (MEDIUM, release gap)

Manual auth recheck during the 2026-06-13 re-entry audit confirmed signup, login, OTP verification, and deep-link callback handling work as documented, but there is no forgot-password/reset-password flow. Separately, `ProfileScreen` exposes account/privacy display surfaces, but there is no account deletion, data deletion/export, or retention-policy implementation. Both are release-readiness gaps rather than architectural defects.

---

## 4. Recommended Next 5 Tasks

Ranked by user impact × risk reduction × demo readiness.

**1. Docs refresh** *(complete as of this audit)*
This review, the codebase handoff, and the decomposition roadmap have been brought current as of 2026-06-13: 13 suites / 77 tests, Today's Energy v1, interpretation clipping/swipe fixes, and `SafeAreaProvider` are now documented. "Build daily transits / Today's Energy v1" (previously #2) is now done — see §3.6.

**2. Password reset** *(release-readiness)*
Add a forgot-password/reset-password flow. Preserve existing login/signup/OTP/deep-link behavior; do not log reset tokens or callback URLs. Add focused tests for reset request and reset callback/update paths.
Files: likely `LoginScreen.tsx`, `lib/auth.ts`, a new reset screen, `AuthCallbackScreen.tsx`, linking config, tests.

**3. Account deletion / data deletion / privacy basics** *(release-readiness)*
Implement or scope account deletion and data deletion/export flows referenced by `ProfileScreen`'s privacy surface. Decide retention behavior for `charts`, `journals`, and related rows.
Files: `ProfileScreen.tsx`, `components/profile/DataPrivacyCard.tsx`, `lib/auth.ts`, possibly a new migration for cascade/retention behavior.

**4. UI/UX revamp** *(pre-release polish)*
With clipping/swipe fixed and Today's Energy live, do a cohesive interaction/visual pass across Dashboard, chart interpretation, guest chart entry, saved charts, and profile.
Files: depends on chosen scope; `DashboardScreen.tsx` is the natural decomposition target given its growth (§3.4).

**5. Release prep / CI-backed schema validation** *(release safety)*
Automate or document a reliable `supabase db reset`/`db diff` workflow so migration drift is caught before release, alongside a manual release QA checklist.
Files: CI config or project scripts/docs.

**Deferred** (still valid, lower priority): guest chart polish/persistence decision (§3.3), product slice for `ChatScreen`/`SubscriptionScreen`/service stubs, and additional chart systems (Placidus, Equal House, Sidereal, Vedic, tight/loose orbs, house-degree display) per §3.2.

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

- `client/lib/database.types.ts` contains generated Supabase schema types. Regenerate it when migrations change.
- `client/lib/domainTypes.ts` is the canonical location for shared app/domain types, chart calculation preference types/defaults, and generated DB row aliases: `UserRow`, `UserProfileFields`, `ChartProfile`, `ChartRouteParams`, `ChartMode`, `ChartCalculationPreferences`, `SubscriptionRow`, `PurchaseRow`, `JournalRow`, `ChartPreferencesRow`. Do not declare local aliases for these in screens.
- `client/lib/profileCompletion.ts` owns `isProfileComplete`, `needsProfileCompletion`, `profileFromAuthMetadata`, and `ProfileCompletionData`. Import from there; do not redefine these in screens.
- `client/lib/chartDataValidation.ts` owns `parseChartData(json): ChartData | null`. Use it everywhere `chart_data` is read from the database. Do not use bare `as ChartData` casts on persisted blobs.
- `client/lib/charts.ts` owns `getChartCalculationPreferences(userId)` and `buildChartData(input, preferences?)`. Use stored preferences for computed chart builds when a user is available.
- `client/lib/astro.ts` `findAspects(planets, orbMode)` currently supports only `orb_mode: 'medium'`.
- `client/screens/ChartScreen.tsx` is now a route-validation shell only. Do not add hooks or rendering to it. All chart logic belongs in `client/components/charts/ChartScreenContent.tsx`.
- `client/components/profile/` contains extracted presentational cards for `ProfileScreen`. Data loading and save handlers remain in `ProfileScreen` itself; do not add Supabase calls to the card components.
- `useChartData` has mounted/load-ID/save-ID cancellation guards. Any new async state mutation inside the hook must be preceded by an `isCurrentLoad()` or `isCurrentSave()` check.
- `upsertJournal`: `id` is only added to the payload when `input.id != null`. Do not pass `id: undefined` in any Supabase upsert payload.
- `saveChart` throws if coordinates are null. Always assert `hasChartIdentityCoordinates(input)` before calling it.
- Chart identity is `(user_id, birth_date, birth_time, time_zone, birth_lat, birth_lon)`. All save/lookup call sites use all six columns.
- `public.chart_preferences` CHECK constraints currently allow only `'whole_sign'`, `'tropical'`, and `'medium'`. When implementing a new value, expand the CHECK constraint in a new migration before writing it from the frontend.
- Do not claim Placidus, Equal House, Sidereal, Vedic, tight/loose orbs, custom orb modes, or house-degree display are implemented. Current preference plumbing preserves Whole Sign, Tropical, and medium-orb output.
- `client/lib/dailyTransits.ts` owns `computeTransitPlanets` (in `astro.ts`), `findDailyTransitAspects`, `findStrongestDailyTransitAspect`, and `buildTodayEnergy`. `DashboardScreen`'s "Today's Energy" card is intentionally v1/basic (§3.6) — do not expand its scope without a product decision.
- Do not casually modify `InterpretationCard.tsx` or `InterpretationModal.tsx` — both were recently fixed for text clipping and circular swipe/infinite paging and are manually verified. Per-page scroll-position preservation across swipes is intentional behavior, not a bug.
- `App.tsx` root is wrapped in `SafeAreaProvider` (from `react-native-safe-area-context`). Do not remove or duplicate this wrapper.
- New migrations must be incremental files in `supabase/migrations/` with timestamp prefix. Do not edit `20260508015720_remote_schema.sql`.
- Run `supabase db diff` to verify intent before and after any schema change.
- Run `cd client && npm run typecheck` before any handoff. Zero errors required.
- Run `cd client && npm test` before any handoff. All suites must pass.
- Run `cd client && npm run lint` before any handoff. Zero warnings/errors expected.

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
cd client && npm run lint          # must pass cleanly before any handoff
cd client && npm run start         # Expo dev server
supabase db diff                   # verify migration intent
supabase db reset                  # apply all migrations locally
```

**Remaining tooling gaps:**
- No `supabase db push` in CI
- No CI-backed schema/migration validation
