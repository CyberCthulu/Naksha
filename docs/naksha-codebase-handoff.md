# Naksha Codebase Handoff

Last reviewed: 2026-09-25 at `7027373504035be1fad5e0665231527854f64ab2` (`ui/v2-redesign`)

This document is the current engineering handoff. Use [Feature-List.md](Feature-List.md) for implemented product scope and [release-hardening-plan.md](release-hardening-plan.md) for the active release sequence. Dated audits and implementation plans under `docs/` are historical evidence; their baselines and instructions do not override these current documents.

## Current status

Naksha is an Expo/React Native Android-first astrology app backed by Supabase. The core free V1 loop and primary visual redesign are implemented. Release-hardening slices R1–R3 are repository-complete and independently reviewed:

- **R1:** same-owner relational integrity, deletion isolation, dormant-table write removal, and dangerous client privilege removal.
- **R2:** civil birth date/time storage, strict validation, explicit DST gap/fold handling, persisted fold choice, and one civil-to-UTC calculation boundary.
- **R3:** authoritative journal edit loading, separate insert/update operations, safe failure behavior, and narrowed client write surfaces.

These changes have not been declared production-deployed by the repository work. Reviewed migrations require the deployment preflight and verification described in the release plan.

The post-R3 local baseline is:

- 62/62 Jest suites and 793/793 tests.
- TypeScript, lint, and `git diff --check` passing.
- R3 pgTAP: 47/47.
- Combined R1/R2/R3 pgTAP: 131/131.
- Clean database replay and the tested pre-R3-to-R3 upgrade path passing.
- Local service-role account-deletion compatibility passing.

R4 is next: authentication recovery plus production Android identity and security. R5 covers the remaining high-value astrology calculation risk at high latitudes. R6 contains the remaining engineering release gates. Content review C1–C4 and a signed release-candidate cycle follow R6.

## Source-of-truth hierarchy

- [release-hardening-plan.md](release-hardening-plan.md): current R1–R6, content, release-candidate, and launch roadmap.
- [Feature-List.md](Feature-List.md): current implemented product behavior and known limits.
- This handoff: current code structure, invariants, and operating notes.
- [ui-redesign/current-sky-compass.md](ui-redesign/current-sky-compass.md): current Sky Now behavior and interpretation structure.
- [release-readiness-2026-09-12.md](release-readiness-2026-09-12.md) and the remaining dated audits/plans: historical snapshots.

## Stack and repository layout

- `client/`: Expo 54 / React Native 0.81 application, TypeScript, Jest, and ESLint.
- `supabase/`: local Supabase configuration, ten migration files, three pgTAP R1–R3 suites, and the account-deletion Edge Function.
- `docs/`: current references plus historical audits and implementation records.
- `server/`: empty; there is no separate application server.
- Root `package.json`: local Supabase CLI tooling.

The client uses React Navigation, Supabase Auth/Postgres, AsyncStorage session persistence, Luxon and timezone-support for civil-time handling, astronomy-engine for calculations, react-native-svg for chart rendering, and OpenCage for location lookup.

## Application shell and navigation

`client/App.tsx` registers 14 routes. Login, Signup, ForgotPassword, and CheckEmail form the signed-out stack. AuthCallback and ResetPassword remain reachable across auth states. Dashboard, Chart, CreateGuestChart, MyCharts, Profile, CompleteProfile, JournalList, and JournalEditor form the signed-in stack. The deep-link scheme is `naksha://`; journal edit links use `journal/edit/:id?`.

The startup session bootstrap still awaits `supabase.auth.getSession()` without the complete rejection recovery required for release. Related async failure handling, recovery UX, post-deletion sign-out behavior, and an authenticated-navigation reset race belong to R4.

## Authentication and profiles

Supabase Auth handles signup, email verification, login, password recovery, session persistence, and logout. Signup profile data travels through auth metadata only as a bootstrap handoff. `public.users` is the durable profile store.

Active profile fields include civil `birth_date`, civil `birth_time`, IANA `time_zone`, nullable `birth_utc_offset_minutes`, birthplace text, and coordinates. Profile completeness logic is shared through `client/lib/profileCompletion.ts`.

Account deletion calls the `delete-account` Edge Function, which verifies the caller, deletes owned dependencies, and deletes the auth user last. The function was historically deployed and manually tested; each release candidate must verify the deployed function and post-deletion client behavior again.

## Civil birth date/time invariant

The persisted application contract is:

- `CivilDate { year, month, day }`
- `CivilTime { hour, minute }`
- a validated IANA time zone
- a persisted UTC offset only when required to reproduce a DST-fold occurrence

`client/lib/time.ts` owns strict parsing, direct database serialization, IANA-zone validation, local-time classification, and civil-to-UTC resolution. Database dates and times are produced directly as `YYYY-MM-DD` and `HH:mm:ss`; they are not derived from `Date.toISOString()`.

DateField and TimeField may use JavaScript `Date` inside native-picker adapters, but immediately convert back to civil fields. The date adapter rejects device-local dates that cannot round-trip, including the 2011-12-30 skipped date in Pacific/Apia and Pacific/Fakaofo, instead of shifting the requested date.

A spring DST gap is rejected as nonexistent. A fall fold requires the user to select an occurrence; `birth_utc_offset_minutes` reproduces that choice on reload and recalculation. Legacy records are preserved as stored because the intended date cannot be inferred safely.

## Chart calculation and persistence

The app calculates Tropical longitudes for the Sun through Pluto, medium-orb major aspects, and Whole Sign houses when coordinates are available. `client/lib/time.ts` resolves civil input to an exact instant before `computeNatalPlanets` receives it. Calculation code does not independently reinterpret civil values.

The current Ascendant implementation is approximate. Independent review identified a possible opposite-horizon selection at sufficiently high latitudes; R5 owns rising-versus-setting verification, correction, and northern/southern reference fixtures.

New chart data emits schema and calculation version 1. Runtime validation distinguishes unversioned legacy, current, unsupported future, and malformed persisted payloads. Unsupported payloads are not interpreted or overwritten.

Canonical saved-chart identity includes:

`user_id, birth_date, birth_time, time_zone, birth_utc_offset_minutes, birth_lat, birth_lon`

with `NULLS NOT DISTINCT`. This preserves an explicit DST-fold choice without duplicating an otherwise identical chart. Self charts auto-save only when required identity data and coordinates exist. Guest charts require an explicit save. Charts without coordinates remain view-only.

`hydrateChartData` provides compatibility for older saved payloads. R6 still needs to harden fallback precedence, reject unusable empty house/planet-house arrays, and verify house ordering assumptions.

## Guidance and Sky Now

Dashboard guidance is deterministic and local:

- Today's Energy uses current transits to natal planets, local-calendar selection seeds, a strongest-theme summary, reflection prompt, practice, and no-aspect fallback.
- Weekly Forecast builds a Monday–Sunday local week from seven local-noon snapshots, handles DST boundaries, deduplicates highlights, and incorporates natal Whole Sign house context.
- Sky Now computes the ten current bodies, current-to-current aspects, and uses a separate current-sky interpretation lexicon.

The guidance and interpretation libraries remain deterministic; AI is not required. The content phase after engineering hardening must address missing entries, repetition, generic phrasing, tonal balance, prompt relevance, Today's Energy repetition, and Weekly Forecast composition.

Known engineering gaps include Dashboard refresh across resume and local day/week rollover, Sky Now aspect accessibility, inactive chart motion, and reduced-motion consistency.

## Journal write contract

`client/lib/journals.ts` exposes separate operations:

- `insertJournal()` for creation.
- `updateJournal()` for partial content updates.
- `getOwnedJournal()` for authoritative edit loading.

JournalEditor treats a route ID only as an identifier. It loads the owned server row before editing and does not trust route title/content. Missing, malformed, foreign, or deleted rows become safe unavailable states. An update that loses its target cannot recreate it. Failed saves keep typed text and dirty state.

Content-only edits do not overwrite chart, prompt, or guidance metadata. Authenticated clients cannot explicitly insert or update journal/chart primary-key IDs. Sequence access is limited to required `USAGE`.

## Database integrity and write surface

The forward migration chain lives in `supabase/migrations/`. Do not edit historical migrations.

R1 added composite same-owner foreign keys for:

- `journals(chart_id, user_id) -> charts(id, user_id)`
- `conversations(chart_id, user_id) -> charts(id, user_id)`
- `reports(chart_id, user_id) -> charts(id, user_id)`
- `messages(conversation_id, user_id) -> conversations(id, user_id)`

Optional chart relationships use column-specific `ON DELETE SET NULL (chart_id)`, preserving child ownership. Dormant conversations/messages/reports client writes are revoked. Client `TRUNCATE`, `REFERENCES`, and `TRIGGER` privileges on application tables are revoked. Service-role behavior is preserved.

R2 added nullable `birth_utc_offset_minutes` to users and charts and expanded canonical chart identity. R3 narrowed chart/journal column grants, removed client `usage_events` writes because there is no V1 consumer, and preserved service-role deletion order.

The generated client schema is `client/lib/database.types.ts`. R6 must regenerate it from the deployed authoritative schema after migrations are deployed and resolve existing relationship metadata drift. Do not regenerate it merely because local relationship metadata changed.

Notifications, subscriptions, and purchases retain broad DML grants while RLS currently blocks unauthorized writes. Users' birth columns retain table-level write grants with self-row RLS. These are non-blocking defense-in-depth reviews for R6.

## Location search

`client/lib/geocode.ts` calls OpenCage directly with `EXPO_PUBLIC_OPENCAGE_KEY`. Signup, Complete Profile, and Guest Chart use location selection to capture coordinates and a time-zone annotation when available.

R6 must add cancellation, timeout, stale-response protection, malformed-response handling, and a production API-key/proxy decision. Do not treat an Expo public variable as a secret.

## UI and accessibility

The primary V1 redesign and shared design system are implemented. Profile and chart sections use shared cards, buttons, typography, and themed colors. ChoiceRow is a semantic 48 dp radio row with non-color selection state. Dangerous profile actions are weighted by consequence. Birth coordinates are not shown in the profile presentation.

Remaining release work includes Sky Now aspect semantics, lifecycle/motion behavior, TalkBack acceptance, relevant Android sizes, and full signed-candidate device testing. Expo Go is useful for iterative UI checks but does not prove production identity, signing, native permission, backup, or Play-delivered behavior.

## Production identity and release state

The current development identity is still a placeholder:

- Expo app name/slug: `client`
- Android package: `com.anonymous.client`
- Deep-link scheme: `naksha`

R4 must establish the intentional Naksha name, final package/application ID, production scheme, signing, necessary permissions, backup/data-extraction policy, and a signed Android AAB. Android is the launch platform; iOS follows after Android stabilization unless requirements change.

There is no automated CI gate. R6 should run typecheck, lint, Jest, and DB/pgTAP coverage where practical.

## Current release blockers and sequence

1. **R4 — next:** auth recovery plus Android production identity/security.
2. **R5:** high-latitude Ascendant/reference correctness.
3. **R6:** remaining engineering readiness, including CI, generated types, hydration, lifecycle, accessibility, geocoder resilience, settings correctness, privacy/support/export, diagnostics, and dependency disposition.
4. **C1–C4:** lexicon completeness, editorial quality, composition quality, and astrology editorial review.
5. **Release candidate:** freeze, production configuration, signed AAB, real-device acceptance, backend verification, Play testing, and store submission.
6. **Launch:** Android launch and narrow stabilization fixes.
7. **Later:** iOS, relationships/synastry, deeper transit intelligence, optional AI, and optional social features.

Future sharing must use explicit authorization/sharing records. It must not weaken R1's private-by-default same-owner constraints.

## Verification commands

Client checks:

```bash
cd client
npm run typecheck
npm test -- --runInBand
npm run lint
cd ..
git diff --check
```

Local database replay and R1–R3 pgTAP checks require Docker and the local Supabase stack:

```bash
./node_modules/.bin/supabase start
./node_modules/.bin/supabase db reset
./node_modules/.bin/supabase test db supabase/tests/database/r1_same_owner_relational_integrity.sql --local
./node_modules/.bin/supabase test db supabase/tests/database/r2_civil_birth_time_resolution.sql --local
./node_modules/.bin/supabase test db supabase/tests/database/r3_client_write_surface.sql --local
```

Use current script names from `client/package.json` and the installed root Supabase CLI. Do not run migrations against production without the plan's deployed-data preflight, backup/recovery preparation, reviewed migration sequence, and post-deploy two-account checks.

## Working rules

- Preserve civil birth fields exactly; never serialize them through UTC.
- Resolve civil date, civil time, zone, and any fold offset once before astronomy calculations.
- Use `insertJournal`, `updateJournal`, and `getOwnedJournal`; do not reintroduce journal upsert editing.
- Keep ownership enforcement in database constraints and write authorization in RLS/grants.
- Add forward migrations; do not modify the pulled historical schema.
- Preserve unsupported persisted chart versions without reinterpretation or overwrite.
- Keep future features outside the V1 release gate unless the release plan explicitly adds them.
- Do not claim repository-complete work is production-deployed.
