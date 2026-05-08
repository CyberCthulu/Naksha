# Claude's Architectural Review — Naksha Codebase

Generated: 2026-05-07
Reviewer: Claude (Sonnet 4.6) — senior staff engineer architectural review
Scope: read-only inspection. No code was modified.
Verification: `cd client && npx tsc --noEmit` passes.

---

## 1. Executive Summary

Naksha is a mobile-first astrology app built with Expo / React Native / TypeScript / Supabase. The product centers on authenticated users entering birth details, generating a natal chart, viewing planetary positions / houses / aspects, reading local lexicon-based interpretations, saving charts, and writing journal entries.

**What already works**

- Email/password auth with Supabase, persisted through AsyncStorage.
- Signup flow that collects birth details and stores profile data in auth metadata, then later in the `users` table.
- Login, check-email OTP verification, deep-link callback handling, profile completion, dashboard, chart view, saved chart list, profile screen, and journal list/editor.
- Natal chart computation from birth date/time/time zone using `luxon` and `astronomy-engine`.
- Whole-sign house calculation when latitude/longitude are available.
- Local chart interpretation from lexicon files for planet/sign, planet/house, house/sign, generic house, and aspect meanings.
- Supabase chart persistence through a `charts` table and journal persistence through a `journals` table.

**What is incomplete or unstable**

- No Supabase migrations, schema definitions, seed data, or RLS policy files are checked into the repo. The schema contract is entirely implicit.
- `server/` is an empty directory. Several service files are stubs with no implementation: `conversations.ts`, `notifications.ts`, `reports.ts`, `subscriptions.ts`, `usage.ts`.
- `ChatScreen.tsx` and `SubscriptionScreen.tsx` are empty and not wired into navigation.
- Profile chart preferences (house system, zodiac type, orb mode) are stored in auth metadata but are never consumed by chart generation. Charts are always whole-sign / tropical / fixed orbs.
- Chart persistence has inconsistent uniqueness and lookup rules around latitude/longitude.
- `CompleteProfileScreen` does not pass coordinate setters to `ProfileFields`, causing stale coordinates when a user edits their birth location.
- Signup verification navigation is implicit (relies on auth state change) rather than deterministic.
- `zustand` and `axios` are listed as dependencies in `package.json` but are not imported anywhere in the codebase.
- There are no tests and no `test` or `lint` npm scripts.

---

## 2. Tech Stack

| Layer | Library / Version |
|---|---|
| App runtime | Expo `~54.0.32`, React Native `0.81.5`, React `19.1.0` |
| Language | TypeScript `~5.9.2` |
| Navigation | `@react-navigation/native` + `@react-navigation/native-stack` |
| Backend | Supabase Auth + Supabase Postgres via `@supabase/supabase-js ^2.49.8` |
| Session storage | `@react-native-async-storage/async-storage 2.2.0` |
| Deep links | `expo-linking ~8.0.10`, app scheme `naksha://` |
| Astro calculation | `astronomy-engine ^2.1.19`, `luxon ^3.7.2`, local math helpers |
| Time zones | `timezone-support ^3.1.0` + local abbreviation normalization |
| Geocoding | OpenCage API via `fetch`, env var `EXPO_PUBLIC_OPENCAGE_KEY` |
| Chart SVG rendering | `react-native-svg 15.12.1` |
| Interpretation pager | `react-native-pager-view 6.9.1` |
| 3D background (disabled) | `three 0.182.0`, `@react-three/fiber 9.5.0`, `expo-gl ~16.0.9` |
| **Unused but installed** | `zustand ^5.0.5`, `axios ^1.9.0` — in package.json, zero imports anywhere |

---

## 3. App Architecture

**Main folders**

```
client/
  App.tsx                       root: auth bootstrap, linking config, stack split, AuthContext, SpaceProvider
  screens/                      one file per route-level screen
  components/
    auth/                       form components shared by signup / profile edit flows
    charts/                     chart wheel, lists, modal, interpretation card
    ui/                         shared theme, AppText, Card, Button, form styles
    space/                      SpaceProvider (focused planet context), disabled Three.js background
  hooks/
    useChartData.ts             load / compute / auto-save / manual-save chart
    useChartInterpretation.ts   modal open/close, active pages, focused house state
  lib/
    supabase.ts                 Supabase client (AsyncStorage persistence)
    auth.ts                     signUp, resend, verifyOtp, signIn, signOut, getUser
    charts.ts                   ChartData type, buildChartData, saveChart, list/get/delete
    astro.ts                    planet longitude, aspects, whole-sign house math
    chartInterpretation.ts      planet key guards, buildPlanetSummary
    chartPageBuilders.ts        buildPlanetPages, buildHousePages → InterpretationPage[]
    geocode.ts                  OpenCage API wrapper
    time.ts                     birthToUTC, formatDateForDb, formatTimeForDb
    timezones.ts                normalizeZone, getDeviceTimeZoneNormalized
    lexicon/                    interpretation content and lookup functions
    [stubs]                     conversations.ts, journals.ts, notifications.ts,
                                reports.ts, subscriptions.ts, usage.ts
  android/                      generated native Android project
server/                         empty
docs/                           handoff documents
```

**Responsibility of each major module**

- `App.tsx` — boots session, provides `AuthContext { user }` and `SpaceProvider`, owns stack split (authenticated vs unauthenticated), owns `linking` config. Uses a `mounted` ref to prevent stale `setUser` after component unmount during async session initialization.
- `lib/supabase.ts` — singleton Supabase client; reads env vars; configures AsyncStorage persistence and disables URL session detection (`detectSessionInUrl: false`).
- `lib/auth.ts` — thin wrappers around Supabase auth methods. Contains a `console.log` in `getRedirectTo` (debug artifact).
- `lib/charts.ts` — canonical `ChartData` / `ChartRow` types; `buildChartData` orchestrator; `saveChart` (upserts on `user_id,birth_date,birth_time,time_zone`); list/get/delete helpers.
- `lib/astro.ts` — all math: geocentric ecliptic longitudes, aspect detection with fixed orbs, Julian date helpers, GMST/LST, whole-sign Ascendant approximation, planet-to-house assignment.
- `hooks/useChartData.ts` — the single hook consumed by `ChartScreen`. Owns load-from-saved, load-from-Supabase, house hydration for older saved charts, auto-save, and manual save.

---

## 4. Auth Flow

**Signup**

1. `SignupScreen` collects email, password, first/last name, birth date/time, location, time zone, optional lat/lon via `ProfileFields`.
2. Defaults time zone from device via `getDeviceTimeZoneNormalized`.
3. Calls `signUpWithEmail(email, password, meta)` → `supabase.auth.signUp` with `emailRedirectTo: 'naksha://auth/callback'` and `options.data = meta`.
4. On success, navigates to `CheckEmail` with `{ email, profile }` in route params.

**Email verification**

1. `CheckEmailScreen` accepts a 6-digit OTP code.
2. `verifySignupOtp(email, token)` → `supabase.auth.verifyOtp({ email, token, type: 'email' })`.
3. After verification, calls `supabase.auth.getUser()`. If no user: `Alert` → `navigation.replace('Login')`.
4. If `params.profile` exists, upserts profile into `users` with `onConflict: 'id'`.
5. Sets `message` to `'Email Verified.'` and returns — **no explicit navigation reset**.
6. Navigation to Dashboard is implicit: Supabase fires `onAuthStateChange` with a session; `App.tsx` sets `user`, which re-renders the authenticated stack starting at `Dashboard`.
7. The `navigation.reset` block is commented out at line 142–145 of `CheckEmailScreen.tsx`.

**Login**

1. `LoginScreen` → `signInWithEmail` → `supabase.auth.signInWithPassword`.
2. `App.tsx` `onAuthStateChange` fires → sets `user` → authenticated stack renders.

**Session persistence**

- `lib/supabase.ts` configures `AsyncStorage`, `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: false`.
- `App.tsx` `initAuth` calls `getSession()` on mount with a `mounted` ref to prevent stale state on unmount.

**Deep-link callback**

- `AuthCallbackScreen` handles incoming deep links in priority order: `token_hash + type` → `verifyOtp`; `code` → `exchangeCodeForSession`; fragment `access_token + refresh_token` → `setSession`. After any branch: reads session, resets to `Dashboard` or `Login`.
- Contains extensive `console.log` debug statements throughout (not production-ready).

**Profile completion**

- `DashboardScreen` checks the `users` row on focus. If incomplete, tries to merge auth metadata. If still incomplete, navigates to `CompleteProfile` (once per focus via `didNavigateRef`).
- `CompleteProfileScreen` writes to `users` via `.update()` and mirrors to auth metadata via `supabase.auth.updateUser`.
- `ProfileScreen` reads `users` + reads chart preferences from auth metadata; stores preference edits back to auth metadata only.

**Known auth/profile issues**

- `CheckEmailScreen`: implicit post-verification navigation — happy path relies on auth state listener timing.
- Profile data is duplicated between `users` and `auth.user_metadata`; merge is one-directional and scattered.
- `AuthContext` exposes only `{ user: any }` — no auth actions, no loading state, no profile data.
- Navigation route types are `any` throughout; no typed navigator.
- `lib/auth.ts` logs the deep-link redirect URL on every signup and resend.

---

## 5. Data Model / Supabase

**No schema files exist in the repo.** All table shapes are inferred from frontend code.

**Tables referenced by the frontend**

| Table | Referenced in |
|---|---|
| `users` | Dashboard, CompleteProfile, CheckEmail, Profile, MyCharts |
| `charts` | useChartData, DashboardScreen, MyCharts, charts.ts |
| `journals` | JournalList, JournalEditor, journals.ts |
| `subscriptions` | ProfileScreen |
| `purchases` | ProfileScreen |

**Inferred `users` fields**

```
id (PK, Supabase auth user id), email, first_name, last_name,
birth_date (YYYY-MM-DD), birth_time (HH:MM:SS), birth_location,
time_zone (IANA), birth_lat (numeric), birth_lon (numeric)
```

**Inferred `charts` fields**

```
id, user_id, name, birth_date, birth_time, time_zone, birth_lat, birth_lon,
chart_data (JSON → ChartData), created_at, updated_at
assumed unique constraint: (user_id, birth_date, birth_time, time_zone)
```

**`chart_data` JSON shape (`ChartData` type, `lib/charts.ts:17–34`)**

```ts
{
  meta: { name, birth_date, birth_time, time_zone, birth_lat, birth_lon, computed_at, instant_utc }
  planets: { name: string; lon: number }[]
  aspects: { a: string; b: string; type: 'conj'|'opp'|'trine'|'square'|'sextile'; orb: number }[]
  houses: { house: number; lon: number }[] | null
  planet_houses: { name: string; house: number }[] | null
}
```

**RLS assumptions**

- `users`: select/insert/update where `id = auth.uid()`.
- `charts`, `journals`: select/insert/update/delete where `user_id = auth.uid()`.
- `subscriptions`, `purchases`: read-only where `user_id = auth.uid()`.
- `users.upsert` must be permitted for authenticated users' own row (used in CheckEmail, Dashboard, CompleteProfile).

**Schema / frontend mismatch risks**

1. `saveChart` conflict key is `(user_id, birth_date, birth_time, time_zone)` but `useChartData` query also filters `birth_lat` and `birth_lon`. Same birth date/time/zone at different locations → separate rows on lookup, single row on upsert.
2. `DashboardScreen` queries charts without lat/lon — can reload the wrong chart row after a location-only profile change.
3. `ProfileScreen` orders subscriptions by `created_at` but `SubscriptionRow` type does not declare that column (TypeScript blind spot because query uses implicit `any`).
4. No migration files — any schema change must be coordinated manually with the Supabase project.

---

## 6. Chart Flow

**Birth data entry points**

- Dashboard → Chart: `DashboardScreen` passes `profile` as route param to `ChartScreen`.
- My Charts: `MyCharts.tsx` passes `{ fromSaved: true, saved: chart_data, profile: reconstructed }`.
- Signup / profile edit: birth details written to `users` + auth metadata; Dashboard reads on next focus.

**Birth data → ChartData**

1. `buildChartData(input)` in `lib/charts.ts:59` — entry point.
2. `normalizeZone` resolves IANA zone name.
3. `birthToUTC(date, time, tz)` uses `luxon` to produce a UTC `Date`.
4. `computeNatalPlanets(jsDate)` calls `astronomy-engine` `GeoVector + Ecliptic` for 10 bodies.
5. `findAspects(planets)` checks conjunction (6°), opposition (6°), trine (5°), square (5°), sextile (4°) — **orbs are hardcoded; not user-configurable despite ProfileScreen preference UI**.
6. If lat/lon present: `computeWholeSignHouses` approximates Ascendant, returns 12 whole-sign cusps.
7. `assignPlanetsToWholeSignHouses` maps each planet to a house by sign index offset.

**Chart persistence**

- `saveChart` upserts on `(user_id, birth_date, birth_time, time_zone)`.
- Auto-save fires in both `DashboardScreen.load()` and `useChartData.loadChart()`. Both paths call `saveChart`. The hook sets `isSaved = true` after auto-save.
- Manual "Save Chart Data" button only triggers when `isSaved = false`. Since auto-save runs first, the button is effectively always disabled in the normal flow — misleading UX.

**Chart UI components**

| Component | Responsibility |
|---|---|
| `ChartScreen.tsx` | Route validation, hook orchestration, interpretation page assembly, layout composition |
| `ChartHeader.tsx` | Title, location / zone / coordinates, Sun summary |
| `ChartWheel.tsx` | SVG chart: sign ring, house cusps, planet glyphs, aspect lines |
| `PlanetPositionsList.tsx` | Planet rows with inline summary and focus tap |
| `HousesList.tsx` | House rows with sign label and focus tap |
| `AspectsList.tsx` | Aspect rows with type label |
| `ChartCompass.tsx` | Expandable glyph and aspect type legend |
| `InterpretationModal.tsx` | Modal shell + circular PagerView |
| `InterpretationCard.tsx` | Renders one interpretation page (title, subtitle, summary, content blocks) |

---

## 7. Interpretation Flow

**Lexicon structure**

```
lib/lexicon/
  types.ts              ZodiacName, HouseNumber (1–12), AspectType, PlanetKey, Interpretation { short, long }
  planets/index.ts      PLANET_SIGN_MEANINGS[planet][sign] → Interpretation
  planetHouses/         PLANET_HOUSE_MEANINGS[planet][house] → Interpretation
  houses/meanings.ts    HOUSE_MEANINGS[house] → Interpretation
  houses/signMeanings.ts  HOUSE_SIGN_MEANINGS[house][sign] → Interpretation (+ fallback blends)
  aspects/index.ts      ASPECT_MEANINGS[type] → Interpretation  (type-level, not planet-pair)
  signs/index.ts        SIGN_MEANINGS[sign], zodiacNameFromLongitude, signIndexFromLongitude
  index.ts              barrel export — all screens/components import from here
```

**Page assembly** (`lib/chartPageBuilders.ts`)

- `buildPlanetPages(planets, orderedPlanetKeys, planetHouses)` → one `InterpretationPage` per planet. Each page has a sign-meaning block and (if house is known) a house-meaning block.
- `buildHousePages(houses)` → one page per house. Each page has a generic house block and a sign-on-house block.
- Aspect interpretations appear in `AspectsList` only — they are not part of the modal paging system.

**Modal rendering**

- `useChartInterpretation` hook owns visible state, active pages (planet vs house), current index, focused house.
- Opening a planet interpretation also calls `focusPlanet` on `SpaceProvider`.
- `InterpretationModal` uses `PagerView` with synthetic first/last duplicate pages for circular navigation.
- `InterpretationCard` filters empty blocks before rendering.

**Coupling issue**: `PlanetPositionsList.tsx` has its own local `buildPlanetSummary` logic that duplicates `lib/chartInterpretation.ts:buildPlanetSummary`. Changes to planet summary behavior must be made in both places, or the duplication removed first.

---

## 8. Current UI/UX State

**Screens that feel usable**

- `LoginScreen` — simple form, loading/error states.
- `SignupScreen` — complete form: date, time, location, timezone.
- `DashboardScreen` — greeting, sun/moon signs, birth details, navigation buttons.
- `ChartScreen` — SVG wheel, planet/house/aspect lists, compass legend, interpretation modal.
- `MyCharts` — saved chart list with open and delete.
- `JournalListScreen` / `JournalEditorScreen` — create, edit, delete flow.
- `ProfileScreen` — account, birth details, preferences, subscription, purchases display.

**Screens that need polish**

- `CheckEmailScreen` — success shows "Email Verified." with no forward navigation cue. User sees a dead screen briefly while the auth state switch happens behind the scenes.
- `CompleteProfileScreen` — coordinate bug causes silent data corruption on location edit (see §9 Bug #1).
- `ProfileScreen` — "coming soon" preference options are visually active, selectable, and saved to auth metadata with no effect on chart output.
- `AuthCallbackScreen` — debug `console.log` statements emit on every link click in production.
- `ChatScreen`, `SubscriptionScreen` — empty files, not in navigation.

**Oversized / overcoupled components**

| File | Lines | Concern |
|---|---|---|
| `ProfileScreen.tsx` | ~524 | 6 distinct concerns: account info, preferences, subscriptions, purchases, privacy, delete account |
| `DashboardScreen.tsx` | ~376 | Profile repair + chart lookup/generation + sun/moon derivation + dashboard UI |
| `CompleteProfileScreen.tsx` | ~341 | Data load, geocoding fallback, auth metadata sync, UI |
| `CheckEmailScreen.tsx` | ~312 | OTP flow + bespoke styled UI |
| `useChartData.ts` | ~305 | Loading, lookup, hydration, compute, auto-save, manual save |
| `InterpretationModal.tsx` | ~292 | Circular pager behavior + modal shell |
| `ChartScreen.tsx` | ~272 | Chart layout AND interpretation page assembly |

---

## 9. Known Bugs / Inconsistencies

| # | Issue | Files | Symptom | Root cause |
|---|---|---|---|---|
| 1 | **Stale coordinates on profile location edit** | `CompleteProfileScreen.tsx:243–258`, `ProfileFields.tsx:27–28` | Editing birth location text does NOT clear existing lat/lon. Old coordinates survive the save, producing wrong house cusps for the new location. | `ProfileFields` accepts optional `setBirthLat?` / `setBirthLon?` and uses them in `LocationAutocompleteField.onChange` to clear coordinates when the user types. `CompleteProfileScreen` renders `ProfileFields` without passing those setters. The setters exist in local state but are never forwarded. `onSave` geocodes only when `lat == null`. |
| 2 | **Chart uniqueness mismatch** | `lib/charts.ts:113`, `hooks/useChartData.ts:144–164`, `DashboardScreen.tsx:177–184` | Two different locations with the same birth date/time/zone are treated as one chart row on upsert but as separate charts on lookup in `useChartData`. Dashboard lookup omits lat/lon entirely — can load the wrong chart after a location-only profile change. | `saveChart` conflict key = `(user_id, birth_date, birth_time, time_zone)`. `useChartData` lookup adds lat/lon filters. Dashboard lookup does not. |
| 3 | **"Save Chart Data" button is misleading** | `DashboardScreen.tsx`, `useChartData.ts`, `ChartScreen.tsx:224–229` | Button shows "Already Saved" almost immediately because auto-save (in Dashboard AND hook) runs before the user can tap. | Two auto-save paths exist. Manual save is redundant in most flows. |
| 4 | **Check-email success navigation is implicit** | `CheckEmailScreen.tsx:140–145`, `App.tsx:81–84` | After OTP success, screen shows "Email Verified." and stays visible. Navigation depends on auth state listener timing. | `navigation.reset` block is commented out at line 142. Flow relies solely on `onAuthStateChange` in App.tsx switching the stack. |
| 5 | **Preferences saved but ignored** | `ProfileScreen.tsx`, `lib/astro.ts:46–51`, `lib/charts.ts` | Placidus, Equal House, Sidereal zodiac, tight/loose orbs are selectable and persist in auth metadata. Charts remain whole-sign, tropical, fixed orbs. | Preferences are written to `auth.user_metadata` but no chart generation code reads them. |
| 6 | **Deep link to `/chart` without params can crash** | `App.tsx:38`, `ChartScreen.tsx:79` | `naksha://chart` is a valid link target but `ChartScreen` destructures `route.params as RouteParams` expecting a `profile` object. | Linking config exposes `Chart: 'chart'`; no route-level guard ensures params exist before destructuring. |
| 7 | **AuthCallbackScreen debug logs in production** | `AuthCallbackScreen.tsx:18–120` | `console.log` emits on every deep-link callback for all users. | Debug logging added during development was never removed. |
| 8 | **Unused dependencies in bundle** | `client/package.json` | `zustand ^5.0.5` and `axios ^1.9.0` appear in dependencies. Zero imports of either exist in the codebase. | Scaffolded ahead of planned features; never used or removed. Adds unnecessary bundle weight. |
| 9 | **Supabase schema not reproducible from repo** | repo root | Agents and developers cannot verify table definitions, indexes, RLS, or unique constraints from source control. | No `supabase/` migrations or policy files are checked in. |
| 10 | **Duplicate profile storage can diverge** | `SignupScreen`, `DashboardScreen`, `CompleteProfileScreen`, `ProfileScreen` | `users` row and `auth.user_metadata` can disagree after partial saves or older accounts. | Profile data is mirrored in two systems; merge is one-directional (metadata → table) and scattered across screens. |
| 11 | **No automated regression coverage** | `client/package.json` | No `npm test` script; no test files. TypeScript compilation is the only automated correctness check. | No test framework configured. |

---

## 10. Technical Debt

**State duplication**

- Profile fields live in both `users` table and `auth.user_metadata`. Three screens write to one or both.
- `User`, `DBUser`, and `ProfileForChart` types are redeclared locally in `DashboardScreen`, `CompleteProfileScreen`, `ProfileScreen`, `ChartScreen`, and `useChartData` — no shared types file.
- Planet summary logic is duplicated between `PlanetPositionsList.tsx` and `lib/chartInterpretation.ts:buildPlanetSummary`.
- Chart computation runs in both `DashboardScreen` (for sun/moon summary) and `useChartData` (for full chart view), with separate `buildChartData` calls that can produce different results if called at different times.

**Unclear ownership**

- Save semantics: auto-save runs in Dashboard AND in `useChartData`. Manual save is redundant. No single place owns "when does a chart get saved?"
- Profile preferences are written by `ProfileScreen` but never read by the chart engine.
- Chart storage uniqueness contract is split between `saveChart`'s `onConflict` key and the Supabase unique constraint (not in source control).
- Auth verification: OTP entry (`CheckEmailScreen`) and deep-link token verification (`AuthCallbackScreen`) are two paths to the same outcome with no shared post-verification profile-save step.

**Fragile flows**

- Route params are required at runtime but typed as `any` everywhere; no typed navigator to enforce them at compile time.
- `DashboardScreen` uses five refs (`didEnsureOnce`, `didNavigateRef`, `unmounted`, `loadingRef`, `lastLoadAtRef`) plus `InteractionManager.runAfterInteractions` and a 500ms debounce to prevent double-load and double-navigate. The `useFocusEffect` cancels via `task.cancel()` but does not stop in-flight async work.
- `AuthCallbackScreen` handles three different URL shapes; any Supabase auth format change breaks one silently.
- Coordinate update in `CompleteProfileScreen` relies on `ProfileFields` receiving optional setter props that are silently omitted — behavior is dead code in the edit-profile flow.

**Large components to eventually decompose**

- `ProfileScreen` — 6 separate concerns (~524 lines).
- `DashboardScreen` — profile repair + chart generation + UI (~376 lines).
- `useChartData` — loading + lookup + hydration + computation + save (~305 lines).
- `ChartScreen` — layout + interpretation assembly (~272 lines).

**Naming and consistency**

- File `MyCharts.tsx` exports `MyChartsScreen`; all other screen files use matching names.
- Aspect types use short internal names (`conj`, `opp`) and `AspectsList` renders them raw — no display label mapping.
- UI mixes shared `Button` / `Card` components with inline `TouchableOpacity` styled locally per screen.
- Some comments include development-era markers: `// NEW`, `// coming soon`, `// ✅`, disabled lint directives.

**Missing tests**

- No test runner, no test files.
- No coverage of: auth/profile save flow, chart generation math, chart persistence identity, interpretation page building, or lexicon lookups.
- No schema validation — all table contracts are inferred.

---

## 11. Recommended Next 5 Tasks

Ranked by user impact × risk reduction × demo / shipping value.

**1. Fix profile location coordinate lifecycle** *(highest risk, concrete 2-file fix)*

`CompleteProfileScreen` must pass `setBirthLat` and `setBirthLon` to `ProfileFields`. The setters already exist in state; they just aren't forwarded. `ProfileFields` already uses them in `LocationAutocompleteField.onChange` — the wiring is one prop away.
- Files: `CompleteProfileScreen.tsx:243–258`, `ProfileFields.tsx` (already supports the setters).

**2. Align chart persistence identity contract**

Decide: does lat/lon belong in the unique key? Update `saveChart` conflict columns, `useChartData` query, and `DashboardScreen` query to agree, then document (or add to repo) the Supabase unique constraint.
- Files: `lib/charts.ts`, `hooks/useChartData.ts`, `DashboardScreen.tsx` + new Supabase migration.

**3. Make signup verification navigation deterministic**

After OTP success + users upsert, call `navigation.reset` to `Dashboard` (or `CompleteProfile` if profile is incomplete) with explicit error handling. Remove reliance on auth state listener timing.
- File: `CheckEmailScreen.tsx:140–145`.

**4. Decide and simplify chart save semantics**

Pick one owner: auto-save only (remove manual button or convert it to a "re-compute" action), or manual-only (remove auto-save from Dashboard and hook). Update button label and state to match reality.
- Files: `DashboardScreen.tsx`, `hooks/useChartData.ts`, `ChartScreen.tsx`.

**5. Wire or visually disable chart preferences**

Either implement `house_system` and `zodiac_type` in `buildChartData` and `findAspects`, or make "coming soon" preferences clearly non-interactive (disabled + visual label). Active, saveable preferences that have no effect erode user trust.
- Files: `ProfileScreen.tsx`, `lib/astro.ts`, `lib/charts.ts`.

---

## 12. Best Next Vertical Slice

**Recommended slice: profile edit → chart refresh reliability**

**Goal**: A user can change birth location (or any birth detail), save, and see a correctly regenerated chart whose metadata, house cusps, dashboard summary, and saved-chart row all reflect the new data — with no stale coordinates, no wrong chart row, and no ambiguous save UX.

**Files likely involved**

- `client/screens/CompleteProfileScreen.tsx` — pass coordinate setters to `ProfileFields`; consider clearing the chart row on profile save
- `client/components/auth/ProfileFields.tsx` — coordinate clearing already wired; just needs setters forwarded
- `client/hooks/useChartData.ts` — align query identity with `saveChart` conflict columns
- `client/lib/charts.ts` — decide final unique key
- `client/screens/DashboardScreen.tsx` — add lat/lon to chart lookup to match hook
- `supabase/` (new) — migration file documenting the unique constraint

**Expected behavior after the slice**

- Editing location text clears previous lat/lon immediately.
- Picking from autocomplete stores that result's lat/lon.
- Saving with no autocomplete selection geocodes and stores the result.
- `users.birth_location`, `birth_lat`, `birth_lon` are always consistent after save.
- Dashboard and chart screen lookups use the same identity columns.
- After profile save, dashboard generates and auto-saves a new chart row with correct houses.

**Verification steps**

1. `cd client && npx tsc --noEmit` — zero errors.
2. Sign in with a test account that has an existing location with lat/lon.
3. Navigate to "Edit Birth Details".
4. Change location text — confirm the resolved coordinate line disappears immediately.
5. Select a new location from autocomplete — confirm coordinates update.
6. Save — confirm Profile shows new location + matching coordinates.
7. Return to Dashboard — confirm sun/moon signs reflect the new chart.
8. Open "View Birth Chart" — confirm header metadata, coordinates, and house cusps match the new location.
9. Open "My Charts" — confirm saved-chart behavior matches the chosen uniqueness rule.

---

## 13. Agent Instructions Going Forward

**How Codex / Claude should work in this repo**

- Treat `client/` as the only active app directory. `server/` is empty; do not create files there without discussion.
- Read relevant files before editing. Prefer `rg` (ripgrep) for symbol and string search.
- Keep changes narrowly scoped to the requested vertical slice. Do not refactor adjacent code unless it directly blocks the slice.
- Run `cd client && npx tsc --noEmit` before any handoff. Fix all TypeScript errors; never suppress with `// @ts-ignore`.
- Do not edit generated Android files in `client/android/` unless the task is explicitly native-build related.
- Do not read, print, or log `.env` values. Reference variable names only (e.g., `EXPO_PUBLIC_SUPABASE_URL`).

**What NOT to touch casually**

- `client/.env` — credentials.
- `client/android/` — generated native project.
- `client/lib/lexicon/` — product prose content; do not rewrite without explicit instruction.
- Auth callback / session behavior — fragile; any change must be tested on both OTP-entry and deep-link paths.
- `ChartData` JSON shape — stored in Supabase; changes require a migration or versioning plan.
- Chart uniqueness contract (`saveChart` conflict columns + Supabase constraint) — must be changed atomically.
- `client/assets/` — generated images.

**Prompt style that works well**

1. Name one vertical slice.
2. State target behavior, exact files in scope, and what must remain untouched.
3. State whether schema changes are allowed.
4. State whether UX copy / lexicon content changes are allowed.
5. Ask for `npx tsc --noEmit` output and a short summary of behavioral changes.

**Verification commands**

```bash
cd client && npx tsc --noEmit        # must pass with zero errors
cd client && npm run start           # Expo dev server
cd client && npm run android         # Android build
cd client && npm run ios             # iOS build
cd client && npm run web             # Expo web
```

**Current tooling gaps**

- No `npm test` script — no test runner configured.
- No `npm run lint` script — ESLint is installed but not scripted.
- No Supabase migration validation — add `supabase db diff` once migrations are introduced.
- `zustand` and `axios` are installed but unused — remove before next bundle optimization pass.
