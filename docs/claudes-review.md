# Claude's Architectural Review — Naksha Codebase

Last updated: 2026-06-20 (account-deletion Edge Function deployed + disposable-account QA passed)
Reviewer: Claude (Sonnet 4.6)
Scope: source code + all migrations through `20260508021500_chart_preferences.sql`
Verification: `cd client && npm run typecheck` passes with zero errors. `npm test` passes (19 suites, 106 tests). `npm run lint` passes cleanly. `git diff --check` passes.

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

Manual auth recheck during the re-entry audit confirmed login/signup/OTP/profile flows work as documented. Since then, two more release-readiness slices landed:

- **Password reset / forgot password**: `LoginScreen` links to `ForgotPasswordScreen`, which sends a Supabase reset email via `requestPasswordResetEmail`. The Supabase redirect remains `naksha://auth/callback`. `AuthCallbackScreen` now normalizes callback URLs through `client/lib/authCallbackUrl.ts` before routing, while transiently preserving the raw fragment URL needed for recovery token parsing; recovery callbacks route to `ResetPasswordScreen`, which updates the password via Supabase Auth. Manually verified end-to-end.
- **Account deletion MVP**: `ProfileScreen` shows a destructive confirmation before deleting; the `deleteAccount` client helper (`client/lib/accountDeletion.ts`) calls the `delete-account` Supabase Edge Function with the current user's bearer token. The Edge Function verifies the JWT server-side, derives `user.id` from the verified JWT (never from the request body), deletes app-owned rows first (`messages`, `conversations`, `reports`, `journals`, `notifications`, `purchases`, `subscriptions`, `usage_events`, `charts`), then calls `auth.admin.deleteUser(user.id)` last, relying on existing cascades to remove `public.users` and `chart_preferences`. Implementation, Opus deep review, and automated tests have passed. The Edge Function is **deployed** (project `ujupnlkobzhpjewruiac`, with `SUPABASE_SERVICE_ROLE_KEY` set as a function secret) and has passed **manual disposable-account QA**: a disposable user with saved chart rows was deleted end-to-end, login afterward failed, and post-delete SQL confirmed no remaining rows in `auth.users`, `public.users`, `chart_preferences`, `charts`, or `journals` (see §3.7).

The remaining open risks are narrower now: guest chart persistence/profile management is not implemented, synastry/compatibility/composite charts and premium gating are not implemented, stubbed chat/subscription/service modules remain unimplemented, additional astrology systems are not implemented, data export/retention policy/external billing-refund cancellation are not implemented, optional production hardening of the deletion path (transactional/RPC deletion, rate limiting, expanded coverage) is not done, and schema/migration validation is not automated or CI-backed. Future cleanup should be attached to specific feature work or real defects, not broad open-ended refactoring.

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
| `InterpretationCard.tsx` clipped final words/paragraphs | Reworked to split content into paragraphs and sentences, rendering each as a discrete text segment. Manually verified — clipping appears fully fixed. **Do not casually modify this file again unless a real bug appears.** |
| `InterpretationModal.tsx` swipe/infinite pager regressed | Circular pager restored (duplicate first/last pages, `setPageWithoutAnimation`, internal-jump ref guard) and manually verified. Per-page scroll position is preserved across swipes — this is current behavior and considered acceptable UX, not a bug. |
| No safe-area context at app root | `SafeAreaProvider` (from `react-native-safe-area-context`) added in `App.tsx`, wrapping `SpaceProvider`. |
| No daily astrology surface | Daily Transits / Today's Energy v1 implemented: `client/lib/dailyTransits.ts` exports `computeTransitPlanets`, `findDailyTransitAspects`, and `findStrongestDailyTransitAspect`; `buildTodayEnergy` assembles the card data (transit Sun/Moon sign plus the single strongest fast-transit-to-natal aspect, with a fallback message when nothing is exact). Covered by `lib/__tests__/dailyTransits.test.ts`. `DashboardScreen` renders a "Today's Energy" card using this data. |

### Password reset and account deletion (2026-06-16)

| Item | Resolution |
|---|---|
| No "Forgot password" flow | `LoginScreen` links to `ForgotPasswordScreen`, which calls `requestPasswordResetEmail` (`client/lib/auth.ts`) using the existing `naksha://auth/callback` redirect. `client/lib/authCallbackUrl.ts` normalizes incoming callback URLs for navigation while transiently preserving the raw fragment URL so recovery tokens can still be parsed. `AuthCallbackScreen` routes recovery callbacks to `ResetPasswordScreen`, which updates the password via Supabase Auth. Manually verified end-to-end. |
| No account/data deletion path | `ProfileScreen` shows a destructive confirmation, then calls `deleteAccount()` (`client/lib/accountDeletion.ts`), which invokes the `delete-account` Supabase Edge Function (`supabase/functions/delete-account/index.ts`) with the caller's bearer token. The Edge Function verifies the JWT server-side via `auth.getUser`, derives `user.id` only from the verified JWT, deletes `messages`, `conversations`, `reports`, `journals`, `notifications`, `purchases`, `subscriptions`, `usage_events`, and `charts` for that user, then calls `auth.admin.deleteUser(user.id)` last — existing cascades remove `public.users` and `chart_preferences`. The client never calls `supabase.auth.admin.deleteUser` and the service-role key never leaves the Edge Function. Implementation passed Opus deep review and has automated test coverage. The function is **deployed** to project `ujupnlkobzhpjewruiac` (`SUPABASE_SERVICE_ROLE_KEY` set as a function secret) and passed **manual disposable-account QA**: a disposable user with saved chart rows was fully deleted, post-delete login failed, and SQL verification confirmed no remaining rows in `auth.users`, `public.users`, `chart_preferences`, `charts`, or `journals`. |

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
| `ProfileScreen.tsx` | 338 | Presentational cards extracted; data loading, save handlers, and the account-deletion confirmation/handler are still inline |
| `DashboardScreen.tsx` | 455 | Profile repair + chart generation + Today's Energy card + UI; covered by focused tests, not yet extracted. Growth from 351 lines is due to the new Today's Energy card. |
| `CompleteProfileScreen.tsx` | 323 | Data load + geocoding + timezone inference + UI; covered by focused tests, not yet extracted |
| `CheckEmailScreen.tsx` | 350 | OTP + upsert + navigation — not yet extracted |
| `useChartData.ts` | 422 | Load + lookup + hydrate + compute + save — not yet split |
| `InterpretationModal.tsx` | 333 | Circular pager + modal shell; covered by focused tests, not yet split |
| `InterpretationCard.tsx` | 195 | Paragraph/sentence splitting for clipping-safe rendering; covered by focused tests |

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

`buildTodayEnergy` (in `client/lib/dailyTransits.ts`) currently surfaces transit Sun/Moon sign plus a single strongest fast-transit-to-natal aspect, with a fallback message when nothing is exact. This is a deliberate v1 scope, not a placeholder bug. Do not expand it (additional transit bodies, multi-aspect summaries, retrograde/void-of-course callouts, etc.) without a product decision on the desired depth.

---

### 3.7 — Privacy/account gaps remaining after password reset and account deletion (MEDIUM, release gap)

Password reset and account deletion (MVP) are now implemented — see §2 "Password reset and account deletion (2026-06-16)". The account-deletion Edge Function has passed implementation, Opus deep review, and automated tests, and is now **deployed** to project `ujupnlkobzhpjewruiac` (`SUPABASE_SERVICE_ROLE_KEY` set as a function secret) and **manually verified via disposable-account QA** (a disposable user with saved chart rows was deleted end-to-end, post-delete login failed, and SQL confirmed no remaining rows in `auth.users`, `public.users`, `chart_preferences`, `charts`, or `journals`). Note this verification is a single disposable-account QA pass, not broad production hardening or load testing.

Remaining gaps, none of which are blocked by any other open item in this doc:

- Data export (`ProfileScreen`'s "Export my data" action is still a stub directing users to contact support).
- A documented data-retention policy.
- External billing/subscription refund or cancellation handling (App Store/Play Store side).
- A "delete my data without deleting my account" option, if product wants one distinct from full account deletion.
- CI-backed schema/migration validation (still manual — see §3.5).
- Optional production hardening of the deletion path: transactional/RPC deletion for atomicity, rate limiting on the Edge Function, and expanded automated coverage if desired. None of these are required for the MVP but are worth doing before high-volume production use.

---

## 4. Recommended Next 5 Tasks

Ranked by user impact × risk reduction × demo readiness.

**1. Docs refresh — complete**
The 2026-06-13 re-entry audit and this 2026-06-16 update have kept this doc in sync with the InterpretationCard clipping fix, InterpretationModal swipe/infinite restore, `SafeAreaProvider` addition, Today's Energy v1, password reset, and the account deletion MVP.

**2. Account-deletion deployment + disposable-account QA — complete**
The `delete-account` Edge Function is deployed to project `ujupnlkobzhpjewruiac` (`SUPABASE_SERVICE_ROLE_KEY` set as a function secret) and has passed manual disposable-account QA (see §2, §3.7). Optional follow-up production hardening — transactional/RPC deletion, rate limiting, expanded coverage — is tracked in §3.7 but is not required for the MVP.

**3. Remaining privacy basics** *(release gap)*
Data export, a documented retention policy, and external billing/refund cancellation handling are still stubs or unimplemented (see §3.7). Files: `ProfileScreen.tsx` / `DataPrivacyCard.tsx` for export; billing work depends on App Store/Play Store integration, which does not exist yet.

**4. UI/UX revamp** *(quality pass)*
With Today's Energy, guest chart creation, and interpretation rendering all stable, do a focused UI/UX pass across Dashboard, Chart, and Interpretation surfaces now that the underlying data and layout bugs are resolved.
Files: depends on chosen scope.

**5. Release prep / CI-backed schema validation** *(release safety)*
Automate or document a reliable `supabase db reset`/`db diff` workflow so migration drift is caught before release, alongside other release-readiness checks.
Files: CI config or project scripts/docs.

**Deferred** (not in the next 5, but tracked): guest chart profile persistence/relationship metadata (decide UX polish vs. saved `birth_profiles` table — see §3.3); `ChatScreen`/`SubscriptionScreen`/placeholder service modules remain intentionally unimplemented and unregistered; additional chart systems (Placidus, Equal House, Sidereal, Vedic, tight/loose orbs) remain future product/math scope (see §3.2).

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
- New migrations must be incremental files in `supabase/migrations/` with timestamp prefix. Do not edit `20260508015720_remote_schema.sql`.
- Run `supabase db diff` to verify intent before and after any schema change.
- Run `cd client && npm run typecheck` before any handoff. Zero errors required.
- Run `cd client && npm test` before any handoff. All suites must pass.
- Run `cd client && npm run lint` before any handoff. Zero warnings/errors expected.
- `client/lib/dailyTransits.ts` owns `computeTransitPlanets`, `findDailyTransitAspects`, `findStrongestDailyTransitAspect`, and `buildTodayEnergy`. Today's Energy is intentionally v1/basic per §3.6 — do not expand its scope without a product decision.
- Do not casually modify `InterpretationCard.tsx` or `InterpretationModal.tsx` unless a real bug appears. Both were reworked during the 2026-06-13 re-entry audit (paragraph/sentence splitting to fix clipping; circular pager restore). In `InterpretationModal.tsx`, per-page scroll position being preserved across swipes is intentional, not a bug.
- `App.tsx` is wrapped in `SafeAreaProvider` (from `react-native-safe-area-context`) at the root. Do not remove or duplicate this wrapper.
- `client/lib/authCallbackUrl.ts` normalizes incoming auth callback URLs for navigation while transiently preserving the raw fragment URL so recovery tokens can still be parsed. `AuthCallbackScreen` depends on this; do not bypass it when changing callback handling.
- Account deletion must stay server-side: the client (`client/lib/accountDeletion.ts`) only calls the `delete-account` Supabase Edge Function with the caller's bearer token. Never call `supabase.auth.admin.deleteUser` from client code, and never let the service-role key reach the client. The Edge Function verifies the JWT and derives `user.id` from it — never from a request body. Deletion order is fixed: `messages`, `conversations`, `reports`, `journals`, `notifications`, `purchases`, `subscriptions`, `usage_events`, `charts`, then `auth.admin.deleteUser` last. `public.users` and `chart_preferences` are removed by existing cascades, not explicit deletes.

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
