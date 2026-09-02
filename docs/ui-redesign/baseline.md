# Naksha UI Redesign Baseline

Status: baseline of record — the state from which all visual change is judged
Captured: 2026-09-02
Platform focus: Android first
Companion documents: `ui-audit.md` (findings), `design-system.md` (proposals),
`redesign-plan.md` (sequence)

This document freezes the pre-redesign state. It records what was verified, what
was already broken before any visual work, and what must still be captured on a
device before the flagship slice can be reviewed.

It is a **baseline, not a plan**. Nothing here authorizes a change.

---

## 1. Repository State

| Field | Value |
| --- | --- |
| Branch | `main` |
| Commit | `deaae7e6` — "updated docs to reflect codebase" |
| Preceding commits | `b09359e0` (D6.3 pass), `82a2095c` (D6.2), `39c33163` (D6.1) |
| Working tree | Clean except untracked redesign documentation under `docs/ui-redesign/` |
| Application code | **Unmodified.** No file under `client/` has been changed during audit or baseline capture |
| Product baseline | D0–D6.3 complete per `docs/naksha-codebase-handoff.md` |

### Toolchain at baseline

Expo `~54.0.32`, React Native `0.81.5`, React `19.1.0`, TypeScript `~5.9.2`,
Hermes enabled, New Architecture enabled (`newArchEnabled=true`),
edge-to-edge **disabled** (`edgeToEdgeEnabled=false` plus
`android:windowOptOutEdgeToEdgeEnforcement=true`).

---

## 2. Verification Results

Run from `client/` on 2026-09-02.

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `npm run typecheck` | **Pass** |
| Tests — cold cache, parallel | `npm test` | **3 failed / 180 passed** — all 5000 ms timeouts |
| Tests — serial | `npm test -- --runInBand` | **Pass — 25 suites / 183 tests, 3.76 s** |
| Tests — warm cache, parallel | `npx jest` | **Pass — 25 suites / 183 tests** |
| Lint | `npm run lint` | **Pass**, no warnings |
| Whitespace | `git diff --check` | **Pass** |

**Baseline of record: 25 suites / 183 tests passing.** This matches the figure
recorded in `docs/naksha-codebase-handoff.md` and is confirmed accurate.

---

## 3. The Cold-Cache Jest Flake

### What was observed

The first `npm test` run of the session failed three tests across three suites —
`CheckEmailScreen`, `ProfileScreen`, and one further screen suite — each with:

```
thrown: "Exceeded timeout of 5000 ms for a test."
```

The failing suites reported wall times of 12.7 s and 14.4 s for the *suite*,
against a 5 s *per-test* limit.

### Why it is not a regression

Three independent checks contradict a product fault:

1. Re-running those suites in isolation with `--runInBand --testTimeout=30000`
   passed **42/42 in 1.55 s**.
2. A full serial run passed **183/183 in 3.76 s**.
3. A second full parallel run, with the Jest/Babel transform cache now warm,
   passed **183/183**.

The failure is reproducible only on the first run after a cleared cache. It is
**transform-compilation cost colliding with Jest's default per-test timeout
under worker contention**, not application behavior. `jest-expo` must compile
the React Native and Expo module graph for each worker on a cold cache; on this
machine that exceeds 5 s for the heaviest screen suites.

### Why this matters to the redesign

Every redesign slice re-runs this suite as its regression gate. A timeout that
looks identical to a genuine failure will either mask a real regression or waste
review cycles on a phantom one. **The gate must be deterministic before Slice 1
begins.**

### Approved remedy (Slice 0 — not implemented in this task)

Cap worker count rather than raising the global timeout:

```js
// client/jest.config.js — PROPOSED, not applied
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  maxWorkers: 2,
}
```

Rationale for capping workers over raising the timeout: a raised timeout hides
genuine slowness and would let a real performance regression pass the gate. A
worker cap reduces contention while leaving the 5 s limit meaningful as an
actual signal.

**Verification required for Slice 0:** clear the cache
(`npx jest --clearCache`), then run `npm test` and confirm 183/183 on the
*first* run. Repeat from a cleared cache at least twice. If `maxWorkers: 2` does
not produce a deterministic cold-cache pass, escalate to a documented
`testTimeout` increase as a second step — not as the first move.

---

## 4. Pre-Existing Defects at Baseline

These existed at commit `deaae7e6`, before any redesign work. They are **not**
redesign findings and are **not** to be fixed inside visual commits. They belong
to the pre-redesign defect-hardening series (Slice 1), except where noted.

| ID | Defect | Severity | Disposition |
| --- | --- | --- | --- |
| D-01 | Invisible text on the auth callback screen | High | **Slice 1 — immediate critical fix** |
| D-02 | Primary button fails contrast | High | **Slice 1 — immediate critical fix** |
| D-03 | Android system chrome is white | High | **Slice 1 — align splash / status bar / interface style with the existing dark app** |
| D-04 | MyCharts error state has no recovery | Medium | Slice 1 — narrow fix |
| D-05 | Nested touchables in the saved-chart row | Medium | Slice 1 — narrow fix |
| D-06 | Back-button touch targets below 48 dp | Medium | Slice 1 — narrow fix |
| D-07 | Per-render saved-chart revalidation | Low-Medium | **Separate engineering/performance change with focused verification — not bundled into Slice 1's UI fixes** |
| D-08 | Interpretation sheet positioning unverified on Android | Low-Medium | **Android QA investigation only. No code change until reproduced or verified on a device.** Superseded by Slice 5, which owns modal insets under edge-to-edge |

### D-01 — Invisible text on the auth callback screen

`client/screens/AuthCallbackScreen.tsx:214` renders
`<Text>Verifying your account…</Text>` with no `style`. React Native's default
text color is black; the application background is `#000`. The user sees a bare
spinner with invisible copy.

On the path for: every deep-link email verification and every password-recovery
callback. This is the highest-severity defect at baseline because it sits on an
account-recovery path.

### D-02 — Primary button fails contrast

`client/components/ui/Button.tsx` sets `primary.backgroundColor` to
`theme.colors.text` (`#fff`) and `primaryText.color` to `theme.colors.cardBg`
(`rgba(0,0,0,0.35)`) — 35 %-opacity black on white.

Live on the only two default-variant buttons in the product: Dashboard's
**"View Birth Chart"** and Create Guest Chart's **"Create Chart"**.

Second-order effect: because the primary variant is visually broken, every auth
screen renders every action as `variant="ghost"`, which is the root cause of the
missing action hierarchy (audit F-05). Fixing D-02 is a prerequisite for
evaluating hierarchy honestly.

### D-03 — Android system chrome is white

| Location | Setting |
| --- | --- |
| `android/app/src/main/res/values/styles.xml` | `android:statusBarColor` = `#ffffff` |
| `android/app/src/main/res/values/colors.xml` | `splashscreen_background` = `#ffffff` |
| `android/app/src/main/res/values/colors.xml` | `colorPrimaryDark` = `#ffffff` |
| `android/app/src/main/res/values/colors.xml` | `iconBackground` = `#ffffff` |
| `app.json` | `userInterfaceStyle` = `"light"` |
| `app.json` | `splash.backgroundColor` = `#ffffff` |
| `app.json` | `android.adaptiveIcon.backgroundColor` = `#ffffff` |

No `StatusBar` component exists anywhere in the JS tree, so bar-icon style is
never set. `AppTheme` also inherits `Theme.AppCompat.DayNight.NoActionBar` with a
populated `values-night/colors.xml`, so native chrome follows the system
light/dark setting while the JS UI is permanently dark.

Scope note: Slice 1 aligns these with the **existing** dark application. It does
not adopt the new design-system palette — that arrives in Slice 2.

### D-04 — MyCharts error state has no recovery

`client/screens/MyCharts.tsx` renders the error branch as centered error text
with no retry control, and the in-screen header is not rendered in that branch,
so there is no back affordance either. The same shape applies to `ChartScreen`'s
invalid-time-zone guard.

### D-05 — Nested touchables in the saved-chart row

`MyCharts` renders a `TouchableOpacity` inside another `TouchableOpacity` and
calls `e.stopPropagation()` on the inner press. Nested touchables are unreliable
on Android and `stopPropagation` is not the React Native responder mechanism for
this. **Requires device confirmation of the actual misbehavior before the fix
shape is chosen.**

### D-06 — Touch targets below the Android minimum

| Location | Effective target |
| --- | --- |
| `MyCharts`, `JournalListScreen` | `width: 24`, no padding — approx. 24 x 33 dp |
| `ChartHeader`, `ProfileHeader`, `CreateGuestChartScreen` | 36 x 36 dp |
| `CompleteProfileScreen`, `CheckEmailScreen`, `JournalEditorScreen` | 40 x 36 dp |

Google's minimum is 48 x 48 dp. **No back control in the application meets it,
and `hitSlop` is used nowhere.**

### D-07 — Per-render saved-chart revalidation

`MyCharts`' `renderItem` calls `validateChartData(item.chart_data)` inline, so
every list render re-runs full runtime validation of every row's chart JSON.
`renderItem` and `ItemSeparatorComponent` are also re-created inline on each
render, defeating `FlatList` memoization.

Handled as a **separate engineering/performance change** with focused
verification, not as part of the UI defect fixes — it touches list behavior and
memoization, and its verification is measurement, not visual review.

### D-08 — Interpretation sheet positioning on Android

`InterpretationModal` uses `transparent` without `statusBarTranslucent`, then
positions the sheet absolutely at `top: insets.top + 52`. On Android a
transparent `Modal` does not extend under the status bar unless
`statusBarTranslucent` is set, so `insets.top` may be double-counted. Existing
tests assert reduced safe-area padding but run in a renderer, not on a device.

**This is an open QA question, not a known bug.** Do not change code for it
until it is reproduced or verified on a device. If device verification shows
correct rendering, close it as a non-issue and record that here.

Because Slice 5 adopts edge-to-edge and owns modal insets, D-08 is expected to
be **resolved there as a design requirement** rather than patched in isolation.
Patching it against the current opted-out inset model would be work thrown away.

---

## 5. Android Screenshot Baseline Checklist

**Not yet captured. This is the largest outstanding baseline deliverable** and
cannot be produced without a device or emulator.

Capture on a representative Android device or emulator at default system font
size unless a row states otherwise. Store under
`docs/ui-redesign/reference/baseline/` using the naming convention
`<route>--<state>.png`.

### 5.1 Route coverage — all 14 registered routes

Derived from the `RootStackParamList` inventory in `ui-audit.md` §2.1.

| # | Route | Screen | Required captures |
| --- | --- | --- | --- |
| 1 | `Login` | `LoginScreen` | default; validation error; submitting |
| 2 | `Signup` | `SignupScreen` | empty; filled; validation error; submitting |
| 3 | `ForgotPassword` | `ForgotPasswordScreen` | default; neutral success message; error |
| 4 | `CheckEmail` | `CheckEmailScreen` | default; code entered; verifying; resending |
| 5 | `ResetPassword` | `ResetPasswordScreen` | default; mismatch error; submitting |
| 6 | `AuthCallback` | `AuthCallbackScreen` | verifying state — **captures D-01** |
| 7 | `Dashboard` | `DashboardScreen` | loading; complete profile; no-profile-row card; error+retry |
| 8 | `CompleteProfile` | `CompleteProfileScreen` | loading; prefilled; validation alert; saving |
| 9 | `CreateGuestChart` | `CreateGuestChartScreen` | empty; location selected with coordinates; typed location without coordinates |
| 10 | `Chart` | `ChartScreen` → `ChartScreenContent` | see §5.2 — the flagship surface |
| 11 | `MyCharts` | `MyCharts` | loading; populated; empty; error — **captures D-04** |
| 12 | `JournalList` | `JournalListScreen` | loading; populated; empty; error |
| 13 | `JournalEditor` | `JournalEditorScreen` | new entry; guidance-context entry; edit mode; saving |
| 14 | `Profile` | `ProfileScreen` | loading; populated; error+retry; deleting account |

### 5.2 Flagship surface — Natal Chart and interpretation

| Surface | Required captures |
| --- | --- |
| Chart — loading | `LoadingState label="Loading chart"` |
| Chart — self, saved | header, wheel, positions, houses, aspects, `Saved to My Charts` |
| Chart — self, unsaved | `Save Chart Data` action state |
| Chart — guest, unsaved | `Save Chart` action state |
| Chart — **missing coordinates** | `View Only` state **and** the "Add a birth location" card; houses list fallback copy |
| Chart — **no aspects** | `None (within default orbs)` fallback |
| Chart — **save warning** | inline warning card with chart still rendered (self mode) |
| Chart — route guard, missing birth fields | `Back to Dashboard` branch |
| Chart — route guard, invalid time zone | dead-end branch |
| Chart — unsupported chart version | update-required path |
| Glyph Compass | collapsed and expanded |
| Interpretation sheet | planet page; house page; first page; last page |
| Interpretation sheet | **circular pager wrap** — last→first and first→last |
| Interpretation sheet | long-interpretation page, scrolled to the final paragraph (**verifies the D-07-adjacent clipping fix is intact**) |
| Interpretation sheet | single-page state (nav controls disabled) |

### 5.3 Guidance state variants

| Surface | Required captures |
| --- | --- |
| `TodayEnergyCard` | collapsed; expanded |
| `TodayEnergyCard` | expanded **with** `Life area` transit-house context |
| `TodayEnergyCard` | **no-aspect fallback** |
| `WeeklyForecastCard` | collapsed; expanded |
| `WeeklyForecastCard` | Daily Rhythm with day-specific `House N · focus` |
| `WeeklyForecastCard` | **no-aspect fallback** |
| Journal handoff | `JournalEditor` reached from Today's Energy; and from Weekly Forecast |

### 5.4 Cross-cutting state variants

Every one of these is a state the redesign must not regress.

| Category | Required captures |
| --- | --- |
| Loading | all six `LoadingState` call sites; app-boot indicator; auth-callback indicator |
| Error | Dashboard (retry + sign out); MyCharts; JournalList; Profile; both Chart route guards |
| Empty | MyCharts; JournalList; Aspects; Houses-without-coordinates; Purchases; Dashboard no-profile-row |
| Validation | inline `errorText` form; each distinct `Alert.alert` |
| Destructive | delete chart; delete journal (long-press); delete account confirmation |
| View-only | missing-coordinate chart |
| In-progress | saving preferences; deleting account; saving journal; saving profile; location search spinner |

---

## 6. Device QA Requirements

Automated tests protect behavior. They do not approve visual quality, and they
do not exercise any of the following. Each must be performed on a device or
emulator for the baseline **and** repeated for each redesign slice that touches
the surface.

### 6.1 Dynamic text scaling

No `allowFontScaling` or `maxFontSizeMultiplier` exists anywhere in the app, and
16 `numberOfLines` clamps plus several fixed-width columns are in use. Capture at
minimum, default, and **largest** Android font size:

| Surface | Specific risk |
| --- | --- |
| `PlanetPositionsList` | fixed `width: 150` monospace left column; right column clamped to 4 lines at 12 px |
| `HousesList` | fixed `width: 150` left column; right column clamped to 4 lines |
| `AspectsList` | fixed `width: 150` left column; right column clamped to 3 lines |
| `InfoRow` (Profile) | fixed `width: 110` label column; value clamped to 2 lines |
| `WeeklyForecastCard` | fixed `width: 38` weekday column |
| `TodayEnergyCard` collapsed | sections clamped to 2 lines |
| `LoadingState` | `minWidth: 160` label clamped to 1 line |
| Screen title bars | centered `flex: 1` titles with no truncation policy |
| Longest real content | longest authored guidance string and longest house string |

### 6.2 Keyboard behavior

`KeyboardAvoidingView` is a **no-op on Android** in both `AuthContainer` and
`JournalEditorScreen` (`behavior` is `undefined` when not iOS). Keyboard handling
relies entirely on `android:windowSoftInputMode="adjustResize"`.

This baseline is captured **with edge-to-edge opted out**. Edge-to-edge is
adopted in Slice 5, at which point every check in §6.2, §6.3, and §6.4 must be
re-run — the inset model changes underneath all of them.

| Check | Surface |
| --- | --- |
| Field remains visible while focused | Signup (long form), CompleteProfile, CreateGuestChart |
| Multiline growth with keyboard open | JournalEditor content field |
| Tap-through while keyboard open | screens **without** `keyboardShouldPersistTaps`: Dashboard, Profile, MyCharts, JournalList |
| Suggestion list reachable with keyboard open | `LocationAutocompleteField` — list is in-flow, not an overlay |
| Return-key behavior | no `returnKeyType` chain or `onSubmitEditing` exists; record actual behavior |
| Keyboard over the primary action | CompleteProfile footer buttons; JournalEditor bottom save |

### 6.3 Safe areas and system bars

| Check | Note |
| --- | --- |
| Status-bar overlap | Dashboard uses a **fixed `paddingTop: 40`**, ignoring `insets.top`; Chart and Profile use insets |
| Full-screen loading | `LoadingState` renders into `uiStyles.center` with **no safe-area awareness** |
| Bottom inset | gesture-navigation and 3-button-navigation devices |
| Notch / punch-hole | header rows and centered titles |
| Landscape | `screenOrientation="portrait"` is locked in the manifest — confirm the lock holds |
| Status-bar icon contrast | no `StatusBar` component exists; record what Android chooses |
| Splash → first frame | white splash into dark app — **captures D-03** |

### 6.4 Modal and pager QA

| Check | Note |
| --- | --- |
| Sheet top position | **D-08** — `transparent` modal without `statusBarTranslucent`, positioned at `insets.top + 52`. Baseline observation only; **resolved as a design requirement in Slice 5**, not patched beforehand |
| Sheet bottom inset | gesture bar vs. 3-button navigation |
| Backdrop dismissal | tap outside the sheet |
| Android hardware/gesture back | `onRequestClose` |
| Circular pager wrap | last→first and first→last, **behavior must be unchanged** |
| Per-page scroll position | current preservation behavior is **intentional** — not a defect, not a blocker |
| Close and reopen | pager index reset |
| Long-content scrolling | final paragraph fully visible, not clipped |
| Layering | sheet above all chart content; no bleed-through |

### 6.5 Scrolling and performance

| Check | Note |
| --- | --- |
| Chart scroll smoothness | SVG wheel plus three lists in one `ScrollView` |
| MyCharts list scroll | **D-07** — revalidation per row per render |
| Long journal list | `FlatList` with inline `renderItem` |
| Scroll-indicator consistency | `showsVerticalScrollIndicator={false}` is set on Dashboard only |
| Pull-to-refresh | `RefreshControl` is used **nowhere**; record the absence as baseline |
| Release-build rendering | SVG and `PagerView` behavior differs between debug and release — verify on a release build |

---

## 7. Baseline Sign-Off Status

| Artifact | Status |
| --- | --- |
| Branch and commit | **Recorded** (§1) |
| Verification results | **Recorded** (§2) |
| Cold-cache flake explanation and remedy | **Recorded** (§3) — remedy not yet implemented |
| Pre-existing defects D-01 – D-08 | **Recorded** (§4) |
| Android screenshot checklist | **Defined** (§5) — **captures not taken** |
| Device QA requirements | **Defined** (§6) — **not executed** |

**The baseline is documentarily complete and visually incomplete.** Sections 5
and 6 require a device or emulator run and are the gating dependency for the
Slice 6 flagship review, which is judged by comparison against these captures.
