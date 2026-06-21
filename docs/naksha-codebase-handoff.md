# Naksha Codebase Handoff

Generated: 2026-05-07  
Last updated: 2026-06-20 — deployed account deletion disposable-account QA refresh.
Scope: source-of-truth repository handoff. This update is documentation-only.
Last recorded verification: `cd client && npm run typecheck`, `cd client && npm test` (19 suites / 106 tests), `cd client && npm run lint`, and `git diff --check` pass. Password reset / forgot-password is implemented, automated verified, and manually verified. Account deletion MVP is implemented and automated verified; the `delete-account` Edge Function is deployed to Supabase project `ujupnlkobzhpjewruiac` and has passed disposable-account manual QA.

## 1. Executive Summary

Naksha is a mobile-first astrology app built with Expo, React Native, TypeScript, and Supabase. The current product centers on authenticated users entering birth details, generating a natal chart, viewing planetary positions/houses/aspects, reading local lexicon-based interpretations, saving charts, and writing journal entries.

What already works:

- Email/password auth with Supabase, persisted through AsyncStorage.
- Signup flow that collects birth details, passes them through auth metadata for bootstrap, and persists them durably in `public.users`.
- Login, check-email OTP verification with deterministic navigation reset, password reset / forgot-password, deep-link callback handling, profile completion, dashboard, chart view, saved chart list, profile screen, and journal list/editor.
- Password reset uses a Forgot Password entry from Login, Supabase reset email, `AuthCallbackScreen`, robust callback URL handoff for fragment recovery links, and `ResetPasswordScreen`.
- Account deletion MVP is implemented from Profile with destructive confirmation. The client calls a deployed `delete-account` Supabase Edge Function; the function verifies the JWT server-side, derives `user.id` from the verified JWT, deletes app-owned rows first, then calls `auth.admin.deleteUser(user.id)` last. Disposable-account manual QA has passed in project `ujupnlkobzhpjewruiac`.
- Natal chart computation from birth date/time/time zone using `luxon` and `astronomy-engine`.
- Whole-sign house calculation when latitude/longitude are available.
- Local chart interpretation from lexicon files for planet/sign, planet/house, house/sign, generic house, and aspect meanings.
- Supabase chart persistence through a `charts` table and journal persistence through a `journals` table.
- Explicit chart route mode groundwork: self charts can auto-save when coordinates exist; guest charts are manual-save only.
- Guest chart creation v1: `CreateGuestChartScreen` collects another person's name, birth date, birth time, location, time zone, and selected coordinates when available, then navigates to `Chart` with `chartMode: 'guest'`.
- Dashboard has a "Create Someone Else's Chart" entry point.
- Today's Energy v1 is live on Dashboard. `client/lib/dailyTransits.ts` computes fast transit context with `computeTransitPlanets`, `findDailyTransitAspects`, `findStrongestDailyTransitAspect`, and `buildTodayEnergy`; the Dashboard card shows transit Sun/Moon signs plus the strongest fast transit aspect when one exists.
- Chart calculation now reads stored chart preferences through `getChartCalculationPreferences`, passes `ChartCalculationPreferences` into `buildChartData`, and passes `orb_mode` into `findAspects`, while preserving the current Whole Sign, Tropical, medium-orb output exactly.
- Source-controlled Supabase migrations now exist under `supabase/migrations/`, including chart identity, profile coordinate trigger, purchase policy, and journal delete behavior fixes.
- Location autocomplete can populate coordinates and update the selected time zone from OpenCage timezone annotations.
- `public.users` is now the durable source of truth for profile/birth data after signup/bootstrap.
- `public.chart_preferences` is now the durable source of truth for chart preference storage.
- `ProfileScreen` display-only and interactive presentational cards extracted into `client/components/profile/`.
- Shared profile completeness helpers (`isProfileComplete`, `needsProfileCompletion`, `profileFromAuthMetadata`) extracted to `client/lib/profileCompletion.ts` and used by both `DashboardScreen` and `CheckEmailScreen`.
- `ChartScreen` split into a route-validation shell and `ChartScreenContent`; all hooks and rendering live in `ChartScreenContent` after both guards pass.
- Persisted `chart_data` is validated through `parseChartData` before saved-chart hydration, My Charts opening, and Dashboard summary use.
- `SafeAreaProvider` wraps the app root so screens and modal sheets can consistently account for device safe areas.
- Self chart auto-save failures now show an inline save warning while keeping the chart rendered; manual save success clears the warning.
- `AuthCallbackScreen` now avoids locking out later URL events when no initial URL exists, deduplicates real callback URLs, removes raw/sensitive callback logging, and surfaces auth callback failures with a user-visible alert.
- `useChartData` now has mounted/current-operation guards so stale async loads or saves do not update state after unmount or after a newer load supersedes them.
- Journal create-mode payloads omit `id` when no id exists, while update-mode payloads preserve `id`.
- InterpretationCard long text clipping has been fixed by paragraph/sentence splitting; focused coverage verifies final words are not dropped.
- InterpretationModal circular swipe/infinite pager behavior has been restored and manually verified; current per-page scroll-position preservation is intentional and is not a bug or release blocker.
- Jest is configured with 19 suites and 106 tests: pure-helper coverage, password reset helper/screen coverage, account deletion helper/Profile coverage, daily transit helper coverage, chart generation/persistence helper coverage, chart preference plumbing/default-fallback coverage, `useChartData` branch coverage, auth/profile navigation coverage, Dashboard profile repair/chart summary/Today’s Energy coverage, CompleteProfile save/geocode lifecycle coverage, InterpretationCard clipping coverage, InterpretationModal pager coverage, and guest chart creation flow coverage.
- ESLint is configured through Expo's flat config; `npm run lint` passes cleanly after the targeted warning cleanup.
- Supabase generated types live in `client/lib/database.types.ts`; the Supabase client is typed with `Database`, and shared DB row aliases in `domainTypes.ts` derive from the generated schema.
- `CompleteProfileScreen` top spacing was tightened by removing duplicate safe-area padding from its in-screen header.
- Cleanup/stabilization is complete enough for feature expansion. Future cleanup should be attached to specific feature work or real defects, not broad open-ended refactoring.

What is incomplete or unstable:

- `server/` is empty, and several service files are placeholders: `conversations.ts`, `notifications.ts`, `reports.ts`, `subscriptions.ts`, `usage.ts`.
- `ChatScreen.tsx` and `SubscriptionScreen.tsx` are empty stub files and are not registered in `App.tsx` navigation or linking config.
- Additional chart systems remain disabled/coming soon. The calculation path accepts the current supported preference defaults only: Whole Sign, Tropical, and medium orbs.
- Guest chart persistence/profile management is not implemented yet; there is no `birth_profiles` table or reusable guest birth-profile library.
- Synastry, compatibility, composite charts, reports, and premium gating are not implemented yet.
- Account deletion is deployed and manually verified with a disposable account, but data export, retention policy, external subscription cancellation/refunds, and delete-data-without-deleting-account flows are not complete.
- Charts without birth coordinates are intentionally view-only: they can render planet data, but are not persisted because canonical saved-chart identity requires coordinates.
- `auth.user_metadata` still carries signup/bootstrap profile data for `handle_new_user` and older-account repair, but profile edits no longer mirror back to auth metadata.
- Schema/migration validation is not automated or CI-backed yet.

## 2. Tech Stack

- App: Expo `~54.0.32`, React Native `0.81.5`, React `19.1.0`, TypeScript `~5.9.2`.
- Navigation: `@react-navigation/native` and `@react-navigation/native-stack`.
- Backend: Supabase Auth and Supabase Postgres through `@supabase/supabase-js`.
- Session storage: `@react-native-async-storage/async-storage`.
- Deep links: `expo-linking`, app scheme `naksha`.
- Astro calculation: `astronomy-engine`, `luxon`, and local helper code.
- Time zones: `timezone-support` plus local abbreviation normalization.
- Geocoding: OpenCage API via `fetch`, configured by `EXPO_PUBLIC_OPENCAGE_KEY`.
- Chart UI: `react-native-svg`.
- Interpretation modal paging: `react-native-pager-view`.
- 3D background dependencies: `three`, `@react-three/fiber`, `expo-gl`; background exists but is disabled in `App.tsx`.

## 3. App Architecture

Main folders:

- `client/`: the Expo app and all active product code.
- `client/screens/`: route-level screens.
- `client/components/auth/`: auth/profile form components.
- `client/components/charts/`: chart display, list, modal, and interpretation card components.
- `client/components/profile/`: extracted presentational and interactive cards for `ProfileScreen`.
- `client/components/ui/`: shared theme, text, card, button, field styles.
- `client/components/space/`: focused planet context and disabled Three.js background.
- `client/hooks/`: chart data loading/persistence and interpretation modal state.
- `client/lib/`: Supabase client, auth helpers, chart computation, interpretation helpers, geocode helper, time helpers, journals, and lexicon.
- `client/lib/lexicon/`: local interpretation content and lookup functions.
- `client/android/`: generated native Android project.
- `supabase/`: local Supabase config and source-controlled SQL migrations.
- `server/`: currently empty.

Important files:

- `client/App.tsx`: root auth session bootstrap, linking config, stack navigation split, `AuthContext`, `SafeAreaProvider`, `SpaceProvider`.
- `client/lib/supabase.ts`: typed Supabase client, AsyncStorage persistence, Expo public env vars.
- `client/lib/database.types.ts`: generated Supabase `public` schema types.
- `client/lib/auth.ts`: sign up, resend, OTP verify, login, password reset request, logout, get user.
- `client/lib/authCallbackUrl.ts`: transient in-memory auth callback URL handoff for fragment recovery links before `AuthCallbackScreen` mounts.
- `client/lib/accountDeletion.ts`: authenticated client helper that invokes the `delete-account` Edge Function with the current bearer token.
- `client/lib/domainTypes.ts`: shared frontend domain types, chart calculation preference defaults/parsing, plus DB row aliases derived from generated Supabase types.
- `client/lib/profileCompletion.ts`: `isProfileComplete`, `needsProfileCompletion`, `profileFromAuthMetadata`, `ProfileCompletionData` type; shared by `DashboardScreen` and `CheckEmailScreen`.
- `client/lib/chartDataValidation.ts`: runtime parser for persisted `ChartData` JSON; returns `null` for malformed or schema-drifted rows.
- `client/lib/geocode.ts`: `geocodePlace` — OpenCage geocoding helper used by `CompleteProfileScreen`.
- `client/lib/journals.ts`: journal list/upsert/delete helpers; create-mode upserts omit `id` when no id exists.
- `client/screens/DashboardScreen.tsx`: profile load/repair, profile completion redirect, preference-aware sun/moon summary build, Today’s Energy card, and self chart entry with `chartMode: 'self'`.
- `client/screens/CreateGuestChartScreen.tsx`: guest birth-detail entry flow; validates required fields and navigates to `Chart` with `chartMode: 'guest'`. Typed-only locations can pass null coordinates and rely on existing View Only behavior.
- `client/screens/CompleteProfileScreen.tsx`: profile edit form, geocoding fallback, durable `users` table update, and auth-container safe-area layout.
- `client/screens/ForgotPasswordScreen.tsx`: neutral forgot-password request flow that calls Supabase reset email.
- `client/screens/ResetPasswordScreen.tsx`: password update form reached after recovery callback handling.
- `client/screens/ProfileScreen.tsx`: account/profile display plus chart preferences backed by `public.chart_preferences`; presentational cards are in `components/profile/`.
- `client/screens/ChartScreen.tsx`: route-validation shell — guards missing birth fields and invalid time zone, then delegates to `ChartScreenContent`.
- `client/components/charts/ChartScreenContent.tsx`: valid-chart compositor — owns `useChartData`, `useChartInterpretation`, `useSpace`, page building, and all chart UI rendering.
- `client/hooks/useChartData.ts`: load saved chart or compute chart with stored/default preferences, find existing chart, self auto-save, guest manual save, save warning state, and async cancellation/current-operation guards.
- `client/lib/charts.ts`: `ChartData` shape, `getChartCalculationPreferences`, `buildChartData`, `saveChart`, list/get/delete chart helpers.
- `client/lib/astro.ts`: natal/transit planet longitude calculation, preference-plumbed medium-orb aspects, approximate whole-sign house calculation, planet-house assignment.
- `client/lib/dailyTransits.ts`: Today’s Energy helper layer; exposes `computeTransitPlanets` via `astro`, `findDailyTransitAspects`, `findStrongestDailyTransitAspect`, and `buildTodayEnergy`.
- `client/lib/chartPageBuilders.ts`: builds modal pages from chart data and lexicon lookups.
- `client/lib/chartInterpretation.ts`: shared planet/house key guards and planet summary construction.
- `client/lib/lexicon/index.ts`: barrel export for all interpretation lookups.
- `client/jest.config.js`: Jest/Expo test configuration.
- `client/eslint.config.js`: Expo ESLint flat config with narrow test/config/R3F overrides.
- `client/lib/__tests__/profileCompletion.test.ts`: profile completion helper coverage.
- `client/lib/__tests__/chartDataValidation.test.ts`: persisted chart-data parser coverage.
- `client/lib/__tests__/journals.test.ts`: journal upsert payload coverage.
- `client/lib/__tests__/charts.test.ts`: chart generation, preference plumbing/fallback, and persistence helper coverage for `buildChartData`, `getChartCalculationPreferences`, and `saveChart`.
- `client/lib/__tests__/dailyTransits.test.ts`: deterministic transit planet shape, transit-to-natal identity separation, strongest fast transit selection, Today’s Energy build, and no-aspect fallback coverage.
- `client/lib/__tests__/accountDeletion.test.ts`: account deletion helper coverage for no-session, successful function invoke, and function error behavior.
- `client/hooks/__tests__/useChartData.test.tsx`: `useChartData` branch coverage — valid saved-chart load, invalid saved data fallback, missing-coordinate view-only, self auto-save, guest no-auto-save, save-warning on failure, manual save clearing the warning.
- `client/screens/__tests__/CheckEmailScreen.test.tsx`: auth/profile navigation coverage for missing email/code validation, resend success/failure, and OTP complete/incomplete profile reset paths.
- `client/screens/__tests__/AuthCallbackScreen.test.tsx`: deep-link callback coverage for token hash, auth code, fragment tokens, delayed URL events, and auth error alert plus finish routing.
- `client/screens/__tests__/ForgotPasswordScreen.test.tsx`: reset-email request coverage for missing email, neutral success copy, request failure, and back/login navigation.
- `client/screens/__tests__/ResetPasswordScreen.test.tsx`: password update coverage for validation, success routing, and Supabase update failures.
- `client/screens/__tests__/ProfileScreen.test.tsx`: destructive account deletion confirmation, cancel behavior, confirmed delete/sign-out, and failure/no-sign-out coverage.
- `client/screens/__tests__/DashboardScreen.test.tsx`: Dashboard complete/incomplete profile, auth metadata repair, saved summary hydration, Today’s Energy rendering, invalid `chart_data` fallback, auto-save, and missing-coordinate no-save coverage.
- `client/screens/__tests__/CreateGuestChartScreen.test.tsx`: guest form required-field validation, selected-coordinate guest navigation, and typed-location/null-coordinate guest navigation coverage.
- `client/screens/__tests__/CompleteProfileScreen.test.tsx`: load/prefill, validation, selected-coordinate save, manual geocode fallback, geocode failure, timezone, and `public.users` update coverage.
- `client/components/charts/__tests__/InterpretationCard.test.tsx`: long interpretation text splitting coverage for the clipping fix.
- `client/components/charts/__tests__/InterpretationModal.test.tsx`: modal closed state, one-page behavior, flex scroll containers, reduced safe-area padding, prev/next, circular boundary, close/backdrop, current-index updates, and close/reopen pager reset coverage.
- `supabase/migrations/20260508021000_canonical_chart_identity.sql`: canonical chart identity constraint using `NULLS NOT DISTINCT`.
- `supabase/migrations/20260508021100_handle_new_user_birth_coordinates.sql`: `handle_new_user` profile coordinate copy and safe metadata casting.
- `supabase/migrations/20260508021200_remove_client_purchase_insert_policy.sql`: removes client-side purchase insertion.
- `supabase/migrations/20260508021300_journals_chart_delete_set_null.sql`: makes `journals.chart_id` nullable on chart delete.
- `supabase/migrations/20260508021400_users_charts_updated_at_triggers.sql`: adds `updated_at` triggers for `users` and `charts`.
- `supabase/migrations/20260508021500_chart_preferences.sql`: adds durable chart preference storage with RLS, checks, and an `updated_at` trigger.
- `supabase/functions/delete-account/index.ts`: account deletion Edge Function that verifies the caller JWT, deletes user-owned app rows, then deletes the auth user through Supabase admin auth.
- `supabase/functions/delete-account/deno.json`: function-local Deno/editor config and Supabase JS import mapping.
- `supabase/functions/delete-account/deno.lock`: Deno dependency lockfile for the Edge Function.

## 4. Auth Flow

Signup:

- `SignupScreen.tsx` collects email, password, first/last name, birth date/time, location, time zone, and optional lat/lon.
- It defaults time zone from the device via `getDeviceTimeZoneNormalized`.
- Location autocomplete results set `birth_location`, `birth_lat`, `birth_lon`, and now update `time_zone` when OpenCage returns a valid timezone annotation.
- It calls `signUpWithEmail` in `lib/auth.ts`.
- `signUpWithEmail` passes profile fields into Supabase auth `options.data` and sets `emailRedirectTo` to `naksha://auth/callback`.
- That auth metadata is a signup/bootstrap handoff for `handle_new_user`, not the durable post-signup profile store.
- After signup succeeds, the app navigates to `CheckEmail` with `email` and a `profile` object in route params.

Email verification:

- `CheckEmailScreen.tsx` supports OTP code entry and resend.
- `verifySignupOtp(email, token)` calls `supabase.auth.verifyOtp({ email, token, type: 'email' })`.
- After verification, it calls `supabase.auth.getUser()` and upserts the route-param profile into `users`.
- It then fetches or uses the saved profile, determines whether required profile fields are complete, and calls `navigation.reset` to `Dashboard` or `CompleteProfile` deterministically.
- If the no-profile fetch path fails, the alert copy now identifies it as a profile load failure rather than a save failure.

Login:

- `LoginScreen.tsx` calls `signInWithEmail`, which uses `supabase.auth.signInWithPassword`.
- `App.tsx` listens to `supabase.auth.onAuthStateChange` and switches from the unauthenticated stack to the authenticated stack when a session exists.

Password reset:

- `LoginScreen.tsx` links to `ForgotPasswordScreen`.
- `ForgotPasswordScreen` validates that an email is present, calls `requestPasswordResetEmail`, and shows neutral success copy that does not reveal whether an account exists.
- `requestPasswordResetEmail` sends a Supabase reset email using the configured auth callback redirect.
- Supabase recovery links return through `AuthCallbackScreen`.
- `App.tsx` and `client/lib/authCallbackUrl.ts` normalize auth callback URLs for navigation matching while preserving the raw callback URL transiently in memory, so fragment recovery links can still be parsed after `AuthCallbackScreen` mounts.
- `AuthCallbackScreen` routes recovery callbacks to `ResetPasswordScreen` for token hash, auth code, and fragment-token paths.
- `ResetPasswordScreen` validates password length and confirmation, calls `supabase.auth.updateUser({ password })`, and routes after success based on current session behavior.
- Password reset / forgot-password is automated verified and manually verified.

Session persistence:

- `lib/supabase.ts` configures Supabase auth with `AsyncStorage`, `autoRefreshToken: true`, `persistSession: true`, and `detectSessionInUrl: false`.
- `App.tsx` calls `supabase.auth.getSession()` on boot, renders a loading spinner until ready, and stores only `user` in local state.

Deep-link callback:

- `AuthCallbackScreen.tsx` handles incoming URLs from `expo-linking`.
- It is registered outside the auth/unauthenticated stack split so it is reachable in both states.
- It supports `token_hash` plus `type`, auth `code`, and URL fragment `access_token`/`refresh_token`.
- After handling, it resets navigation to `Dashboard` if a session user exists, otherwise to `Login`.
- It does not permanently lock the flow when `getInitialURL()` returns null; real callback URLs are deduplicated while processing and after handling.
- Raw callback URLs, token values, and step-by-step success logs are not printed; actual auth callback failures use `console.warn` and show a user-visible alert before `finish()`.

Profile completion:

- `DashboardScreen.tsx` ensures a minimal `users` row exists after login.
- It fetches `users` by `id`; if fields are missing, it attempts to merge from `auth.user_metadata`.
- If the profile still needs required fields, it navigates to `CompleteProfile`.
- `CompleteProfileScreen.tsx` updates the `users` table only; it no longer mirrors profile/birth edits back into auth metadata.
- Editing location text clears stale coordinates; selecting autocomplete sets coordinates; saving a manually typed location geocodes missing coordinates and can update the timezone from OpenCage.
- `ProfileScreen.tsx` reads profile/birth display data from `users`.
- `ProfileScreen.tsx` reads/writes chart preferences through `public.chart_preferences`, not auth metadata.

Known auth/profile issues:

- Signup, login, OTP verification, auth deep-link callback, and password reset / forgot-password flows appear to work. Password reset has been automated verified and manually verified.
- Auth metadata still exists as signup/bootstrap handoff data and a Dashboard repair source for older/incomplete accounts.
- `AuthContext` exposes only `{ user }`, not auth actions or loading state.
- Navigation route types are mostly `any`, so auth flow route params are not compile-time enforced.
- Deep-link verification through `AuthCallbackScreen` remains a separate flow from OTP verification; both should stay aligned when profile requirements change.

## 5. Data Model / Supabase

Supabase source state:

- Local Supabase config and migrations now live in `supabase/`.
- The pulled schema dump remains in `supabase/migrations/20260508015720_remote_schema.sql`.
- New changes should be incremental migrations, not edits to the pulled remote schema dump.
- Local email confirmations are enabled in `supabase/config.toml` so the OTP flow can be tested locally.

Tables used by the frontend:

- `users`
- `chart_preferences`
- `charts`
- `journals`
- `subscriptions`
- `purchases`

Expected `users` fields:

- `id`: Supabase auth user id.
- `email`: user email.
- `first_name`, `last_name`.
- `birth_date`: likely `YYYY-MM-DD`.
- `birth_time`: likely `HH:MM:SS`.
- `birth_location`: formatted place name.
- `time_zone`: IANA time zone.
- `birth_lat`, `birth_lon`: numeric coordinates.

Expected `chart_preferences` fields:

- `user_id`: primary key, one row per user, references `public.users(id)` with `ON DELETE CASCADE`.
- `house_system`: currently constrained to `whole_sign`.
- `zodiac_type`: currently constrained to `tropical`.
- `orb_mode`: currently constrained to `medium`.
- `show_house_degrees`: currently defaults to `false`.
- `created_at`, `updated_at`; `updated_at` is maintained by `chart_preferences_set_updated_at`.

Current chart preference behavior:

- Preferences are stored durably in `public.chart_preferences`.
- `ProfileScreen` creates/upserts a default row when one does not exist.
- Unsupported options such as Placidus, Equal House, Sidereal, Vedic, tight orbs, and loose orbs are disabled/coming soon.
- `getChartCalculationPreferences` reads the row for chart builds and falls back to defaults when the row is missing or unreadable.
- `buildChartData` accepts `ChartCalculationPreferences`; `findAspects` receives `orb_mode`.
- Current supported behavior is intentionally unchanged: Whole Sign houses, Tropical zodiac, and medium orbs. No Placidus, Equal House, Sidereal, Vedic, tight/loose orbs, or house-degree display is implemented yet.

Expected `charts` fields:

- `id`, `user_id`, `name`.
- `birth_date`, `birth_time`, `time_zone`, `birth_lat`, `birth_lon`.
- `chart_data`: JSON object matching `ChartData`.
- `created_at`, `updated_at`.

Canonical saved-chart identity:

- `user_id`, `birth_date`, `birth_time`, `time_zone`, `birth_lat`, `birth_lon`.
- Migration `20260508021000_canonical_chart_identity.sql` drops the old 4-column uniqueness rule and attaches a clear canonical unique constraint.
- The canonical unique index uses `NULLS NOT DISTINCT`, so old null-coordinate rows cannot duplicate indefinitely.
- Frontend save and lookup paths now use the same coordinate-inclusive identity.
- New charts without `birth_lat`/`birth_lon` are view-only and are not persisted.

Expected `chart_data` shape:

```ts
{
  meta: {
    name: string
    birth_date: string
    birth_time: string
    time_zone: string
    birth_lat: number | null
    birth_lon: number | null
    computed_at: string
    instant_utc: string | null
  }
  planets: { name: string; lon: number }[]
  aspects: { a: string; b: string; type: 'conj' | 'opp' | 'trine' | 'square' | 'sextile'; orb: number }[]
  houses: { house: number; lon: number }[] | null
  planet_houses: { name: string; house: number }[] | null
}
```

Expected `journals` fields:

- `id`, `user_id`, `chart_id`, `prompt_template`, `title`, `content`, `created_at`, `updated_at`.

Expected `subscriptions` fields:

- `id`, `user_id`, `plan`, `status`, `start_date`, `end_date`, plus `created_at` because `ProfileScreen.tsx` orders by it.

Expected `purchases` fields:

- `id`, `user_id`, `product_type`, `product_id`, `amount`, `currency`, `purchase_date`.

RLS assumptions:

- Users can select/insert/update only their own `users` row where `id = auth.uid()`.
- Users can select/insert/update only their own `chart_preferences` row where `user_id = auth.uid()`.
- Users can select/insert/update/delete only their own `charts` where `user_id = auth.uid()`.
- Users can select/insert/update/delete only their own `journals` where `user_id = auth.uid()`.
- Users can read only their own `subscriptions` and `purchases`.
- Signup/profile flows require `users.upsert` to be permitted for the authenticated user id.
- The unsafe client purchase INSERT policy has been removed; purchases should be backend/service-role managed only.
- `journals.chart_id` now uses `ON DELETE SET NULL`, so deleting a chart should not fail solely because journals reference it.

Account deletion / data privacy:

- `ProfileScreen` exposes a Delete account action through the existing Data & Privacy card and shows a destructive confirmation before deleting.
- `client/lib/accountDeletion.ts` gets the current Supabase session and invokes the `delete-account` Edge Function with the bearer token.
- The React Native client never uses `SUPABASE_SERVICE_ROLE_KEY` and does not call `supabase.auth.admin.deleteUser`.
- `supabase/functions/delete-account/index.ts` accepts authenticated POST requests, verifies the JWT server-side with Supabase Auth, and derives `user.id` from the verified JWT rather than request body input.
- The Edge Function uses a service-role Supabase client server-side to delete app-owned rows in order: `messages`, `conversations`, `reports`, `journals`, `notifications`, `purchases`, `subscriptions`, `usage_events`, then `charts`.
- After app-owned rows are deleted, the Edge Function calls `auth.admin.deleteUser(user.id)` last.
- Existing cascades remove `public.users` from `auth.users` deletion and remove `chart_preferences` from `public.users` deletion.
- The `delete-account` Edge Function is deployed to Supabase project `ujupnlkobzhpjewruiac` and passed disposable-account manual QA. The tested user had app-owned data including saved charts; deletion completed, exited the authenticated account flow, prevented subsequent login, and left no rows for that user in the checked `auth.users`, `public.users`, `public.chart_preferences`, `public.charts`, and `public.journals` tables.
- This confirms the tested end-to-end deletion path; it is not a claim of broader production hardening, monitoring, or recovery coverage.
- Remaining privacy/account gaps are data export, retention policy, external subscription cancellation/refunds, and any future delete-data-without-deleting-account flow.

Schema/frontend contract:

- Remote schema is now source-visible, but it originated as a schema dump plus incremental fixes; future migrations should stay small and auditable.
- Supabase row types are generated in `client/lib/database.types.ts`; `client/lib/supabase.ts` uses `createClient<Database>()`, and shared row aliases derive from generated `Tables<'...'>` types.
- `handle_new_user` copies signup/bootstrap profile fields from auth metadata with safe casts; after signup, durable profile edits are owned by `public.users`.

## 6. Chart Flow

Birth data sources:

- Dashboard-to-chart path: `DashboardScreen` passes a `profile` route param and `chartMode: 'self'` to `ChartScreen`.
- Saved chart path: `MyCharts.tsx` passes `fromSaved: true`, `saved: chart_data`, and a reconstructed profile from chart metadata.
- Signup path: birth details are sent through auth metadata so `handle_new_user` can bootstrap `public.users`.
- Post-signup profile path: `CompleteProfileScreen` writes durable profile/birth edits to `public.users` only.

Chart modes and save behavior:

- `ChartRouteParams` supports optional `chartMode: 'self' | 'guest'`.
- Missing `chartMode` defaults to `'self'`, preserving existing routes and saved-chart opens.
- Self/generated natal charts with complete coordinates can auto-save.
- Guest/generated other-person charts do not auto-save; they can be manually saved when coordinates exist.
- Missing-coordinate charts remain `View Only` and are not persisted.
- Saved chart flow still uses `fromSaved` plus `saved` chart data and remains unchanged.
- `CreateGuestChartScreen` is the v1 user-facing entry flow for guest charts and passes `chartMode: 'guest'` to `Chart`.
- Typed-location guest charts may pass null coordinates and rely on the existing View Only behavior.

How birth data becomes chart data:

- `getChartCalculationPreferences` in `lib/charts.ts` reads `public.chart_preferences` and returns supported defaults on missing rows or fetch errors.
- `buildChartData` in `lib/charts.ts` accepts `ChartCalculationPreferences` and normalizes the time zone.
- `birthToUTC` in `lib/time.ts` converts local birth date/time to UTC using `luxon`.
- `computeNatalPlanets` in `lib/astro.ts` calculates geocentric ecliptic longitudes for Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto.
- `computeTransitPlanets` in `lib/astro.ts` uses the same planet calculation for a current/fixed UTC date, which powers Today’s Energy v1.
- `findAspects` receives `orb_mode`; only `medium` is supported today and produces the existing aspect output.
- If `birth_lat` and `birth_lon` exist, `computeWholeSignHouses` approximates the Ascendant and returns whole-sign house cusps.
- `assignPlanetsToWholeSignHouses` maps planets to whole-sign houses.
- `house_system`, `zodiac_type`, and `show_house_degrees` are plumbed through the calculation preferences contract, but only the current supported defaults are accepted.

Where calculations happen:

- Main calculation entry point: `client/lib/charts.ts`.
- Low-level astronomy and house math: `client/lib/astro.ts`.
- Dashboard fetches chart preferences before invoking `buildChartData` to generate sun/moon summary data when it needs to compute a chart.
- Dashboard also calls `buildTodayEnergy(planets, new Date())` to render Today’s Energy v1 from the user’s natal planets and current transit planets.
- `useChartData` fetches chart preferences before invoking `buildChartData` for chart screen rendering and manual-save rebuilds.
- Saved chart hydration still uses persisted, validated `chart_data` and does not recompute solely to apply preferences.

Daily transit / Today’s Energy behavior:

- `client/lib/dailyTransits.ts` limits v1 transit emphasis to fast visible personal planets: Moon, Sun, Mercury, Venus, and Mars.
- `findDailyTransitAspects(natalPlanets, transitPlanets, orbMode)` separates transit and natal identities before calling `findAspects`, so same-name transit/natal planets do not collapse into one identity.
- `findStrongestDailyTransitAspect` chooses the lowest-orb allowed transit-to-natal aspect, with deterministic tie-breaking.
- `buildTodayEnergy` returns transit Sun sign, transit Moon sign, and an optional strongest fast transit aspect with generic aspect meaning.
- This is intentionally a basic v1 Dashboard surface: no forecast detail screen, notifications, caching, premium gating, or user-configurable transit settings are implemented.

Where chart data is stored:

- Supabase `charts.chart_data` stores the computed JSON.
- Persisted chart JSON is parsed through `parseChartData` before it is trusted by `useChartData`, `MyCharts`, or Dashboard summary logic.
- `saveChart` requires `birth_lat` and `birth_lon`, then upserts a row with top-level birth fields plus the full JSON payload.
- The upsert conflict target is `user_id,birth_date,birth_time,time_zone,birth_lat,birth_lon`, matching the canonical database identity.
- `useChartData` and `DashboardScreen` look up saved charts by the same coordinate-inclusive identity when coordinates are available.
- `DashboardScreen` may auto-save the user's own chart while building the dashboard summary.
- `useChartData` auto-saves generated chart data only in self mode; guest mode waits for the user to tap save.
- If self auto-save fails in `useChartData`, the chart remains visible, `isSaved` stays false, and `ChartScreenContent` shows an inline warning near the save control.
- If coordinates are missing, chart screens build render-only chart data and avoid persisting ambiguous saved rows.
- `listCharts`, `getChart`, and `deleteChart` read/delete chart rows by `user_id`.

What UI renders it:

- `ChartScreen.tsx` is the route-validation shell; it guards missing birth fields and invalid time zone, then renders `ChartScreenContent`.
- `ChartScreenContent.tsx` composes the full chart view and owns all hook calls and rendering.
- `ChartHeader.tsx` renders title, location/zone/coords, and Sun summary.
- `ChartScreenContent.tsx` shows `Saved to My Charts` for saved rows, `Save Chart` for unsaved guest charts, `Save Chart Data` for unsaved self charts, and disabled `View Only` when coordinates are missing.
- `ChartWheel.tsx` renders signs, houses, planets, and aspect lines with SVG.
- `PlanetPositionsList.tsx` renders planet positions and inline summaries.
- `HousesList.tsx` renders whole-sign house rows and inline summaries.
- `AspectsList.tsx` renders aspect rows and generic aspect summaries.
- `ChartCompass.tsx` renders an expandable glyph/aspect legend.
- `InterpretationModal.tsx` and `InterpretationCard.tsx` render paged long-form interpretation.

## 7. Interpretation Flow

Lexicon structure:

- `client/lib/lexicon/types.ts`: shared `ZodiacName`, `HouseNumber`, `AspectType`, `PlanetKey`, `Interpretation`.
- `client/lib/lexicon/planets/index.ts`: planet-in-sign meanings.
- `client/lib/lexicon/planetHouses/meanings.ts`: planet-in-house meanings.
- `client/lib/lexicon/houses/meanings.ts`: generic house meanings.
- `client/lib/lexicon/houses/signMeanings.ts`: sign-on-house meanings and fallback sign flavor text.
- `client/lib/lexicon/aspects/index.ts`: generic aspect type meanings.
- `client/lib/lexicon/signs/index.ts`: sign archetypes and longitude-to-sign helpers.
- `client/lib/lexicon/index.ts`: barrel export used by screens/components.

Interpretation modules:

- Planet/sign lookups use `getPlanetSignMeaning(planet, sign)`.
- Planet/house lookups use `getPlanetHouseMeaning(planet, house)`.
- Generic house lookups use `getHouseMeaning(house)`.
- House/sign lookups use `getHouseSignMeaning(house, sign)`, with handcrafted meanings or fallback blended text.
- Aspect lookups use `getAspectMeaning(type)`; aspect meanings are type-level, not planet-pair-specific.

How `ChartScreenContent` builds interpretation pages:

- It converts computed planets into ordered `PlanetKey[]`.
- `buildPlanetPages(planets, orderedPlanetKeys, planetHouses)` builds one page per planet.
- Each planet page includes sign meaning, house meaning when available, and a summary from `buildPlanetSummary`.
- `buildHousePages(houses)` builds one page per house with generic house and sign-on-house blocks.
- Aspect interpretations currently appear in `AspectsList`, not in the modal page system.

How modal/card rendering works:

- `useChartInterpretation` tracks whether the active focus is a planet or house.
- Opening a planet interpretation also updates `SpaceProvider` focused planet state.
- `InterpretationModal` wraps pages in `PagerView` and simulates circular paging by adding first/last duplicate pages.
- `InterpretationModal` circular swipe/infinite paging works manually: prev/next wraps at both ends, swiping through sentinel pages jumps back to the corresponding real page, and close/reopen resets pager mounting state.
- `InterpretationCard` filters empty blocks and renders title, subtitle, summary, and long or short text blocks.
- `InterpretationCard` splits long interpretation prose into paragraph/sentence text nodes to avoid clipping the final line or final words.
- Interpretation clipping appears fully fixed in manual app run-through. Current scroll position is preserved per page by design; that can be revisited as UX polish, but it is not considered a bug or release blocker.

Notable interpretation coupling:

- `PlanetPositionsList.tsx` has its own local `buildPlanetSummary` logic that duplicates `lib/chartInterpretation.ts`.
- `ChartScreenContent.tsx` is responsible for both chart layout and interpretation page assembly; the page-building logic has not been extracted to a dedicated hook yet.

## 8. Current UI/UX State

Screens that feel usable:

- `LoginScreen.tsx`: simple login form with loading and error state.
- `SignupScreen.tsx`: complete signup/profile form, including date/time/location/time zone.
- `CheckEmailScreen.tsx`: OTP entry/resend flow now resets navigation deterministically after successful verification.
- `DashboardScreen.tsx`: shows greeting, signs, Today’s Energy v1, birth details, and main navigation actions.
- `CreateGuestChartScreen.tsx`: creates a one-off guest chart from another person's birth details and selected coordinates when available.
- `ChartScreen.tsx`: usable chart view with SVG wheel, lists, legend, clipped-text-safe interpretation modal with circular swipe/infinite paging, and explicit save states for self, guest, saved, and view-only charts.
- `MyCharts.tsx`: saved chart list with open/delete.
- `JournalListScreen.tsx` and `JournalEditorScreen.tsx`: basic journal create/edit/delete flow.
- `ProfileScreen.tsx`: readable account/profile/preferences/subscription/purchases/privacy surface; unsupported chart preference choices are disabled/coming soon.

Screens that need polish:

- `CompleteProfileScreen.tsx`: location/coordinate/timezone lifecycle and top spacing are improved, but it still mixes load/save/geocode and profile form responsibilities.
- `DashboardScreen.tsx`: Today’s Energy v1 is intentionally basic and could use UI/UX polish once release priorities are set.
- `ProfileScreen.tsx`: preferences have durable table storage and are read by chart builds, but the chart engine still only supports the current defaults.
- Guest/other-person chart creation: v1 entry flow exists, but reusable guest profile storage/management does not.
- `ChatScreen.tsx` and `SubscriptionScreen.tsx`: empty stub files and not registered in `App.tsx`.

Component size/coupling concerns:

- `ProfileScreen.tsx`: Presentational card extraction is done; all Supabase calls, preference save handlers, and account/privacy action callbacks remain in the screen.
- `DashboardScreen.tsx`: 455 lines, mixes profile repair, chart lookup/generation, summary derivation, Today’s Energy construction/rendering, and dashboard UI.
- `CompleteProfileScreen.tsx`: 323 lines, mixes data load/save, geocoding fallback, and UI.
- `CheckEmailScreen.tsx`: 350 lines, mixes OTP flow and custom UI.
- `useChartData.ts`: 422 lines, owns loading, lookup, hydration, computation, auto-save, manual save, chart-data validation handling, save warnings, and async cancellation guards.
- `InterpretationModal.tsx`: 333 lines, owns pager loop behavior plus modal shell.
- `InterpretationCard.tsx`: 195 lines, owns interpretation block filtering and paragraph/sentence text splitting.

## 9. Known Bugs / Inconsistencies

| Issue | Files involved | Symptom | Likely cause |
| --- | --- | --- | --- |
| Additional chart modes are not implemented | `ProfileScreen.tsx`, `lib/astro.ts`, `lib/charts.ts`, `chart_preferences` migration | Users can see unsupported modes as coming soon, but charts remain Whole Sign/Tropical with medium aspect orbs. | Preference plumbing now reads/passes the supported defaults, but math, DB constraints, UI, and tests for additional systems do not exist yet. |
| Stub screens and service modules exist | `ChatScreen.tsx`, `SubscriptionScreen.tsx`, `lib/conversations.ts`, `lib/subscriptions.ts`, `lib/reports.ts`, `lib/notifications.ts`, `lib/usage.ts` | Future features have placeholder files but no implementation; the empty screens are not registered in `App.tsx`. | Scaffolding exists ahead of feature work. |
| Signup metadata can become stale after bootstrap | `SignupScreen.tsx`, `lib/auth.ts`, `DashboardScreen.tsx`, `handle_new_user` migration | Auth metadata may not match later edits in `public.users`. | Auth metadata is intentionally retained as signup/bootstrap handoff and Dashboard repair input, not as durable profile storage. |
| Guest chart persistence/profile management is not implemented | `CreateGuestChartScreen.tsx`, `ChartScreen.tsx`, `useChartData.ts`, schema | Users can create and view a one-off guest chart, but there is no reusable guest birth-profile library, relationship metadata, or `birth_profiles` table. | Guest Chart UI v1 intentionally avoided schema and profile-management scope. |
| Migration history starts from a remote schema dump | `supabase/migrations/20260508015720_remote_schema.sql`, later migrations | The schema is now reproducible, but history before the dump is not incremental. | The remote project schema was pulled into the repo after initial development. |
| Schema/migration validation is not automated | `supabase/migrations/`, CI/not configured | App tests cover high-risk client flows, but migration reset/diff validation is still a manual local step. | No CI-backed Supabase validation command exists yet. |

## 10. Technical Debt

State duplication:

- Signup/bootstrap profile fields still pass through `auth.user_metadata`, but durable profile edits are owned by `public.users`.
- Chart preferences are stored in `public.chart_preferences` and read by chart calculation paths.
- Chart computation happens in both `DashboardScreen` and `useChartData`.
- Today’s Energy is computed in `DashboardScreen` from chart planets plus `dailyTransits` helpers; keep future forecast expansion separated from natal chart persistence.
- Self chart auto-save can happen from more than one surface, though the canonical identity keeps the saved row deduplicated.
- Planet summary logic is duplicated in `PlanetPositionsList.tsx` and `chartInterpretation.ts`.
- Core profile/chart route shapes now have shared types in `client/lib/domainTypes.ts`, but navigation params overall are still not strongly typed.

Ownership/design gaps:

- Chart saving now has a mode rule: self charts can auto-save, guest charts are manual-save only, and missing-coordinate charts are view-only.
- Guest chart persistence, reusable birth profiles, relationship labels, and any future guest-specific metadata are not designed yet.
- Chart preference plumbing supports only the constrained defaults; additional systems are still product/math work.
- The `charts` schema does not currently distinguish self vs guest rows with `chart_type`, `is_primary`, `relationship_label`, or a separate birth-profile model.
- Auth verification is split between manual OTP entry and deep-link callback handling, with shared profile completion rules only informally aligned.

Fragile flows:

- Route params are required at runtime but not enforced with a typed navigator.
- Chart screen is deep-linkable without guaranteed params.
- Dashboard throttles/reentrancy with refs, which works but is hard to reason about.
- Location selection, manual geocode fallback, and timezone inference now work together, but this flow still depends on several screens/components sharing state through props.

Large components:

- `ProfileScreen` presentational extraction is done. Next step is extracting the data-loading and preference-save logic into a hook.
- Break up `DashboardScreen`, `CompleteProfileScreen`, `CheckEmailScreen`, `useChartData`, and `InterpretationModal` when touching their areas.
- Cleanup/stabilization is complete enough for feature expansion. Future decomposition should be attached to a specific feature, product requirement, or real defect.

Naming and consistency issues:

- File name `MyCharts.tsx` exports `MyChartsScreen`; most other screen files include `Screen`.
- Aspect types use short internal names (`conj`, `opp`) while UI displays those raw strings.
- UI uses a mix of shared `Button`/`Card` and inline `TouchableOpacity` styles.
- Some source comments include temporary notes such as "NEW", "coming soon", or disabled lint comments.

Testing baseline:

- `npm test` runs 19 suites (106 tests), including password reset, account deletion, profile completion, chart data validation, journals, charts, daily transits, `useChartData`, auth callback, CheckEmail, Dashboard, CreateGuestChart, CompleteProfile, Profile, InterpretationCard, and InterpretationModal coverage.
- Dashboard profile repair/chart summary/Today’s Energy, password reset, account deletion confirmation/helper behavior, CompleteProfile save/geocode lifecycle, InterpretationCard clipping, and InterpretationModal pager behavior are covered.
- No schema tests or automated Supabase migration validation commands are configured.

## 11. Recommended Next 5 Tasks

Note: cleanup/stabilization is complete enough for feature expansion. Runtime chart validation, chart preference plumbing for current defaults, save-warning visibility, AuthCallback hardening, journal payload coverage, async cancellation guards, Jest coverage, ESLint, lint cleanup, generated Supabase types, Dashboard tests, CompleteProfile tests, InterpretationCard clipping tests, InterpretationModal pager tests, and Today’s Energy v1 are complete.

1. Privacy copy and data export planning.
   - Account deletion is deployed and manually verified, but data export expectations and user-facing privacy language remain product gaps.

2. Release readiness and CI-backed schema/migration validation.
   - Automate or document a reliable `supabase db reset`/`db diff` workflow so migration drift is caught before release.

3. UI/UX revamp and release QA polish.
   - Dashboard, chart interpretation, guest chart entry, saved charts, and profile should get a cohesive visual/interaction pass before release.

4. Account lifecycle policy decisions.
   - Define retention policy, external subscription cancellation/refund responsibilities, and whether delete-data-without-deleting-account is needed.

5. Decide guest profile persistence / relationship metadata scope.
   - Guest Chart UI v1 exists without schema changes. Add reusable guest profiles, relationship labels, or a `birth_profiles` model only after the product workflow is explicit.

## 12. Best Next Vertical Slice

Recommended slice: privacy copy and data export planning.

Password reset and account deletion MVP are implemented and manually verified. The deployed deletion path has passed disposable-account QA; the next release-readiness slice should tighten user-facing privacy and export expectations without changing chart math, chart identity, guest save semantics, or profile data ownership.

Goal:

- Document or implement minimal privacy copy for account deletion and data export expectations.
- Decide the MVP export scope and delivery method, plus the retention policy.
- Document external subscription cancellation/refund responsibilities and decide whether delete-data-without-deleting-account is needed.
- Keep service-role secrets server-side only.

Files likely involved:

- Profile privacy copy, export/backend planning or implementation files, release checklist/docs, and focused tests only if behavior changes.
- No migration should be needed unless the product chooses to add retention/audit/export tables.

Expected behavior:

- Users can request password reset and delete their account through the app.
- Account deletion remains authenticated, server-side, and derived from the verified JWT user id.
- The deployed Edge Function remains covered by the completed disposable-account QA without implying broader production hardening.
- Users receive accurate expectations about deletion, export availability, retention, and external billing responsibilities.
- Guest chart persistence, relationship metadata, and any `birth_profiles` table remain separate product decisions.

Verification steps:

- Run `cd client && npm run typecheck`.
- Run `cd client && npm test`.
- Run `cd client && npm run lint`.
- Run `git diff --check`.

## 13. Agent Instructions Going Forward

How Codex should work in this repo:

- Treat `client/` as the active app.
- Treat `supabase/migrations/` as the source-controlled database change history.
- Read relevant files before editing; prefer `rg` for search.
- Keep changes narrowly scoped to the requested vertical slice.
- Use `apply_patch` for manual file edits.
- Run `cd client && npm run typecheck` before handing back code changes.
- Run `cd client && npm test` and `cd client && npm run lint` before handing back code changes.
- For schema changes, create a new incremental migration; do not edit `20260508015720_remote_schema.sql`.
- Do not edit generated Android files unless the task is explicitly native-build related.
- Do not read or print `.env` values; only reference required variable names.
- Do not casually rewrite lexicon prose. It is product content, not just code.
- Do not change chart math, canonical chart identity, or auth flow behavior without naming the user-facing effect and verification plan.
- Treat `auth.user_metadata` as signup/bootstrap handoff only for profile/birth data.
- Treat `public.users` as the durable profile/birth source of truth.
- Treat `public.chart_preferences` as the durable chart preference source of truth; do not write `pref_*` values back to auth metadata.
- Use `getChartCalculationPreferences(userId)` before computed chart builds when a user is available; missing or failed preference reads fall back to current defaults.
- `buildChartData(input, preferences?)` accepts `ChartCalculationPreferences`; `findAspects(planets, orbMode)` currently supports only `orb_mode: 'medium'`.
- Treat `ChartRouteParams.chartMode` as the current chart save mode contract: missing means `'self'`, Dashboard passes `'self'`, and future other-person flows should pass `'guest'`.
- Preserve the current save rule: self/generated charts with coordinates may auto-save; guest/generated charts must not auto-save; guest charts can be manually saved when coordinates exist.
- Preserve saved-chart navigation through `fromSaved` and `saved`; do not require `chartMode` for that flow.
- Preserve the current canonical chart identity unless the user explicitly changes the product rule: `user_id`, `birth_date`, `birth_time`, `time_zone`, `birth_lat`, `birth_lon`, with `NULLS NOT DISTINCT` in the database.
- Preserve the current view-only behavior for charts missing coordinates unless the user explicitly changes persistence semantics.
- Do not claim guest chart persistence/profile management, synastry, compatibility, composite charts, reports, premium gating, or guest-specific schema support exists yet.
- Do not claim Placidus, Equal House, Sidereal, Vedic, tight/loose orbs, custom orb modes, or house-degree display are implemented; current `chart_preferences` checks allow only supported defaults.

Prompt style that works well:

- Name one vertical slice.
- Include target behavior, files or surfaces, and what should remain untouched.
- Say whether schema changes are allowed.
- Say whether UX copy/content changes are allowed.
- Ask for verification commands and a short final summary.

What not to touch casually:

- `client/.env`
- `client/android/`
- `supabase/migrations/20260508015720_remote_schema.sql`
- Large lexicon files under `client/lib/lexicon/`
- Auth callback/session behavior
- Signup metadata and Dashboard repair behavior
- `chart_preferences` check constraints and RLS policies
- `ChartRouteParams.chartMode` semantics
- Chart uniqueness and stored `chart_data` shape
- Generated assets under `client/assets/`

Useful verification commands:

- `cd client && npm run typecheck`
- `cd client && npm test`
- `cd client && npm run lint`
- `supabase db diff`
- `supabase db reset`
- `cd client && npm run start`
- `cd client && npm run android`
- `cd client && npm run ios`
- `cd client && npm run web`

Current command gaps:

- Supabase migration validation is manual; run `supabase db reset` locally before pushing schema changes, and use `supabase db push` only when intentionally applying migrations to the remote project.
