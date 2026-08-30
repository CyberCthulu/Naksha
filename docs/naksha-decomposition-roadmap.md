# Naksha Architecture and Release Roadmap

Last updated: 2026-08-29
Status: D0-D6.3 V1 depth and architecture pass complete; Android UI/UX redesign and release hardening are next.
Canonical engineering status: `docs/naksha-codebase-handoff.md`
Canonical product scope: `docs/Feature-List.md`

## 1. Purpose

This document records the completed architecture work and the remaining sequence to an Android V1 release. It replaces the earlier decomposition queue that scheduled Dashboard lookup hardening, journal handoff, guidance depth, navigation typing, and chart-data compatibility; those slices have shipped.

The governing rule remains conservative: decompose a large surface only when a concrete product or release task benefits from it. Naksha does not need a broad rewrite before Android release.

## 2. Current Architecture

Naksha is an Expo/React Native/TypeScript application backed by Supabase. The active V1 consists of:

- Supabase email/password auth, OTP/callback verification, password recovery, persistent sessions, profile completion, and server-side account deletion.
- Tropical/Western natal chart calculation using ten planets, five major aspects, and Whole Sign houses when coordinates exist.
- Saved self charts, one-off guest charts, a chart wheel, placement/house/aspect lists, and local interpretation content.
- Pure deterministic DailyGuidance and WeeklyForecast builders backed by stable authored lexicon records.
- Transit-through-natal-house context calculated from the current moving planet longitude and natal Whole Sign cusps.
- Guided reflection handoff into JournalEditor plus journal create/edit/list/delete behavior.
- Shared saved-chart hydration, typed active navigation, and explicit persisted ChartData compatibility/version semantics.

The current automated baseline is 25 Jest suites / 183 tests, with typecheck, lint, and `git diff --check` passing.

## 3. Completed Stabilization Foundation

Before the D0-D6.3 depth pass, targeted slices established the base that current features depend on:

- Profile presentational components and shared profile-completion helpers.
- ChartScreen route shell / ChartScreenContent split.
- Runtime saved-chart validation and malformed-data fallback.
- Canonical coordinate-inclusive chart identity and missing-coordinate view-only behavior.
- `useChartData` branch coverage, auto-save warning visibility, and stale-async guards.
- Password reset, auth callback hardening, and deployed account deletion.
- Generated Supabase types and source-controlled migrations.
- Guest chart creation with manual-save-only guest behavior.
- Interpretation clipping/pager fixes and app-root safe-area support.
- Chart preference plumbing for the only supported V1 settings: Tropical, Whole Sign, medium orbs.

These are completed contracts, not roadmap items.

## 4. Completed D0-D6.3 Pass

| Slice | Result | Architectural contract |
| --- | --- | --- |
| D0 | Reflection CTA consolidation | Each guidance card presents one coherent prompt/practice reflection action. |
| D1 | Daily local-date correction | Prompt/practice rotation follows the user's local calendar date while transit math uses the actual instant. |
| D2 | Fixed-context JournalEditor | Guidance context is read-only; only the user's response is saved as journal content; edit-mode saved content wins. |
| D3 | Weekly interpretation/rhythm polish | Daily Rhythm, sampled persistence labels, representative reflection, canonical aspect tones, and existing weekly event mechanics are presented coherently. |
| D4/D4.1 | Guidance content depth | The authored corpus expanded to 34 prompts and 24 practices, with stable pre-existing IDs and refined planet/target/aspect/sign prose. |
| D5/D5.1 | Transit-house context | Daily Life area and day-specific weekly house context use the moving planet's current longitude against natal Whole Sign houses; missing houses omit context safely. |
| D6.1 | Shared hydration/guidance path | `hydrateChartData` is shared by Dashboard and `useChartData`; saved/fresh charts converge before guidance; invalid stored time zones route to correction. |
| D6.2 | Active navigation typing | `RootStackParamList` types all 14 registered routes and active JournalEditor/Chart payloads without changing runtime navigation. |
| D6.3 | ChartData compatibility contract | New chart JSON carries `schema_version: 1` and `calculation_version: 1`; valid unversioned legacy data remains supported; future versions are not silently consumed. |

## 5. Current Pressure Points

### Dashboard

`DashboardScreen.tsx` still owns session/profile orchestration, metadata repair, profile-completion routing, saved-vs-fresh chart resolution, auto-save policy, guidance construction, navigation callbacks, loading/error state, and rendering. D6.1 removed duplicated hydration and guidance wiring, but Dashboard was not fully decomposed.

During redesign, extract only presentation that clearly improves the active screen change. Do not move the complete async load flow into a new service or state machine merely to reduce line count.

### Release Configuration

Production application identity, Android signing, signed release-build proof, store metadata, privacy/support artifacts, and release-candidate QA are not complete. These are launch blockers even though the V1 product loop is implemented.

### Operational Safety

Local typecheck/test/lint coverage is strong, but CI, automated Supabase reset/diff validation, and production crash/error visibility remain open. Choose the smallest release-appropriate implementation rather than building a large internal platform.

### Content and Feature Boundaries

The current deterministic guidance system is coherent and should be stabilized through on-device UX review. It does not include AI, saved forecast history, notifications, retrogrades, lunar phases, applying/separating timing, or outer planets as moving transit candidates. Those are post-V1 decisions.

## 6. Immediate Android V1 Roadmap

### 1. Controlled UI/UX Redesign

Type: product polish
Goal: establish and propagate an approved premium/celestial/editorial Android visual direction without changing tested behavior.
Primary document: `docs/ui-redesign/redesign-plan.md`

Preserve:

- auth/profile completion and invalid-timezone correction;
- chart save/open/delete and self/guest save rules;
- DailyGuidance/WeeklyForecast semantics and collapse behavior;
- fixed-context journal handoff and edit precedence;
- account deletion contract;
- legacy/current/unsupported chart compatibility behavior.

### 2. Android Production Configuration

Type: release hardening
Goal: finalize product identity, Android package/application configuration, production environment handling, and repeatable release signing.

Avoid mixing feature work into native/release configuration. Generated Android files should change only when the release task explicitly requires them.

### 3. Signed Release Candidate and QA

Type: release hardening
Goal: prove the production build on representative Android devices and exercise the complete V1 loop.

Minimum release-candidate coverage:

- signup, OTP/callback verification, login, session restore, password recovery;
- profile completion/edit, geocoding, and invalid-timezone correction;
- self chart, guest chart, saved chart open/delete, missing-coordinate view-only behavior;
- chart wheel, positions, houses, aspects, and interpretation modal;
- collapsed/expanded daily and weekly guidance, house context, reflection handoff;
- journal create/edit/list/delete;
- legacy chart hydration, malformed-chart fallback, unsupported-future-version refusal;
- sign-out and account deletion.

### 4. Privacy, Support, and Store Package

Type: release hardening
Goal: document actual data handling and provide an operational support path before public submission.

Resolve:

- privacy policy and store data-use disclosures;
- retention/deletion semantics and the current availability of export;
- support contact/process and required public URLs;
- store listing copy, screenshots, and release notes.

### 5. Google Play Testing and Submission

Type: release delivery
Goal: distribute the signed candidate through the appropriate Play testing track, address review/device findings, and submit the approved Android V1.

iOS is intentionally later.

## 7. Post-V1 Feature Tracks

These are not blockers for the scoped Android V1:

- reusable guest profiles, relationship metadata, synastry, and composite charts;
- AI chat, AI readings, or provider integration;
- push notifications and notification preferences;
- reports, subscriptions, purchases, or premium gating;
- dedicated shadow-work cycles, milestones, streaks, or history;
- Vedic, Chinese, Sidereal, Placidus, Equal House, or other calculation systems;
- Uranus/Neptune/Pluto as moving forecast candidates;
- retrogrades, lunar phases, exact transit windows, and applying/separating status;
- saved forecast history, multi-week/monthly forecasts, and transit calendar;
- analytics/admin tooling beyond whatever production release safety requires.

Before synastry, define reusable birth-profile identity and relationship metadata. Before AI, define the privacy, safety, server-side provider, cost, and retention contracts.

## 8. Architecture Guardrails

- Keep `public.users` as durable profile/birth data; auth metadata is bootstrap/repair input only.
- Keep canonical chart identity unchanged: user plus birth date/time/time zone/coordinates.
- Preserve self auto-save, guest manual-save, and missing-coordinate view-only semantics.
- Use `hydrateChartData` for in-memory compatibility; do not auto-save a legacy chart merely because it was hydrated.
- Treat unversioned structurally valid ChartData as legacy V1, explicit current versions as supported, and future/malformed versions as non-current.
- Keep schema and calculation versions separate; do not add interpretation-content versions to ChartData.
- Keep current Whole Sign house math as the single house-assignment source.
- Transit house always comes from the moving planet's current longitude, never the natal target planet's house.
- Keep guidance builders pure, deterministic, and driven by explicit date/time-zone inputs.
- Keep active routes governed by `RootStackParamList`; preserve component callback boundaries rather than passing navigation objects downward.
- Create incremental migrations for future schema changes; never edit the pulled remote-schema baseline.

## 9. Verification Baseline

For application slices:

```bash
cd client
npm run typecheck
npm test
npm run lint
cd ..
git diff --check
```

Current recorded result: 25 suites / 183 tests pass, with typecheck, lint, and diff-check passing.

For documentation-only work, verify `git status --short`, `git diff --stat`, `git diff`, and `git diff --check`, and confirm no application/source files changed.
