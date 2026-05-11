# Naksha Codebase Handoff

Generated: 2026-05-07  
Last updated: 2026-05-11 — after ProfileScreen card extraction, shared profileCompletion helpers, and ChartScreen shell/content split.
Scope: source-of-truth repository handoff. This update is documentation-only.
Last recorded code verification: `cd client && npm run typecheck` passes. Working tree clean.

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

What is incomplete or unstable:

- `server/` is empty, and several service files are placeholders: `conversations.ts`, `notifications.ts`, `reports.ts`, `subscriptions.ts`, `usage.ts`.
- `ChatScreen.tsx` and `SubscriptionScreen.tsx` are empty stub files and are not registered in `App.tsx` navigation or linking config.
- Unsupported chart preferences remain disabled/coming soon and are not applied to chart math.
- Guest/other-person chart creation UI is not implemented yet; `chartMode: 'guest'` is groundwork only.
- Charts without birth coordinates are intentionally view-only: they can render planet data, but are not persisted because canonical saved-chart identity requires coordinates.
- `auth.user_metadata` still carries signup/bootstrap profile data for `handle_new_user` and older-account repair, but profile edits no longer mirror back to auth metadata.
- There are no tests and no `test` or `lint` npm scripts.
- Persisted `chart_data` JSON is cast to `ChartData` without runtime validation; malformed rows in `charts` or `MyCharts` could crash.
- Self chart auto-save failure is caught and logged but not surfaced to the user.

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
- `client/lib/geocode.ts`: `geocodePlace` — OpenCage geocoding helper used by `CompleteProfileScreen`.
- `client/screens/DashboardScreen.tsx`: profile load/repair, profile completion redirect, sun/moon summary, and self chart entry with `chartMode: 'self'`.
- `client/screens/CompleteProfileScreen.tsx`: profile edit form, geocoding fallback, and durable `users` table update.
- `client/screens/ProfileScreen.tsx`: account/profile display plus chart preferences backed by `public.chart_preferences`; presentational cards are in `components/profile/`.
- `client/screens/ChartScreen.tsx`: route-validation shell — guards missing birth fields and invalid time zone, then delegates to `ChartScreenContent`.
- `client/components/charts/ChartScreenContent.tsx`: valid-chart compositor — owns `useChartData`, `useChartInterpretation`, `useSpace`, page building, and all chart UI rendering.
- `client/hooks/useChartData.ts`: load saved chart or compute chart, find existing chart, self auto-save, guest manual save.
- `client/lib/charts.ts`: `ChartData` shape, `buildChartData`, `saveChart`, list/get/delete chart helpers.
- `client/lib/astro.ts`: planet longitude calculation, aspects, approximate whole-sign house calculation, planet-house assignment.
- `client/lib/chartPageBuilders.ts`: builds modal pages from chart data and lexicon lookups.
- `client/lib/chartInterpretation.ts`: shared planet/house key guards and planet summary construction.
- `client/lib/lexicon/index.ts`: barrel export for all interpretation lookups.
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
- `handledOnce` guards against re-entry, but a delayed second URL arriving after an initial failure would be silently ignored; this path should be reviewed before shipping.

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
- Auth callback and auth helper files contain verbose debug logging.
- Navigation route types are mostly `any`, so auth flow route params are not compile-time enforced.
- Deep-link verification through `AuthCallbackScreen` remains a separate flow from OTP verification; both should stay aligned when profile requirements change.
- `AuthCallbackScreen` `handledOnce` guard marks the flow complete before async work finishes; a delayed second deep-link URL arriving after a partial failure would be silently ignored.
- `useChartData` has no mounted/cancelled guard around async state updates; rapid navigation could produce state updates on an unmounted component.

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
- `saveChart` requires `birth_lat` and `birth_lon`, then upserts a row with top-level birth fields plus the full JSON payload.
- The upsert conflict target is `user_id,birth_date,birth_time,time_zone,birth_lat,birth_lon`, matching the canonical database identity.
- `useChartData` and `DashboardScreen` look up saved charts by the same coordinate-inclusive identity when coordinates are available.
- `DashboardScreen` may auto-save the user's own chart while building the dashboard summary.
- `useChartData` auto-saves generated chart data only in self mode; guest mode waits for the user to tap save.
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

- `CompleteProfileScreen.tsx`: location/coordinate/timezone lifecycle is improved, but still mixes load/save/geocode and profile form responsibilities.
- `ProfileScreen.tsx`: preferences now have durable table storage, but the chart engine still only supports the current defaults.
- Guest/other-person chart creation: route and hook mode support exists, but no user-facing entry form exists yet.
- `AuthCallbackScreen.tsx`: debug logging should be cleaned up before shipping.
- `ChatScreen.tsx` and `SubscriptionScreen.tsx`: empty.

Component size/coupling concerns:

- `ProfileScreen.tsx`: 312 lines. Presentational card extraction is done; all Supabase calls and preference save handlers remain in the screen. The screen now mixes data loading with glue for chart preferences and account action callbacks.
- `DashboardScreen.tsx`: 351 lines, mixes profile repair, chart lookup/generation, summary derivation, and dashboard UI.
- `CompleteProfileScreen.tsx`: 325 lines, mixes data load/save, geocoding fallback, and UI.
- `CheckEmailScreen.tsx`: 350 lines, mixes OTP flow and custom UI.
- `useChartData.ts`: 325 lines, owns loading, lookup, hydration, computation, auto-save, and manual save.
- `InterpretationModal.tsx`: 292 lines, owns pager loop behavior plus modal shell.

## 9. Known Bugs / Inconsistencies

| Issue | Files involved | Symptom | Likely cause |
| --- | --- | --- | --- |
| Additional chart modes are not implemented | `ProfileScreen.tsx`, `lib/astro.ts`, `lib/charts.ts`, `chart_preferences` migration | Users can see unsupported modes as coming soon, but charts remain whole-sign/tropical with fixed aspect orbs. | `chart_preferences` currently constrains values to supported defaults; chart math has not implemented additional systems. |
| Empty screens and service modules exist | `ChatScreen.tsx`, `SubscriptionScreen.tsx`, `lib/conversations.ts`, `lib/subscriptions.ts`, `lib/reports.ts`, `lib/notifications.ts`, `lib/usage.ts` | Future features appear present in files but contain no implementation. | Scaffolding exists ahead of feature work. |
| Signup metadata can become stale after bootstrap | `SignupScreen.tsx`, `lib/auth.ts`, `DashboardScreen.tsx`, `handle_new_user` migration | Auth metadata may not match later edits in `public.users`. | Auth metadata is intentionally retained as signup/bootstrap handoff and Dashboard repair input, not as durable profile storage. |
| Guest chart creation is only groundwork | `domainTypes.ts`, `ChartScreen.tsx`, `useChartData.ts` | `chartMode: 'guest'` can prevent auto-save, but there is no screen for entering another person's birth data yet. | Route/hook behavior landed before the user-facing guest chart workflow. |
| Supabase row types are still hand-maintained | `domainTypes.ts`, `ProfileScreen.tsx`, `lib/charts.ts` | Shared types reduce drift, but they are not generated from the live schema. | No generated Supabase type pipeline exists yet. |
| Auth callback logging is noisy | `AuthCallbackScreen.tsx`, `lib/auth.ts` | Auth/debug information may clutter logs during normal flows. | Temporary troubleshooting logs remain in the auth surface. |
| Migration history starts from a remote schema dump | `supabase/migrations/20260508015720_remote_schema.sql`, later migrations | The schema is now reproducible, but history before the dump is not incremental. | The remote project schema was pulled into the repo after initial development. |
| No automated regression coverage | `client/package.json` | A `typecheck` script exists, but there are no unit/integration/e2e tests. | No test framework or test scripts are configured. |
| Persisted `chart_data` cast without runtime validation | `client/hooks/useChartData.ts`, `client/screens/MyCharts.tsx` | Malformed or schema-drifted rows in `public.charts` could crash when their `chart_data` JSON is accessed after the bare `as ChartData` cast. | No runtime schema validator exists for the persisted blob. |
| Self chart auto-save failure is not visible to users | `client/hooks/useChartData.ts` | Chart appears to have loaded but was not persisted; user has no feedback. | Auto-save error is caught, logged as a warning, and rendering continues without surfacing an alert or status indicator. |

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

Missing tests:

- No test scripts exist in `package.json`.
- No tests cover auth/profile save, chart generation, chart persistence, or interpretation page building.
- No schema tests or automated Supabase migration validation commands are configured.

## 11. Recommended Next 5 Tasks

1. Add a test runner and first test suite.
   - Highest risk reduction. Add `jest` + `@testing-library/react-native`. Cover `profileCompletion` boundary cases, `buildChartData` round-trip, `useChartData` self/guest/view-only branches, OTP navigation reset, and `upsertJournal` create-mode with `undefined id`.

2. Add runtime validation for persisted `chart_data`.
   - Replace bare `as ChartData` casts in `useChartData` and `MyCharts` with a validator that returns null on shape mismatch, preventing crashes from schema-drifted rows.

3. Surface auto-save failure to the user.
   - Show an alert or status indicator when self chart auto-save fails. Currently caught and logged silently; user has no way to know the chart was not persisted.

4. Review and harden `AuthCallbackScreen`.
   - Clean up verbose logging; review `handledOnce` guard behaviour for delayed or retried deep-link URLs; add a test for token/code/fragment paths.

5. Design the guest chart creation workflow.
   - Build on `chartMode: 'guest'` without adding synastry or schema changes prematurely; define how users enter another person's birth data and when they save it.

## 12. Best Next Vertical Slice

Recommended slice: runtime `chart_data` validation.

Goal:

- Prevent malformed or schema-drifted persisted `chart_data` from crashing or hydrating incorrectly in `useChartData`, `MyCharts`, and `DashboardScreen`.
- Valid saved chart data loads normally with no behavior change.
- Invalid or malformed `chart_data` is rejected at the parse boundary and falls back to recompute (when a profile is available) or shows a safe error state (when only the saved blob is available).

Files likely involved:

- New `client/lib/chartDataValidation.ts` (or within `client/lib/charts.ts`): a `parseChartData(json): ChartData | null` function that validates the required shape before use.
- `client/hooks/useChartData.ts`: replace bare `existing.chart_data as ChartData` cast with the validated parse; handle null result as a cache miss and fall through to recompute.
- `client/screens/MyCharts.tsx`: replace bare `row.chart_data as ChartData` cast with the validated parse; show a safe error row if null.
- `client/screens/DashboardScreen.tsx`: replace bare `existing.chart_data.planets as ...` cast with the validated parse.
- No Supabase migration needed.

Expected behavior:

- Opening a saved chart with valid `chart_data` is unchanged.
- Opening a saved chart with malformed `chart_data` falls back to recompute (if profile fields are available) or shows a recoverable error card instead of crashing.
- Dashboard sun/moon summary degrades gracefully if its saved `chart_data` is malformed.
- No change to canonical chart identity, save behavior, or chart math.

Verification steps:

- Run `cd client && npm run typecheck`.
- Open a valid saved chart from My Charts; confirm it loads normally.
- Confirm Dashboard sun/moon summary still appears for a complete profile.
- Test a guest chart with no coordinates: confirm planets render, save is disabled as `View Only`, and no chart row is created.

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
- `supabase db diff`
- `supabase db reset`
- `cd client && npm run start`
- `cd client && npm run android`
- `cd client && npm run ios`
- `cd client && npm run web`

Current command gaps:

- No `npm test` script.
- No `npm run lint` script.
- Supabase migration validation is manual; run `supabase db reset` locally before pushing schema changes, and use `supabase db push` only when intentionally applying migrations to the remote project.
