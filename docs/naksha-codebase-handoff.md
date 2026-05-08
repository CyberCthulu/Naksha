# Naksha Codebase Handoff

Generated: 2026-05-07  
Scope: repository inspection only, plus this document. No source code was refactored or feature code changed.  
Verification run: `cd client && npx tsc --noEmit` passes.

## 1. Executive Summary

Naksha is a mobile-first astrology app built with Expo, React Native, TypeScript, and Supabase. The current product centers on authenticated users entering birth details, generating a natal chart, viewing planetary positions/houses/aspects, reading local lexicon-based interpretations, saving charts, and writing journal entries.

What already works:

- Email/password auth with Supabase, persisted through AsyncStorage.
- Signup flow that collects birth details and stores profile data in auth metadata, then later in the `users` table.
- Login, check-email OTP verification, deep-link callback handling, profile completion, dashboard, chart view, saved chart list, profile screen, and journal list/editor.
- Natal chart computation from birth date/time/time zone using `luxon` and `astronomy-engine`.
- Whole-sign house calculation when latitude/longitude are available.
- Local chart interpretation from lexicon files for planet/sign, planet/house, house/sign, generic house, and aspect meanings.
- Supabase chart persistence through a `charts` table and journal persistence through a `journals` table.

What is incomplete or unstable:

- No Supabase migrations, schema definitions, seed data, or RLS policy files are checked into the repo.
- `server/` is empty, and several service files are placeholders: `conversations.ts`, `notifications.ts`, `reports.ts`, `subscriptions.ts`, `usage.ts`.
- `ChatScreen.tsx` and `SubscriptionScreen.tsx` are empty and not wired into navigation.
- Profile chart preferences are stored but not used by chart generation.
- Chart persistence has inconsistent uniqueness and lookup rules around latitude/longitude.
- Profile location editing can preserve stale coordinates.
- Signup verification navigation is partly implicit.
- There are no tests and no `test` or `lint` npm scripts.

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
- `client/components/ui/`: shared theme, text, card, button, field styles.
- `client/components/space/`: focused planet context and disabled Three.js background.
- `client/hooks/`: chart data loading/persistence and interpretation modal state.
- `client/lib/`: Supabase client, auth helpers, chart computation, interpretation helpers, geocoding, time helpers, journals, and lexicon.
- `client/lib/lexicon/`: local interpretation content and lookup functions.
- `client/android/`: generated native Android project.
- `server/`: currently empty.

Important files:

- `client/App.tsx`: root auth session bootstrap, linking config, stack navigation split, `AuthContext`, `SpaceProvider`.
- `client/lib/supabase.ts`: Supabase client, AsyncStorage persistence, Expo public env vars.
- `client/lib/auth.ts`: sign up, resend, OTP verify, login, logout, get user.
- `client/screens/DashboardScreen.tsx`: profile load/repair, profile completion redirect, sun/moon summary, chart auto-save.
- `client/screens/CompleteProfileScreen.tsx`: profile edit form, geocoding fallback, `users` table update, auth metadata update.
- `client/screens/ChartScreen.tsx`: chart route validation, chart hook, chart UI composition, interpretation page construction.
- `client/hooks/useChartData.ts`: load saved chart or compute chart, find existing chart, auto-save, manual save.
- `client/lib/charts.ts`: `ChartData` shape, `buildChartData`, `saveChart`, list/get/delete chart helpers.
- `client/lib/astro.ts`: planet longitude calculation, aspects, approximate whole-sign house calculation, planet-house assignment.
- `client/lib/chartPageBuilders.ts`: builds modal pages from chart data and lexicon lookups.
- `client/lib/chartInterpretation.ts`: shared planet/house key guards and planet summary construction.
- `client/lib/lexicon/index.ts`: barrel export for all interpretation lookups.

## 4. Auth Flow

Signup:

- `SignupScreen.tsx` collects email, password, first/last name, birth date/time, location, time zone, and optional lat/lon.
- It defaults time zone from the device via `getDeviceTimeZoneNormalized`.
- It calls `signUpWithEmail` in `lib/auth.ts`.
- `signUpWithEmail` passes profile fields into Supabase auth `options.data` and sets `emailRedirectTo` to `naksha://auth/callback`.
- After signup succeeds, the app navigates to `CheckEmail` with `email` and a `profile` object in route params.

Email verification:

- `CheckEmailScreen.tsx` supports OTP code entry and resend.
- `verifySignupOtp(email, token)` calls `supabase.auth.verifyOtp({ email, token, type: 'email' })`.
- After verification, it calls `supabase.auth.getUser()` and upserts the route-param profile into `users`.
- It currently sets message to `Email Verified.` and returns. The explicit `navigation.reset(...Dashboard...)` block is commented out, so successful navigation relies on Supabase auth state changing and `App.tsx` switching stacks.

Login:

- `LoginScreen.tsx` calls `signInWithEmail`, which uses `supabase.auth.signInWithPassword`.
- `App.tsx` listens to `supabase.auth.onAuthStateChange` and switches from the unauthenticated stack to the authenticated stack when a session exists.

Session persistence:

- `lib/supabase.ts` configures Supabase auth with `AsyncStorage`, `autoRefreshToken: true`, `persistSession: true`, and `detectSessionInUrl: false`.
- `App.tsx` calls `supabase.auth.getSession()` on boot, renders a loading spinner until ready, and stores only `user` in local state.

Deep-link callback:

- `AuthCallbackScreen.tsx` handles incoming URLs from `expo-linking`.
- It supports `token_hash` plus `type`, auth `code`, and URL fragment `access_token`/`refresh_token`.
- After handling, it resets navigation to `Dashboard` if a session user exists, otherwise to `Login`.

Profile completion:

- `DashboardScreen.tsx` ensures a minimal `users` row exists after login.
- It fetches `users` by `id`; if fields are missing, it attempts to merge from `auth.user_metadata`.
- If the profile still needs required fields, it navigates to `CompleteProfile`.
- `CompleteProfileScreen.tsx` updates the `users` table and mirrors birth/profile fields back into auth metadata.
- `ProfileScreen.tsx` reads `users`, reads chart preferences from auth metadata, and stores preference edits back to auth metadata.

Known auth/profile issues:

- `CheckEmailScreen.tsx` uses implicit post-verification navigation instead of a deterministic reset.
- Profile data is duplicated between `users` and auth metadata.
- `AuthContext` exposes only `{ user }`, not auth actions or loading state.
- Auth callback and auth helper files contain verbose debug logging.
- Navigation route types are mostly `any`, so auth flow route params are not compile-time enforced.

## 5. Data Model / Supabase

Tables used by the frontend:

- `users`
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

Expected `charts` fields:

- `id`, `user_id`, `name`.
- `birth_date`, `birth_time`, `time_zone`, `birth_lat`, `birth_lon`.
- `chart_data`: JSON object matching `ChartData`.
- `created_at`, `updated_at`.

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
- Users can select/insert/update/delete only their own `charts` where `user_id = auth.uid()`.
- Users can select/insert/update/delete only their own `journals` where `user_id = auth.uid()`.
- Users can read only their own `subscriptions` and `purchases`.
- Signup/profile flows require `users.upsert` to be permitted for the authenticated user id.

Schema/frontend mismatch risks:

- No migration files or RLS policy files exist in the repo, so the database contract is implicit.
- `saveChart` upserts on `user_id,birth_date,birth_time,time_zone`, but `useChartData` looks up existing charts with `birth_lat` and `birth_lon` too.
- `DashboardScreen` looks up charts without latitude/longitude, so it can reuse stale chart data after a location-only change.
- `ProfileScreen` stores chart preferences in auth metadata, not a table.
- `ProfileScreen` orders subscriptions by `created_at`, but its local `SubscriptionRow` type does not include `created_at`.

## 6. Chart Flow

Birth data sources:

- Dashboard-to-chart path: `DashboardScreen` passes a `profile` route param to `ChartScreen`.
- Saved chart path: `MyCharts.tsx` passes `fromSaved: true`, `saved: chart_data`, and a reconstructed profile from chart metadata.
- Signup/profile path: birth details originate in `SignupScreen` or `CompleteProfileScreen` and are stored in `users` plus auth metadata.

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
- `saveChart` upserts a row with top-level birth fields plus the full JSON payload.
- `listCharts`, `getChart`, and `deleteChart` read/delete chart rows by `user_id`.

What UI renders it:

- `ChartScreen.tsx` composes the full chart view.
- `ChartHeader.tsx` renders title, location/zone/coords, and Sun summary.
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

How `ChartScreen` builds interpretation pages:

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
- `ChartScreen.tsx` is responsible for both chart layout and interpretation page assembly.

## 8. Current UI/UX State

Screens that feel usable:

- `LoginScreen.tsx`: simple login form with loading and error state.
- `SignupScreen.tsx`: complete signup/profile form, including date/time/location/time zone.
- `DashboardScreen.tsx`: shows greeting, signs, birth details, and main navigation actions.
- `ChartScreen.tsx`: usable chart view with SVG wheel, lists, legend, and interpretation modal.
- `MyCharts.tsx`: saved chart list with open/delete.
- `JournalListScreen.tsx` and `JournalEditorScreen.tsx`: basic journal create/edit/delete flow.
- `ProfileScreen.tsx`: readable account/profile/preferences/subscription/purchases/privacy surface.

Screens that need polish:

- `CheckEmailScreen.tsx`: verification success should navigate deterministically.
- `CompleteProfileScreen.tsx`: location/coordinate editing needs correction.
- `ProfileScreen.tsx`: preference choices marked "coming soon" are still selectable and saved.
- `AuthCallbackScreen.tsx`: debug logging should be cleaned up before shipping.
- `ChatScreen.tsx` and `SubscriptionScreen.tsx`: empty.

Component size/coupling concerns:

- `ProfileScreen.tsx`: 524 lines, mixes profile, preferences, subscription, purchases, privacy, and account actions.
- `DashboardScreen.tsx`: 376 lines, mixes profile repair, chart lookup/generation, summary derivation, and dashboard UI.
- `CompleteProfileScreen.tsx`: 341 lines, mixes data load/save, geocoding fallback, auth metadata update, and UI.
- `CheckEmailScreen.tsx`: 312 lines, mixes OTP flow and custom UI.
- `useChartData.ts`: 305 lines, owns loading, lookup, hydration, computation, auto-save, and manual save.
- `InterpretationModal.tsx`: 292 lines, owns pager loop behavior plus modal shell.

## 9. Known Bugs / Inconsistencies

| Issue | Files involved | Symptom | Likely cause |
| --- | --- | --- | --- |
| Stale coordinates when editing profile location | `CompleteProfileScreen.tsx`, `ProfileFields.tsx` | If an existing profile has lat/lon and the user edits the location text, old coordinates can be saved with the new location. | `CompleteProfileScreen` passes `birthLat`/`birthLon` but not `setBirthLat`/`setBirthLon`; `ProfileFields` cannot clear or update coordinates. `onSave` geocodes only when coordinates are missing. |
| Chart uniqueness does not match chart lookup | `lib/charts.ts`, `hooks/useChartData.ts`, `DashboardScreen.tsx` | Different locations with the same date/time/time zone can be queried as separate charts but upserted into the same row. Dashboard can reuse stale chart data after a location-only change. | `saveChart` conflict target excludes lat/lon; `useChartData` includes lat/lon in lookup; dashboard lookup excludes lat/lon. |
| Save chart button is mostly misleading | `DashboardScreen.tsx`, `useChartData.ts`, `ChartScreen.tsx` | The chart is usually saved before the user taps "Save Chart Data", so the button quickly becomes "Already Saved". | Dashboard and chart hook both auto-save charts. Manual save is not the primary persistence behavior. |
| Check-email success navigation is implicit | `CheckEmailScreen.tsx` | After OTP verification, the screen sets "Email Verified." but does not explicitly reset to dashboard. | The reset block is commented out; the flow relies on Supabase auth state listener and stack switching. |
| Preferences are saved but ignored | `ProfileScreen.tsx`, `lib/astro.ts`, `lib/charts.ts` | Users can choose Placidus, Equal House, Sidereal, and orb modes, but charts remain whole-sign/tropical with fixed aspect orbs. | Preferences are stored in auth metadata but not consumed by chart generation. |
| Deep link to chart can crash without params | `App.tsx`, `ChartScreen.tsx` | `naksha://chart` can route to `ChartScreen` without required route params. | Linking config exposes `Chart: 'chart'`, but `ChartScreen` destructures `route.params` as required. |
| Empty screens and service modules exist | `ChatScreen.tsx`, `SubscriptionScreen.tsx`, `lib/conversations.ts`, `lib/subscriptions.ts`, `lib/reports.ts`, `lib/notifications.ts`, `lib/usage.ts` | Future features appear present in files but contain no implementation. | Scaffolding exists ahead of feature work. |
| Supabase schema is not reproducible from repo | repo root | Agents cannot verify table definitions, indexes, unique constraints, or RLS from source control. | No `supabase/` migrations or policy files are checked in. |
| Duplicate profile storage can diverge | `SignupScreen.tsx`, `DashboardScreen.tsx`, `CompleteProfileScreen.tsx`, `ProfileScreen.tsx` | `users` row and auth metadata can disagree, especially after partial saves or older accounts. | Profile data is mirrored in two places, and merge rules are spread across screens. |
| No automated regression coverage | `client/package.json` | Only TypeScript compile was available; there are no unit/integration/e2e tests. | No test framework or scripts are configured. |

## 10. Technical Debt

State duplication:

- Profile fields live in both `users` and `auth.user_metadata`.
- Chart computation happens in both `DashboardScreen` and `useChartData`.
- Planet summary logic is duplicated in `PlanetPositionsList.tsx` and `chartInterpretation.ts`.
- `User`, `DBUser`, and `ProfileForChart` types are repeated across screens/hooks.

Unclear ownership:

- It is unclear whether chart saving should be automatic, manual, or both.
- Profile preferences are owned by `ProfileScreen`, but the chart engine does not consume them.
- The chart storage uniqueness contract is split between frontend queries and unknown database indexes.
- Auth verification is split between manual OTP entry and deep-link callback handling.

Fragile flows:

- Route params are required at runtime but not enforced with a typed navigator.
- Chart screen is deep-linkable without guaranteed params.
- Dashboard throttles/reentrancy with refs, which works but is hard to reason about.
- Location coordinates depend on optional setter props in a shared form component.

Large components:

- Break up `ProfileScreen`, `DashboardScreen`, `CompleteProfileScreen`, `CheckEmailScreen`, `useChartData`, and `InterpretationModal` when touching their areas.

Naming and consistency issues:

- File name `MyCharts.tsx` exports `MyChartsScreen`; most other screen files include `Screen`.
- Aspect types use short internal names (`conj`, `opp`) while UI displays those raw strings.
- UI uses a mix of shared `Button`/`Card` and inline `TouchableOpacity` styles.
- Some source comments include temporary notes such as "NEW", "coming soon", or disabled lint comments.

Missing tests:

- No test scripts exist in `package.json`.
- No tests cover auth/profile save, chart generation, chart persistence, or interpretation page building.
- No schema tests or migration checks exist because schema files are absent.

## 11. Recommended Next 5 Tasks

1. Fix profile location coordinate lifecycle.
   - Highest user impact and risk reduction. Editing birth location must reliably clear/select/geocode coordinates and regenerate accurate houses.

2. Align chart persistence contract.
   - Decide whether `birth_lat`/`birth_lon` belong in the unique key. Update frontend lookup, `saveChart`, and Supabase unique constraints/RLS docs together.

3. Make signup verification deterministic.
   - After OTP success, explicitly save profile, refresh session/user state as needed, and reset to `Dashboard` or `CompleteProfile` with clear error handling.

4. Decide and simplify chart save semantics.
   - Choose auto-save or manual save. Then adjust dashboard, `useChartData`, and the chart screen button so the UI matches reality.

5. Wire or disable chart preferences.
   - Either implement house system, zodiac type, and orb mode in chart generation, or make coming-soon preferences visibly disabled and not persisted.

## 12. Best Next Vertical Slice

Recommended slice: profile edit to chart refresh reliability.

Goal:

- A user can edit birth date, time, location, or time zone, save successfully, and then see a regenerated chart whose metadata, coordinates, houses, dashboard summary, and saved-chart row all correspond to the new birth details.

Files likely involved:

- `client/screens/CompleteProfileScreen.tsx`
- `client/components/auth/ProfileFields.tsx`
- `client/hooks/useChartData.ts`
- `client/lib/charts.ts`
- `client/screens/DashboardScreen.tsx`
- Potentially new Supabase migration/docs if schema can be added to the repo.

Expected behavior:

- Changing location text clears previous coordinates.
- Selecting an autocomplete result stores that result's lat/lon.
- Saving with no selected coordinates geocodes the entered location.
- `users.birth_location`, `birth_lat`, and `birth_lon` stay consistent.
- Chart lookup and chart upsert use the same identity rules.
- Dashboard and chart screen no longer show stale data after a profile edit.
- Saved chart list either updates the existing chart or creates a new one according to the chosen product rule.

Verification steps:

- Run `cd client && npx tsc --noEmit`.
- Start the app with `cd client && npm run start`.
- Sign in with a test account.
- Edit birth location from one city to another and save.
- Confirm the profile screen shows the new location and matching coordinates.
- Open chart and confirm header metadata and house list reflect the new coordinates.
- Open My Charts and confirm saved-chart behavior matches the chosen rule.
- If schema files are added, verify the unique constraint matches `saveChart` and `useChartData`.

## 13. Agent Instructions Going Forward

How Codex should work in this repo:

- Treat `client/` as the active app.
- Read relevant files before editing; prefer `rg` for search.
- Keep changes narrowly scoped to the requested vertical slice.
- Use `apply_patch` for manual file edits.
- Run `cd client && npx tsc --noEmit` before handing back code changes.
- Do not edit generated Android files unless the task is explicitly native-build related.
- Do not read or print `.env` values; only reference required variable names.
- Do not casually rewrite lexicon prose. It is product content, not just code.
- Do not change chart math, persistence identity, or auth flow behavior without naming the user-facing effect and verification plan.
- If Supabase schema/RLS is relevant, ask for or create source-controlled migrations/policy docs rather than assuming the remote database shape.

Prompt style that works well:

- Name one vertical slice.
- Include target behavior, files or surfaces, and what should remain untouched.
- Say whether schema changes are allowed.
- Say whether UX copy/content changes are allowed.
- Ask for verification commands and a short final summary.

What not to touch casually:

- `client/.env`
- `client/android/`
- Large lexicon files under `client/lib/lexicon/`
- Auth callback/session behavior
- Chart uniqueness and stored `chart_data` shape
- Generated assets under `client/assets/`

Useful verification commands:

- `cd client && npx tsc --noEmit`
- `cd client && npm run start`
- `cd client && npm run android`
- `cd client && npm run ios`
- `cd client && npm run web`

Current command gaps:

- No `npm test` script.
- No `npm run lint` script.
- No Supabase migration validation command.
