# Naksha Codebase Handoff

Generated: 2026-05-07  
Last updated: 2026-05-11 — after stabilization fixes for chart data validation, chart save warnings, auth callbacks, journals, and async chart loading.
Scope: source-of-truth repository handoff. This update is documentation-only.
Last recorded code verification: `cd client && npm run typecheck`, `cd client && npm test`, and `git diff --check` pass.

## 1. Executive Summary

Naksha is a mobile-first astrology app built with Expo, React Native, TypeScript, and Supabase. The current product centers on authenticated users entering birth details, generating a natal chart, viewing planetary positions/houses/aspects, reading local lexicon-based interpretations, saving charts, and writing journal entries.

What already works:

- Email/password auth with Supabase, persisted through AsyncStorage.
- Signup flow that collects birth details, passes them through auth metadata for bootstrap, and persists them durably in `public.users`.
- Login, check-email OTP verification with deterministic navigation reset, deep-link callback handling, profile completion, dashboard, chart view, saved chart list, profile screen, and journal list/editor.
- Natal chart computation from birth date/time/time zone using `luxon` and `astronomy-engine`.
- Whole-sign house calculation when latitude/longitude are available.
- Local chart interpretation from lexicon files for planet/sign, planet/house, house/sign, generic house, and aspect meanings.
- Supabase chart persistence through a `charts` table and journal persistence through a `journals` table.
- Explicit chart route mode groundwork: self charts can auto-save when coordinates exist; guest charts are manual-save only.
- Source-controlled Supabase migrations now exist under `supabase/migrations/`, including chart identity, profile coordinate trigger, purchase policy, and journal delete behavior fixes.
- Location autocomplete can populate coordinates and update the selected time zone from OpenCage timezone annotations.
- `public.users` is now the durable source of truth for profile/birth data after signup/bootstrap.
- `public.chart_preferences` is now the durable source of truth for chart preference storage.
- `ProfileScreen` display-only and interactive presentational cards extracted into `client/components/profile/`.
- Shared profile completeness helpers (`isProfileComplete`, `needsProfileCompletion`, `profileFromAuthMetadata`) extracted to `client/lib/profileCompletion.ts` and used by both `DashboardScreen` and `CheckEmailScreen`.
- `ChartScreen` split into a route-validation shell and `ChartScreenContent`; all hooks and rendering live in `ChartScreenContent` after both guards pass.
- Persisted `chart_data` is validated through `parseChartData` before saved-chart hydration, My Charts opening, and Dashboard summary use.
- Self chart auto-save failures now show an inline save warning while keeping the chart rendered; manual save success clears the warning.
- `AuthCallbackScreen` now avoids locking out later URL events when no initial URL exists, deduplicates real callback URLs, removes raw/sensitive callback logging, and surfaces auth callback failures with a user-visible alert.
- `useChartData` now has mounted/current-operation guards so stale async loads or saves do not update state after unmount or after a newer load supersedes them.
- Journal create-mode payloads omit `id` when no id exists, while update-mode payloads preserve `id`.
- Jest is configured with 7 suites and 35 tests: pure-helper coverage, chart generation/persistence helper coverage, `useChartData` branch coverage, and auth/profile navigation coverage for `CheckEmailScreen` and `AuthCallbackScreen`.
- `CompleteProfileScreen` top spacing was tightened by removing duplicate safe-area padding from its in-screen header.

What is incomplete or unstable:

- `server/` is empty, and several service files are placeholders: `conversations.ts`, `notifications.ts`, `reports.ts`, `subscriptions.ts`, `usage.ts`.
- `ChatScreen.tsx` and `SubscriptionScreen.tsx` are empty stub files and are not registered in `App.tsx` navigation or linking config.
- Unsupported chart preferences remain disabled/coming soon and are not applied to chart math.
- Guest/other-person chart creation UI is not implemented yet; `chartMode: 'guest'` is groundwork only.
- Charts without birth coordinates are intentionally view-only: they can render planet data, but are not persisted because canonical saved-chart identity requires coordinates.
- `auth.user_metadata` still carries signup/bootstrap profile data for `handle_new_user` and older-account repair, but profile edits no longer mirror back to auth metadata.
- Auth/profile navigation, chart helper, and `useChartData` branch coverage are in place; remaining testing gaps are Dashboard profile repair and chart summary, `CompleteProfileScreen` save/geocode lifecycle, `InterpretationModal` pager logic, and broader migration/schema validation.
- There is no `lint` npm script.

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

- `client/App.tsx`: root auth session bootstrap, linking config, stack navigation split, `AuthContext`, `SpaceProvider`.
- `client/lib/supabase.ts`: Supabase client, AsyncStorage persistence, Expo public env vars.
- `client/lib/auth.ts`: sign up, resend, OTP verify, login, logout, get user.
- `client/lib/domainTypes.ts`: shared frontend domain types for profile fields, user rows, chart mode, and chart route/profile params.
- `client/lib/profileCompletion.ts`: `isProfileComplete`, `needsProfileCompletion`, `profileFromAuthMetadata`, `ProfileCompletionData` type; shared by `DashboardScreen` and `CheckEmailScreen`.
- `client/lib/chartDataValidation.ts`: runtime parser for persisted `ChartData` JSON; returns `null` for malformed or schema-drifted rows.
- `client/lib/geocode.ts`: `geocodePlace` — OpenCage geocoding helper used by `CompleteProfileScreen`.
- `client/lib/journals.ts`: journal list/upsert/delete helpers; create-mode upserts omit `id` when no id exists.
- `client/screens/DashboardScreen.tsx`: profile load/repair, profile completion redirect, sun/moon summary, and self chart entry with `chartMode: 'self'`.
- `client/screens/CompleteProfileScreen.tsx`: profile edit form, geocoding fallback, durable `users` table update, and auth-container safe-area layout.
- `client/screens/ProfileScreen.tsx`: account/profile display plus chart preferences backed by `public.chart_preferences`; presentational cards are in `components/profile/`.
- `client/screens/ChartScreen.tsx`: route-validation shell — guards missing birth fields and invalid time zone, then delegates to `ChartScreenContent`.
- `client/components/charts/ChartScreenContent.tsx`: valid-chart compositor — owns `useChartData`, `useChartInterpretation`, `useSpace`, page building, and all chart UI rendering.
- `client/hooks/useChartData.ts`: load saved chart or compute chart, find existing chart, self auto-save, guest manual save, save warning state, and async cancellation/current-operation guards.
- `client/lib/charts.ts`: `ChartData` shape, `buildChartData`, `saveChart`, list/get/delete chart helpers.
- `client/lib/astro.ts`: planet longitude calculation, aspects, approximate whole-sign house calculation, planet-house assignment.
- `client/lib/chartPageBuilders.ts`: builds modal pages from chart data and lexicon lookups.
- `client/lib/chartInterpretation.ts`: shared planet/house key guards and planet summary construction.
- `client/lib/lexicon/index.ts`: barrel export for all interpretation lookups.
- `client/jest.config.js`: Jest/Expo test configuration.
- `client/lib/__tests__/profileCompletion.test.ts`: profile completion helper coverage.
- `client/lib/__tests__/chartDataValidation.test.ts`: persisted chart-data parser coverage.
- `client/lib/__tests__/journals.test.ts`: journal upsert payload coverage.
- `client/lib/__tests__/charts.test.ts`: chart generation and persistence helper coverage for `buildChartData` and `saveChart`.
- `client/hooks/__tests__/useChartData.test.tsx`: `useChartData` branch coverage — valid saved-chart load, invalid saved data fallback, missing-coordinate view-only, self auto-save, guest no-auto-save, save-warning on failure, manual save clearing the warning.
- `client/screens/__tests__/CheckEmailScreen.test.tsx`: auth/profile navigation coverage for missing email/code validation, resend success/failure, and OTP complete/incomplete profile reset paths.
- `client/screens/__tests__/AuthCallbackScreen.test.tsx`: deep-link callback coverage for token hash, auth code, fragment tokens, delayed URL events, and auth error alert plus finish routing.
- `supabase/migrations/20260508021000_canonical_chart_identity.sql`: canonical chart identity constraint using `NULLS NOT DISTINCT`.
- `supabase/migrations/20260508021100_handle_new_user_birth_coordinates.sql`: `handle_new_user` profile coordinate copy and safe metadata casting.
- `supabase/migrations/20260508021200_remove_client_purchase_insert_policy.sql`: removes client-side purchase insertion.
- `supabase/migrations/20260508021300_journals_chart_delete_set_null.sql`: makes `journals.chart_id` nullable on chart delete.
- `supabase/migrations/20260508021400_users_charts_updated_at_triggers.sql`: adds `updated_at` triggers for `users` and `charts`.
- `supabase/migrations/20260508021500_chart_preferences.sql`: adds durable chart preference storage with RLS, checks, and an `updated_at` trigger.

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
- Chart generation still uses whole-sign/tropical/fixed-orb behavior; the preference table is storage groundwork, not implementation of additional modes.

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

Schema/frontend mismatch risks:

- Remote schema is now source-visible, but it originated as a schema dump plus incremental fixes; future migrations should stay small and auditable.
- Supabase row types are still hand-maintained rather than generated from the database schema.
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
- Guest chart creation UI is not implemented yet; chart mode is groundwork for that future feature.

How birth data becomes chart data:

- `buildChartData` in `lib/charts.ts` normalizes the time zone.
- `birthToUTC` in `lib/time.ts` converts local birth date/time to UTC using `luxon`.
- `computeNatalPlanets` in `lib/astro.ts` calculates geocentric ecliptic longitudes for Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto.
- `findAspects` computes conjunction, opposition, trine, square, and sextile within fixed default orbs.
- If `birth_lat` and `birth_lon` exist, `computeWholeSignHouses` approximates the Ascendant and returns whole-sign house cusps.
- `assignPlanetsToWholeSignHouses` maps planets to whole-sign houses.

Where calculations happen:

- Main calculation entry point: `client/lib/charts.ts`.
- Low-level astronomy and house math: `client/lib/astro.ts`.
- Dashboard also invokes `buildChartData` to generate sun/moon summary data.
- `useChartData` invokes `buildChartData` for chart screen rendering and saving.

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
- `InterpretationCard` filters empty blocks and renders title, subtitle, summary, and long or short text blocks.

Notable interpretation coupling:

- `PlanetPositionsList.tsx` has its own local `buildPlanetSummary` logic that duplicates `lib/chartInterpretation.ts`.
- `ChartScreenContent.tsx` is responsible for both chart layout and interpretation page assembly; the page-building logic has not been extracted to a dedicated hook yet.

## 8. Current UI/UX State

Screens that feel usable:

- `LoginScreen.tsx`: simple login form with loading and error state.
- `SignupScreen.tsx`: complete signup/profile form, including date/time/location/time zone.
- `CheckEmailScreen.tsx`: OTP entry/resend flow now resets navigation deterministically after successful verification.
- `DashboardScreen.tsx`: shows greeting, signs, birth details, and main navigation actions.
- `ChartScreen.tsx`: usable chart view with SVG wheel, lists, legend, interpretation modal, and explicit save states for self, guest, saved, and view-only charts.
- `MyCharts.tsx`: saved chart list with open/delete.
- `JournalListScreen.tsx` and `JournalEditorScreen.tsx`: basic journal create/edit/delete flow.
- `ProfileScreen.tsx`: readable account/profile/preferences/subscription/purchases/privacy surface; unsupported chart preference choices are disabled/coming soon.

Screens that need polish:

- `CompleteProfileScreen.tsx`: location/coordinate/timezone lifecycle and top spacing are improved, but it still mixes load/save/geocode and profile form responsibilities.
- `ProfileScreen.tsx`: preferences now have durable table storage, but the chart engine still only supports the current defaults.
- Guest/other-person chart creation: route and hook mode support exists, but no user-facing entry form exists yet.
- `ChatScreen.tsx` and `SubscriptionScreen.tsx`: empty stub files and not registered in `App.tsx`.

Component size/coupling concerns:

- `ProfileScreen.tsx`: 312 lines. Presentational card extraction is done; all Supabase calls and preference save handlers remain in the screen. The screen now mixes data loading with glue for chart preferences and account action callbacks.
- `DashboardScreen.tsx`: 356 lines, mixes profile repair, chart lookup/generation, summary derivation, and dashboard UI.
- `CompleteProfileScreen.tsx`: 323 lines, mixes data load/save, geocoding fallback, and UI.
- `CheckEmailScreen.tsx`: 350 lines, mixes OTP flow and custom UI.
- `useChartData.ts`: 397 lines, owns loading, lookup, hydration, computation, auto-save, manual save, chart-data validation handling, save warnings, and async cancellation guards.
- `InterpretationModal.tsx`: 292 lines, owns pager loop behavior plus modal shell.

## 9. Known Bugs / Inconsistencies

| Issue | Files involved | Symptom | Likely cause |
| --- | --- | --- | --- |
| Additional chart modes are not implemented | `ProfileScreen.tsx`, `lib/astro.ts`, `lib/charts.ts`, `chart_preferences` migration | Users can see unsupported modes as coming soon, but charts remain whole-sign/tropical with fixed aspect orbs. | `chart_preferences` currently constrains values to supported defaults; chart math has not implemented additional systems. |
| Stub screens and service modules exist | `ChatScreen.tsx`, `SubscriptionScreen.tsx`, `lib/conversations.ts`, `lib/subscriptions.ts`, `lib/reports.ts`, `lib/notifications.ts`, `lib/usage.ts` | Future features have placeholder files but no implementation; the empty screens are not registered in `App.tsx`. | Scaffolding exists ahead of feature work. |
| Signup metadata can become stale after bootstrap | `SignupScreen.tsx`, `lib/auth.ts`, `DashboardScreen.tsx`, `handle_new_user` migration | Auth metadata may not match later edits in `public.users`. | Auth metadata is intentionally retained as signup/bootstrap handoff and Dashboard repair input, not as durable profile storage. |
| Guest chart creation is only groundwork | `domainTypes.ts`, `ChartScreen.tsx`, `useChartData.ts` | `chartMode: 'guest'` can prevent auto-save, but there is no screen for entering another person's birth data yet. | Route/hook behavior landed before the user-facing guest chart workflow. |
| Supabase row types are still hand-maintained | `domainTypes.ts`, `ProfileScreen.tsx`, `lib/charts.ts` | Shared types reduce drift, but they are not generated from the live schema. | No generated Supabase type pipeline exists yet. |
| Migration history starts from a remote schema dump | `supabase/migrations/20260508015720_remote_schema.sql`, later migrations | The schema is now reproducible, but history before the dump is not incremental. | The remote project schema was pulled into the repo after initial development. |
| Limited automated regression coverage | `client/package.json`, `client/lib/__tests__/`, `client/hooks/__tests__/`, `client/screens/__tests__/` | Jest now has 7 suites / 35 tests covering pure helpers, chart helpers, `useChartData`, `CheckEmailScreen`, and `AuthCallbackScreen`. Remaining gaps are Dashboard profile repair/chart summary, `CompleteProfileScreen` save/geocode lifecycle, `InterpretationModal` pager, and schema/migration validation. | Test coverage is expanding from targeted helpers and high-risk auth/chart flows toward broader screen and schema coverage. |

## 10. Technical Debt

State duplication:

- Signup/bootstrap profile fields still pass through `auth.user_metadata`, but durable profile edits are owned by `public.users`.
- Chart preferences are now stored in `public.chart_preferences`.
- Chart computation happens in both `DashboardScreen` and `useChartData`.
- Self chart auto-save can happen from more than one surface, though the canonical identity keeps the saved row deduplicated.
- Planet summary logic is duplicated in `PlanetPositionsList.tsx` and `chartInterpretation.ts`.
- Core profile/chart route shapes now have shared types in `client/lib/domainTypes.ts`, but navigation params overall are still not strongly typed.

Ownership/design gaps:

- Chart saving now has a mode rule: self charts can auto-save, guest charts are manual-save only, and missing-coordinate charts are view-only.
- Guest chart creation, naming, and any future guest-specific metadata are not designed yet.
- Chart preference storage exists, but the chart engine currently supports only the constrained defaults.
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

Naming and consistency issues:

- File name `MyCharts.tsx` exports `MyChartsScreen`; most other screen files include `Screen`.
- Aspect types use short internal names (`conj`, `opp`) while UI displays those raw strings.
- UI uses a mix of shared `Button`/`Card` and inline `TouchableOpacity` styles.
- Some source comments include temporary notes such as "NEW", "coming soon", or disabled lint comments.

Testing gaps:

- `npm test` runs 7 suites (35 tests): `profileCompletion`, `chartDataValidation`, `journals`, `charts`, `useChartData`, `CheckEmailScreen`, and `AuthCallbackScreen`.
- Remaining gaps: Dashboard profile repair and chart summary, `CompleteProfileScreen` save/geocode lifecycle, `InterpretationModal` pager logic, and broader migration/schema validation.
- No schema tests or automated Supabase migration validation commands are configured.

## 11. Recommended Next 5 Tasks

Note: runtime `chart_data` validation, the initial Jest setup, auto-save warning visibility, AuthCallback hardening, journal create-mode payload coverage, `useChartData` async cancellation guard, `useChartData` branch coverage, chart helper tests, and auth/profile navigation tests are complete. The next priority is coverage for Dashboard profile repair/chart summary and `CompleteProfileScreen` save/geocode behavior before those screens are decomposed.

1. Add Dashboard profile repair and chart summary tests.
   - Cover complete-profile load, incomplete-profile redirect, auth metadata repair for older accounts, saved chart summary hydration, invalid saved `chart_data` fallback, and self chart auto-save behavior.

2. Add CompleteProfile save/geocode lifecycle tests.
   - Cover loading existing user fields, missing required field validation, selected-coordinate save, manual typed location geocode fallback, timezone update from geocode, and `public.users` update payload.

3. Add InterpretationModal pager tests.
   - Cover first/last circular paging, single-page behavior, close/reopen reset, and previous/next controls without snapshot testing.

4. Wire chart preferences to chart math.
   - Highest user trust impact. Read `house_system`, `zodiac_type`, and `orb_mode` from `public.chart_preferences` in `buildChartData` and `findAspects`.

5. Generate Supabase DB types and plan migration/schema validation.
   - Maintains the schema/frontend contract. Replace hand-written shared row types with generated types so future table/column drift is caught at compile time.

## 12. Best Next Vertical Slice

Recommended slice: Dashboard profile repair and chart summary tests.

This is the immediate next implementation slice because auth/profile navigation and chart helper coverage are complete, while `DashboardScreen` still mixes profile repair, profile completion redirects, saved chart lookup, chart summary derivation, and self chart auto-save. Add coverage before extracting Dashboard logic.

Goal:

- Cover complete profile load without redirect.
- Cover incomplete profile redirect to `CompleteProfile`.
- Cover auth metadata repair for older/incomplete accounts without changing the source-of-truth contract.
- Cover saved chart summary hydration from valid `chart_data`.
- Cover invalid saved `chart_data` fallback/rebuild behavior.
- Cover self chart auto-save behavior and missing-coordinate no-save behavior.

Files likely involved:

- `client/screens/DashboardScreen.tsx`.
- New or existing screen tests under `client/screens/__tests__/`.
- Test mocks for Supabase auth/user/chart queries, `buildChartData`, `saveChart`, navigation, and alerts.

Expected behavior:

- No production behavior change.
- `public.users` remains the durable profile source of truth.
- Auth metadata remains only a signup/bootstrap and older-account repair source.
- Dashboard continues to pass `chartMode: 'self'`.
- Tests make later Dashboard decomposition safer.

Verification steps:

- Run `cd client && npm run typecheck`.
- Run `cd client && npm test`.
- Run `git diff --check`.

## 13. Agent Instructions Going Forward

How Codex should work in this repo:

- Treat `client/` as the active app.
- Treat `supabase/migrations/` as the source-controlled database change history.
- Read relevant files before editing; prefer `rg` for search.
- Keep changes narrowly scoped to the requested vertical slice.
- Use `apply_patch` for manual file edits.
- Run `cd client && npm run typecheck` before handing back code changes.
- For schema changes, create a new incremental migration; do not edit `20260508015720_remote_schema.sql`.
- Do not edit generated Android files unless the task is explicitly native-build related.
- Do not read or print `.env` values; only reference required variable names.
- Do not casually rewrite lexicon prose. It is product content, not just code.
- Do not change chart math, canonical chart identity, or auth flow behavior without naming the user-facing effect and verification plan.
- Treat `auth.user_metadata` as signup/bootstrap handoff only for profile/birth data.
- Treat `public.users` as the durable profile/birth source of truth.
- Treat `public.chart_preferences` as the durable chart preference source of truth; do not write `pref_*` values back to auth metadata.
- Treat `ChartRouteParams.chartMode` as the current chart save mode contract: missing means `'self'`, Dashboard passes `'self'`, and future other-person flows should pass `'guest'`.
- Preserve the current save rule: self/generated charts with coordinates may auto-save; guest/generated charts must not auto-save; guest charts can be manually saved when coordinates exist.
- Preserve saved-chart navigation through `fromSaved` and `saved`; do not require `chartMode` for that flow.
- Preserve the current canonical chart identity unless the user explicitly changes the product rule: `user_id`, `birth_date`, `birth_time`, `time_zone`, `birth_lat`, `birth_lon`, with `NULLS NOT DISTINCT` in the database.
- Preserve the current view-only behavior for charts missing coordinates unless the user explicitly changes persistence semantics.
- Do not claim guest chart creation UI, synastry, compatibility, or guest-specific schema support exists yet.
- Do not claim Placidus, Sidereal, Vedic, or custom orb modes are implemented; current `chart_preferences` checks allow only supported defaults.

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
- `supabase db diff`
- `supabase db reset`
- `cd client && npm run start`
- `cd client && npm run android`
- `cd client && npm run ios`
- `cd client && npm run web`

Current command gaps:

- No `npm run lint` script.
- Supabase migration validation is manual; run `supabase db reset` locally before pushing schema changes, and use `supabase db push` only when intentionally applying migrations to the remote project.
