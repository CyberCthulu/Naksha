# Naksha Current UI Audit

Status: complete — awaiting review
Audit date: 2026-09-02
Audited commit: `deaae7e6` ("updated docs to reflect codebase")
Working tree at audit time: clean except untracked redesign documentation
Platform focus: Android first
Governing documents: `docs/ui-redesign/README.md`, `docs/ui-redesign/redesign-plan.md`
Visual direction reference: `docs/ui-redesign/reference/naksha-ui-north-star.png`

This document completes stage 2 of the migration sequence in `redesign-plan.md`
(baseline -> **current UI audit** -> design system -> typography -> primitives ->
app shell -> flagship screen -> validation -> propagation -> Android polish).

It audits the implemented V1 surface only. It proposes no token values, no
palette, no typeface, and no component geometry. Those belong to
`design-system.md`, which does not exist yet (see section 13).

Existing defects are recorded separately from redesign preferences so that
visual work does not silently redefine behavior. See section 10 (defects) versus
section 11 (ranked redesign findings).

---

## 1. Verification Baseline

Run from `client/` on 2026-09-02.

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `npm run typecheck` | Pass |
| Tests (first, cold cache) | `npm test` | 25 suites / 183 tests — **3 tests failed**, all 5000 ms Jest timeouts |
| Tests (serial) | `npm test -- --runInBand` | **Pass — 25 suites / 183 tests, 3.76 s** |
| Tests (parallel, warm cache) | `npx jest` | **Pass — 25 suites / 183 tests** |
| Lint | `npm run lint` | Pass, no warnings |
| Whitespace | `git diff --check` | Pass |

### Test-flake finding

The first default-parallel run failed three tests in three suites
(`CheckEmailScreen`, `ProfileScreen`, and one further screen suite), each with
`Exceeded timeout of 5000 ms`. Re-running the same suites in isolation with a
30 s timeout passed 42/42 in 1.55 s, and a full serial run passed 183/183 in
3.76 s.

Re-running the full suite in parallel a second time, with the Jest/Babel
transform cache warm, also passed 183/183. This is a **cold-cache
worker-contention flake, not a product regression**. The recorded 25/183
baseline in `docs/naksha-codebase-handoff.md` is confirmed accurate. It is recorded here because redesign slices will re-run this suite
repeatedly and must not misread a timeout as a visual-change regression.

Recommendation (not part of this audit's scope to apply): raise Jest's
`testTimeout` or cap `maxWorkers` before propagation begins, so per-slice
verification is deterministic.

### Baseline gap

`redesign-plan.md` section 1 requires **representative Android screenshots for
every active route**, plus captures of compact/expanded guidance, no-aspect and
missing-house fallbacks, and loading/error/empty/validation/destructive/view-only
states. **No screenshot baseline exists in the repository.** This is the single
largest missing baseline artifact; see section 13.

---

## 2. Active Surface Inventory

### 2.1 Registered routes (14)

All routes are typed in `client/navigation/types.ts` and registered in
`client/App.tsx`. `RootStackParamList` is the navigation contract and must not
change.

| # | Route | Screen file | Stack | Navigator header | In-screen header |
| --- | --- | --- | --- | --- | --- |
| 1 | `Login` | [LoginScreen.tsx](client/screens/LoginScreen.tsx) | Unauthenticated | Hidden | None (centered form) |
| 2 | `Signup` | [SignupScreen.tsx](client/screens/SignupScreen.tsx) | Unauthenticated | Hidden | None (title in body) |
| 3 | `ForgotPassword` | [ForgotPasswordScreen.tsx](client/screens/ForgotPasswordScreen.tsx) | Unauthenticated | Hidden | None (title in body) |
| 4 | `CheckEmail` | [CheckEmailScreen.tsx](client/screens/CheckEmailScreen.tsx) | Unauthenticated | Hidden | Custom top row |
| 5 | `ResetPassword` | [ResetPasswordScreen.tsx](client/screens/ResetPasswordScreen.tsx) | Both | Hidden | None (title in body) |
| 6 | `AuthCallback` | [AuthCallbackScreen.tsx](client/screens/AuthCallbackScreen.tsx) | Both | Hidden | None (spinner only) |
| 7 | `Dashboard` | [DashboardScreen.tsx](client/screens/DashboardScreen.tsx) | Authenticated | Hidden | None (title in body) |
| 8 | `CompleteProfile` | [CompleteProfileScreen.tsx](client/screens/CompleteProfileScreen.tsx) | Authenticated | Configured, then **overridden off** | Custom top row |
| 9 | `CreateGuestChart` | [CreateGuestChartScreen.tsx](client/screens/CreateGuestChartScreen.tsx) | Authenticated | Configured, then **overridden off** | Custom top row |
| 10 | `Chart` | [ChartScreen.tsx](client/screens/ChartScreen.tsx) -> [ChartScreenContent.tsx](client/components/charts/ChartScreenContent.tsx) | Authenticated | Configured, then **overridden off** | `ChartHeader` |
| 11 | `MyCharts` | [MyCharts.tsx](client/screens/MyCharts.tsx) | Authenticated | Configured, then **overridden off** | Custom top row |
| 12 | `JournalList` | [JournalListScreen.tsx](client/screens/JournalListScreen.tsx) | Authenticated | Configured, then **overridden off** | Custom top row |
| 13 | `JournalEditor` | [JournalEditorScreen.tsx](client/screens/JournalEditorScreen.tsx) | Authenticated | Configured, then **overridden off** | Custom top row |
| 14 | `Profile` | [ProfileScreen.tsx](client/screens/ProfileScreen.tsx) | Authenticated | Configured, then **overridden off** | `ProfileHeader` |

Plus one full-screen overlay that is not a route:

| Overlay | File | Mechanism |
| --- | --- | --- |
| Interpretation sheet | [InterpretationModal.tsx](client/components/charts/InterpretationModal.tsx) | RN `Modal` + `PagerView` |

### 2.2 Inactive / excluded from redesign

`ChatScreen.tsx` and `SubscriptionScreen.tsx` are empty stub files, are not
registered in `App.tsx`, and are not in the linking config. **Out of scope.**
`SpaceBackground.tsx` is implemented but commented out at
[App.tsx:15](client/App.tsx#L15) and [App.tsx:129](client/App.tsx#L129);
see section 6.

### 2.3 Shared UI components (46 files)

**`components/ui/` — shared primitives (11 files)**

| Component | Consumers | Verdict |
| --- | --- | --- |
| `AppText` / `MutedText` / `TitleText` | 11 files | Retain, expand into typography roles |
| `Button` | 8 files | Retain contract, rebuild internals (see D-02) |
| `Card` | 4 files | Retain, but **collides with `uiStyles.card`** (F-08) |
| `Screen` | **0 files** | **Dead code** — no importers anywhere |
| `LoadingState` | 6 files | Retain, needs label/safe-area consistency |
| `FormField` | 5 files | Retain |
| `TextField` | 5 files | Retain |
| `formStyles` | 3 files | Merge into token layer |
| `uiStyles` | 33 files | The de-facto style system; must be migrated first |
| `theme` | 38 files | The de-facto token file; insufficient (section 3) |

**`components/auth/` — form components (8 files)**
`AuthContainer`, `DateField`, `TimeField`, `EmailField`, `PasswordField`,
`ProfileFields`, `TimeZonePicker`, `LocationAutocompleteField`.

**`components/charts/` — chart surface (10 files)**
`ChartScreenContent`, `ChartHeader`, `ChartWheel`, `ChartCompass`,
`PlanetPositionsList`, `HousesList`, `AspectsList`, `InterpretationModal`,
`InterpretationCard`, `interpretationTypes`.

**`components/guidance/` — Dashboard guidance (2 files)**
`TodayEnergyCard`, `WeeklyForecastCard`. These are the **most accessible and
most consistently built components in the app** (see section 9) and should be
the reference for the rest.

**`components/profile/` — Profile cards (9 files)**
`ProfileHeader`, `BirthDetailsCard`, `ChartPreferencesCard`, `ChoiceRow`,
`InfoRow`, `SubscriptionCard`, `PurchasesCard`, `DataPrivacyCard`,
`AccountActionsCard`.

**`components/space/` — atmosphere (2 files)**
`SpaceProvider` (active, drives planet focus), `SpaceBackground` (disabled).

---

## 3. Theme and Token Audit

`client/components/ui/theme.ts` is the entire token layer — 6 colors,
3 spacing values, 1 radius:

```ts
colors: { text: '#fff', muted: 'rgba(255,255,255,0.75)',
          sub: 'rgba(255,255,255,0.85)', border: 'rgba(255,255,255,0.4)',
          cardBg: 'rgba(0,0,0,0.35)', danger: 'crimson' }
spacing: { screen: 20, top: 40, card: 14 }
radius:  { card: 12 }
```

### Findings

- **No background token.** The app background is hardcoded `'#000'` twice in
  `App.tsx` ([L118](client/App.tsx#L118), [L127](client/App.tsx#L127)). No
  screen can reference the environment color.
- **No accent token.** There is no gold, no primary action color, and no
  planet-accent concept. The direction requires restrained warm gold plus
  planet-specific atmospheric accents; the token layer has no slot for either.
- **`text` is doing double duty as a surface.** `Button.primary` uses
  `backgroundColor: theme.colors.text` and `primaryText` uses
  `color: theme.colors.cardBg`. Roles are inverted, producing a real contrast
  defect (D-02).
- **`muted` (0.75) is lighter than nothing, `sub` (0.85) is lighter than
  `muted`** — the naming implies the opposite ordering of the values. There is
  no muted slate/lavender secondary color at all; both are white at reduced
  alpha.
- **No semantic states.** No success, warning, info, disabled, focus, pressed,
  or selected tokens. `danger` is the CSS keyword `'crimson'`.
- **No elevation, no shadow, no gradient, no opacity scale, no icon size,
  no motion tokens.**
- **Spacing scale is unusable in practice.** Three tokens exist; the codebase
  uses **18 distinct raw margin/padding values** (0,1,2,3,4,6,7,8,9,10,12,14,16,
  18,20,40). The three most common — 10 (37 uses), 12 (36), 8 (34) — are all
  raw literals.
- **Radius scale is unusable in practice.** One token (`card: 12`); the codebase
  additionally uses raw 4, 7, 8, 18, 26, and 999.

### Token adoption

38 of 46 UI files import `theme`, and 33 import `uiStyles`. **Adoption
discipline is good; the token vocabulary is the problem, not compliance.** This
materially reduces migration risk: expanding `theme.ts` propagates widely.

---

## 4. Hardcoded Style Audit

Only **45 raw color literals** exist outside `theme.ts` across the whole app —
better than typical. They cluster into four groups:

| Group | Files | Values | Note |
| --- | --- | --- | --- |
| App root | `App.tsx` | `#000` x2, `#fff` x3 (nav theme) | Should become background/text tokens |
| Chart SVG | `ChartWheel`, `ChartCompass` | 8x `rgba(255,255,255,*)`, 2x `rgba(0,0,0,*)` | Needs a chart-specific stroke/fill token set |
| iOS system blue | `ProfileHeader`, `ChoiceRow`, `DataPrivacyCard`, `AccountActionsCard`, `ChartPreferencesCard`, `ProfileScreen`, `JournalListScreen` | **`#007AFF` x7**, `rgba(0,122,255,0.6)`, `#999` | Off-brand; see F-12 |
| Row highlight | `PlanetPositionsList`, `HousesList` | `rgba(255,255,255,0.06)` x2 | Should be a `selected` token |
| Sheet chrome | `InterpretationModal` | `rgba(0,0,0,0.55)`, `rgba(10,10,10,0.97)` | Should be scrim/sheet tokens |
| Disabled 3D | `SpaceBackground` | 11 planet hex values | Already a de-facto planet-accent palette (section 6) |

### Inline style objects

Inline object literals are allocated per render in
[ChartScreenContent.tsx](client/components/charts/ChartScreenContent.tsx)
(9 sites: `{flex:1}`, `{alignItems:'center', marginBottom:10}`,
`{height:16}` x2, `{marginBottom:12}`, the whole `contentContainerStyle`),
plus `{height:8..12}` spacer views in `LoginScreen`, `SignupScreen`,
`ForgotPasswordScreen`, `ResetPasswordScreen`, `CheckEmailScreen`,
`DashboardScreen`, `CompleteProfileScreen`. Low-severity, but the
**spacer-`View` idiom should be replaced by a stack/gap primitive** during the
primitives stage rather than reproduced.

---

## 5. Typography Audit

**No fonts are loaded.** There is no `expo-font` dependency, no `useFonts`, no
`loadAsync`, and no custom `fontFamily` other than three `fontFamily: 'monospace'
as any` casts in `PlanetPositionsList`, `HousesList`, and `AspectsList`. The
entire app renders in the Android system default (Roboto). **The serif display /
sans body direction has zero implementation footing today** — font loading and a
splash-gating strategy must be designed in the typography stage.

### Scale sprawl

| Axis | Distinct values in use | Values |
| --- | --- | --- |
| `fontSize` | **10** | 12 (23x), 13 (20x), 14 (6x), 15 (6x), 16 (16x), 18 (9x), 20 (4x), 22 (5x), 28 (6x), 30 (3x) |
| `fontWeight` | **4** | 500 (3x), 600 (14x), 700 (31x), 800 (13x) |
| `lineHeight` | **7** | 16, 18, 19, 20, 22, 24, 28 |

### Eight competing heading definitions

The same conceptual role is defined independently in eight places:

| Role | Definition | Location |
| --- | --- | --- |
| Screen H1 | 22 / 600 | `uiStyles.h1` |
| Screen H1 | 22 / 600 | `AppText.TitleText` (duplicate of the above) |
| Screen H1 | 20 / 700 | `JournalEditorScreen.styles.h1` |
| Screen title bar | 18 / 700 | `ChartHeader`, `ProfileHeader`, `MyCharts`, `JournalList`, `JournalEditor`, `CreateGuestChart` |
| Screen title bar | 18 / 800 | `CheckEmailScreen`, `CompleteProfileScreen` |
| Card title | unspecified size / 700 | `uiStyles.cardTitle` |
| Section H2 | 16 / 700 | `PlanetPositionsList`, `HousesList`, `AspectsList` |
| Sheet/panel title | 16 / 800, 20 / 700, 22 / 800 | `ChartCompass`, `InterpretationCard`, `CheckEmailScreen` |

`TitleText` is byte-identical to `uiStyles.h1` and both are used. The 18/700
versus 18/800 split across screen title bars is arbitrary.

### Reading-flow findings

- Body copy has **no consistent measure**. Interpretation body is
  14/24 (`InterpretationCard.bodyText`); guidance body is 13/19; list right-hand
  summaries are 12/16; journal context is 13/19. The flagship reading surface
  (interpretation) and the daily reading surface (guidance) do not share a
  hierarchy, which `redesign-plan.md` section 4 explicitly requires.
- **16 `numberOfLines` clamps** exist, several on primary content
  (`PlanetPositionsList` right column at 4 lines / 12px, `HousesList` at 4,
  `AspectsList` at 3, `TodayEnergyCard` collapsed sections at 2). These are
  layout compensations for missing hierarchy and will clip harder under text
  scaling.
- **Numeric presentation is inconsistent.** Positions render as
  `Ar 23°03′` in a fixed 150px monospace column; aspects render as
  `Sun conj Moon (1.42°)`; weekly transits render `1.4° orb`; coordinates render
  to 2, 3, or 4 decimal places depending on screen
  (`ChartScreenContent` 2, `BirthDetailsCard` 3, `ProfileFields` 4).

---

## 6. Background, Environment, and Atmosphere

The current environment is **flat pure black with no depth**:

- `App.tsx` wraps everything in `<View style={{flex:1, backgroundColor:'#000'}}>`.
- `TransparentTheme` sets navigation `background`, `card`, and `border` to
  `'transparent'`, and `text`/`primary`/`notification` to `'#fff'`.
- `screenOptions.contentStyle` is `{backgroundColor:'transparent'}`.
- Every surface above it is `rgba(0,0,0,0.35)` — a translucent black card on
  pure black, which renders as a near-invisible 35%-darker rectangle whose only
  real definition is the `rgba(255,255,255,0.4)` border.

The north-star reference is explicit that the environment should be
"atmospheric, not noisy" — subtle starfield and gradients creating depth without
competing with content. **None of that exists.** There is no gradient, no
starfield, no vignette, and no navy; the environment is `#000`, not near-black
navy.

### The disabled 3D background

`SpaceBackground.tsx` is a `@react-three/fiber` canvas rendering 5,000 animated
star points plus a focused-planet sphere, driven by `SpaceProvider`'s
`focusedPlanet`. It is commented out in `App.tsx`. Consequences:

- `three` (pinned via `overrides` to 0.182.0), `@react-three/fiber`, `expo-gl`,
  and `@types/three` remain **installed and bundled dependencies for a disabled
  feature** — a real Android APK-size and startup cost (F-13).
- `SpaceProvider` is still live: `ChartScreenContent` calls `focusPlanet` on
  mount and on every planet row tap, and `PlanetPositionsList` uses
  `focusedPlanet` for row highlighting. **The focus contract is load-bearing for
  the chart screen even though its visual consumer is switched off.**
- `colorForPlanet()` already encodes an 11-value planet palette
  (Sun `#f1be47`, Moon `#a09f9f`, Mars `#af2c08`, Jupiter `#d2b48c`,
  Saturn `#d8c07a`, Uranus `#7ad8d8`, Neptune `#4f79ff`, Venus `#e6c08a`,
  Mercury `#999999`, Pluto `#b08a7a`, default `#ffffff`). This is the closest
  thing the codebase has to the "restrained planet-specific atmospheric accents"
  decision and is a useful **starting reference**, not an approved palette.

A decision is required (section 14) on whether atmosphere is delivered by
re-enabling GL, by a static/SVG/gradient approach, or not at all for V1.

### Android system chrome contradicts the app

`client/android/app/src/main/res/values/`:

```xml
<item name="android:statusBarColor">#ffffff</item>   <!-- white status bar -->
<color name="splashscreen_background">#ffffff</color> <!-- white splash -->
<color name="colorPrimaryDark">#ffffff</color>
```

plus `app.json` `"userInterfaceStyle": "light"`,
`splash.backgroundColor: "#ffffff"`, and
`android.adaptiveIcon.backgroundColor: "#ffffff"`.

The app is a near-black celestial product that **launches on a white splash into
a white status bar**. There is also no `StatusBar` component anywhere in the JS
tree, so bar icon style is never set. This is a P0 visual defect (D-03).

`AppTheme` inherits `Theme.AppCompat.DayNight.NoActionBar` with a populated
`values-night/colors.xml`, so **native chrome follows the system light/dark
setting while the JS UI is permanently dark** — an inconsistency the app shell
stage must resolve.

---

## 7. Navigation and App Shell Audit

`RootStackParamList`, the linking config, and the auth/unauthenticated stack
split are contracts and are **not** changed by this audit.

### Duplicate header architecture

`App.tsx` configures `headerShown: true` with `headerTransparent: true` and a
title for **seven** authenticated routes (`CompleteProfile`, `CreateGuestChart`,
`Chart`, `MyCharts`, `JournalList`, `JournalEditor`, `Profile`). **Every one of
those screens then calls `navigation.setOptions({ headerShown: false })` in a
`useLayoutEffect`** and renders its own top row. `CheckEmailScreen` does the same
against a header that was never shown.

Consequences:

- Seven navigator `title` strings (`'Complete Profile'`, `'Create Guest Chart'`,
  `'Birth Chart'`, `'My Saved Charts'`, `'My Journal'`, `'Journal Entry'`,
  `'My Profile'`) are **dead configuration**, and several disagree with the
  in-screen title actually rendered (`'Birth Chart'` vs `'Natal Chart'`,
  `'My Saved Charts'` vs `'My Charts'`, `'My Journal'` vs `'Your Journal'`).
- The back affordance is re-implemented **six separate times** as a bare `‹`
  glyph at `fontSize` 28 or 30 with four different container geometries
  (36x36, 40x36, `width:24` with no container, and `width:36 marginRight:8`).
- No route uses the platform back gesture affordance or a shared header
  component. There is no `headerLeft`, no title truncation policy, and no
  right-slot convention (`ChartHeader` and `CreateGuestChart` render an empty
  44px `rightSlot`; `ProfileHeader` puts an "Edit" link there;
  `CompleteProfile` and `JournalEditor` put a save pill there).

The app shell stage should collapse this to one decision — **either** the
navigator header **or** one shared in-screen header primitive — without touching
route names or params.

### Screen gutters

Three different screen-padding implementations coexist:
`uiStyles.screen` (20 / top 40, used by no screen), `AuthContainer`
(`paddingHorizontal: 20`, `paddingTop: insets.top + 16`), and per-screen
`contentContainerStyle` (`padding: theme.spacing.screen` with
`paddingTop: insets.top + 12` on Profile/Chart, `theme.spacing.top` = 40 on
Dashboard). Dashboard therefore uses a **fixed 40px top pad that ignores
`insets.top` entirely**, while Chart and Profile use insets.

### Transitions

No custom transitions, no shared-element behavior, no `animation` option, and no
navigation progress state. The north star calls for "smooth transitions" into
focused interpretation; today the interpretation sheet uses only
`Modal animationType="slide"`.

---

## 8. Forms, Keyboard, and Input Audit

### Coverage

`FormField` + `TextField` are used correctly by `EmailField`, `PasswordField`,
`ProfileFields`, `LocationAutocompleteField`, `CreateGuestChartScreen`, and
`ResetPasswordScreen`. `DateField`, `TimeField`, and `TimeZonePicker` **bypass
`FormField`** and re-implement the label as
`<Text style={[uiStyles.text, {marginBottom:8, fontWeight:'600'}]}>` with an
inline-styled bordered `Pressable`. `JournalEditorScreen` bypasses both and
defines its own `label` + `input` + `textarea` styles.

### Validation presentation

Validation is split across three incompatible mechanisms:

| Mechanism | Screens |
| --- | --- |
| Inline `uiStyles.errorText` (crimson, centered) | `Login`, `Signup`, `ForgotPassword`, `ResetPassword`, `CompleteProfile`, `LocationAutocompleteField` |
| `Alert.alert()` modal | `Signup` (timezone), `CompleteProfile` (missing info, invalid TZ, save failure), `CreateGuestChart` (missing info, invalid TZ), `CheckEmail` (6 distinct alerts), `JournalEditor` (empty, save failure), `MyCharts` (delete failure, unsupported/invalid chart), `JournalList` (delete failure), `Profile` (save failure, deletion failure) |
| Silent no-op | `DashboardScreen` "View Birth Chart" (`if (!profile \|\| needsProfileCompletion(profile)) return`) |

**No field-level error state exists.** `TextField` has no error prop and no
error border; errors always appear as detached centered text or a system alert,
never attached to the offending field. `errorText` is also `textAlign: 'center'`
with `marginBottom: 12`, which reads as a page-level message even when it
describes one field.

### Keyboard behavior on Android

`AuthContainer` and `JournalEditorScreen` both use:

```tsx
behavior={Platform.OS === 'ios' ? 'padding' : undefined}
keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
```

On Android `KeyboardAvoidingView` is therefore a **no-op wrapper**, and keyboard
handling relies entirely on `android:windowSoftInputMode="adjustResize"` in the
manifest. That works today because the app opts out of edge-to-edge
(`edgeToEdgeEnabled=false`, `android:windowOptOutEdgeToEdgeEnforcement=true`).
It is a **known-fragile combination on Android 15 / API 35**, where edge-to-edge
is enforced and the opt-out is temporary. This must be verified on device before
Android polish, and re-verified if edge-to-edge is ever enabled.

`keyboardShouldPersistTaps="handled"` is set on `AuthContainer`,
`JournalEditorScreen`, and `ChartScreenContent`, but **not** on `DashboardScreen`,
`ProfileScreen`, `MyCharts`, or `JournalListScreen`.

Other gaps: no `returnKeyType` chain except one `"next"` in `JournalEditor` that
targets nothing; no `onSubmitEditing`; no field refs/focus advancement; no
`textContentType`/`autoComplete` hints on email or password fields; no
`Keyboard.dismiss()` on scroll.

### `LocationAutocompleteField` dropdown

The suggestion list renders as an in-flow `View` beneath the input rather than an
overlay, so selecting a location **pushes the rest of the form down and back**.
It has a 400 ms debounce and correct request-id cancellation (good), but no
keyboard dismissal on select, no max-height, and no scroll — a long result set
extends the form arbitrarily.

---

## 9. Loading, Error, Empty, and Destructive State Audit

### Loading

| Screen | Component | Label |
| --- | --- | --- |
| Dashboard | `LoadingState` | `"Loading..."` (default) |
| Profile | `LoadingState` | `"Loading..."` (default) |
| CompleteProfile | `LoadingState` inside `AuthContainer` | `"Loading..."` (default) |
| Chart | `LoadingState size="large"` | `"Loading chart..."` |
| MyCharts | `LoadingState size="large"` | `"Loading charts..."` |
| JournalList | `LoadingState` | `"Loading journals..."` |
| App boot | Bare `ActivityIndicator size="large"` on `#000` | none |
| AuthCallback | Bare `ActivityIndicator` + unstyled `Text` | `"Verifying your account…"` |

Four of eight use the shared component with a consistent size; two use bare
indicators. `LoadingState` renders into `uiStyles.center`, which has **no
safe-area awareness** — full-screen loading is vertically centered in the raw
window. `ActivityIndicator` never receives a `color`, so it renders in the
platform default rather than the brand accent. `LoadingState` also hardcodes
`minWidth: 160` and `numberOfLines={1}` on its label.

Inline/deferred loading is separately ad hoc: `savingPrefs` renders italic
`"Saving preferences…"` text; `deletingAccount` swaps link text to
`"Deleting account…"`; `saving` swaps button text and dims to `opacity: 0.7`;
`LocationAutocompleteField` shows a small spinner row. **Five different
in-progress presentations.**

### Error

| Screen | Presentation | Recovery |
| --- | --- | --- |
| Dashboard | centered `errorText` | **Retry** + **Sign Out** buttons |
| MyCharts | centered `errorText` | **none — dead end** (D-04) |
| JournalList | centered `errorText` | `Retry` text link (`#007AFF`) |
| Profile | centered `errorText` | `Retry` text link (`#007AFF`) |
| Chart (route guard) | `h1` + muted text | `Back to Dashboard` (RN core `Button`) |
| Chart (invalid TZ) | `h1` + two muted lines | **none — dead end** |
| Chart (save warning) | `errorText` inside a card | non-blocking, chart still renders (good) |
| Chart (no coordinates) | plain text in a card | "View Only" button state (good) |

Four different recovery affordances for the same conceptual state, and two dead
ends.

### Empty

| Surface | Presentation |
| --- | --- |
| MyCharts | two centered `uiStyles.muted` lines, **no CTA** |
| JournalList | one `uiStyles.muted` line (`ListEmptyComponent`), CTA is in the list header |
| Aspects | `"None (within default orbs)"` muted |
| Houses | muted sentence explaining the coordinate requirement (good copy) |
| Purchases | `"No purchases yet."` muted |
| Dashboard (no profile row) | card with a parenthetical explainer |

No empty state has an illustration, hierarchy, or (except JournalList) a
co-located action. MyCharts' empty state tells the user to "save one from the
chart screen" but does not link there.

### Destructive

`Alert.alert` with `style: 'destructive'` is used consistently for chart delete,
journal delete, and account delete — **behaviorally correct and well covered by
tests**. Journal delete is bound to `onLongPress` with **no visual affordance
that long-press is available**. Chart delete is a `Delete` text link nested
inside the row's own touchable (see D-05).

---

## 10. Existing Defects (behavioral / correctness — not redesign preferences)

These are pre-existing bugs found during the audit. They are recorded separately
so the redesign does not absorb them silently, and so fixing them is a
deliberate, reviewable choice.

**D-01 — Invisible text on the auth callback screen.**
[AuthCallbackScreen.tsx:214](client/screens/AuthCallbackScreen.tsx#L214) renders
`<Text>Verifying your account…</Text>` with **no color style**. React Native's
default text color is black; the app background is `#000`. The user sees a bare
spinner with invisible text during every deep-link verification and password
recovery. Severity: high (it is on the recovery path).

**D-02 — Primary button fails contrast.**
[Button.tsx](client/components/ui/Button.tsx) sets
`primary.backgroundColor = theme.colors.text` (`#fff`) and
`primaryText.color = theme.colors.cardBg` (`rgba(0,0,0,0.35)`) — 35%-opacity
black text on white, roughly a light grey on white. This is live on the two
default-variant buttons in the app: Dashboard's **"View Birth Chart"** and
Create Guest Chart's **"Create Chart"** — the two most important CTAs in the
product. Severity: high.

**D-03 — Android system chrome is white.**
`android:statusBarColor` `#ffffff`, `splashscreen_background` `#ffffff`,
`colorPrimaryDark` `#ffffff`, `app.json` `userInterfaceStyle: "light"`,
`splash.backgroundColor: "#ffffff"`, `adaptiveIcon.backgroundColor: "#ffffff"`.
The app launches white and runs under a white status bar. No `StatusBar`
component sets bar style anywhere. Severity: high (first-impression and
store-screenshot blocker).

**D-04 — MyCharts error state has no recovery.**
[MyCharts.tsx](client/screens/MyCharts.tsx) renders the error text with no
retry and no back control, and the in-screen header is not rendered in the
error branch — the user cannot leave the screen except via system back.
Severity: medium. The same pattern applies to Chart's invalid-timezone branch.

**D-05 — Nested touchables in the saved-chart row.**
`MyCharts` renders a `TouchableOpacity` **inside** another `TouchableOpacity`
and calls `e.stopPropagation()` on the inner press. Nested touchables are
unreliable on Android, and `stopPropagation` is not the RN responder-system
mechanism for this. Delete may fire the row-open handler, or vice versa.
Severity: medium — needs on-device confirmation.

**D-06 — Back-button touch targets are below the Android minimum.**
`MyCharts` and `JournalListScreen` wrap the `‹` glyph in a bare
`TouchableOpacity` with `width: 24` and no padding or `hitSlop` — roughly a
24x33 dp target against Google's 48x48 dp minimum. `ChartHeader`,
`ProfileHeader`, and `CreateGuestChart` use 36x36; `CompleteProfile`,
`CheckEmail`, and `JournalEditor` use 40x36. **No back control in the app meets
48dp, and `hitSlop` is used nowhere.** Severity: medium.

**D-07 — Saved-chart data is re-validated on every render.**
`MyCharts`' `renderItem` calls `validateChartData(item.chart_data)` inline, so
every list render re-runs full runtime validation of every row's chart JSON.
`renderItem` and `ItemSeparatorComponent` are also re-created inline each
render, defeating `FlatList` memoization. Severity: low-medium; scales with
saved-chart count.

**D-08 — Interpretation sheet positioning is unverified on Android.**
`InterpretationModal` uses `transparent` without `statusBarTranslucent`, then
positions the sheet absolutely at `top: insets.top + 52`. On Android a
transparent `Modal` does not extend under the status bar unless
`statusBarTranslucent` is set, so `insets.top` may be double-counted. The
existing tests assert reduced safe-area padding but run in a renderer, not on a
device. Severity: low-medium; **requires device verification, not a code
change on assumption.**

---

## 11. Ranked Redesign Findings

Ranked by user-facing impact, then by how much downstream work depends on them.

### Tier 1 — must be resolved before any screen work

**F-01 — The token layer cannot express the approved direction.**
6 colors, no background, no accent, no secondary-text color, no state
semantics, an unusable 3-token spacing scale against 18 raw values, and one
radius against 6 raw values. Near-black/navy, warm gold, ivory, and muted
slate/lavender have **no slots to occupy**. Everything else is blocked on this.

**F-02 — There is no typography system.**
No fonts loaded, 10 sizes, 4 weights, 7 line heights, and 8 competing heading
definitions for the same roles. The serif display / sans body direction requires
`expo-font`, an Android load-and-fallback strategy, and splash gating — none of
which exists.

**F-03 — The environment is flat black, not atmospheric.**
No gradient, no starfield, no navy, no depth. Cards are translucent black on
black, defined only by a 40%-white hairline. The north star's first principle
("atmospheric, not noisy") is entirely unimplemented, and the one asset that
could deliver it is disabled.

### Tier 2 — structural, resolved during primitives and app shell

**F-04 — Six ad-hoc button implementations bypass the `Button` primitive.**
`CheckEmailScreen` (`primaryBtn` / `secondaryBtn` / `linkBtn`),
`CompleteProfileScreen` (`primaryBtn` / `secondaryBtn` / `savePill`),
`JournalEditorScreen` (`savePill` / `bigSaveBtn`), `JournalListScreen`
(`newBtn`), the profile-card text links, and **React Native's core `Button`** in
`ChartScreen` and `ChartScreenContent`. Eight files use the shared `Button`;
roughly as many do not.

**F-05 — There is no action hierarchy.**
Because `Button.primary` is visually broken (D-02), **every auth screen renders
every action as `variant="ghost"`** — `Login`, `Forgot password?`, and
`Don't have an account? Sign Up` are three visually identical buttons. Dashboard
stacks one primary above a 2-column grid of **six identical ghost buttons**
(Guest Chart / My Charts / Journal / Edit Details / My Profile / Sign Out), with
destructive Sign Out styled exactly like navigation. The north star's "clear
hierarchy" principle is unmet.

**F-06 — Header architecture is duplicated and contradictory.**
Seven navigator headers configured then overridden off; seven dead titles, three
of which disagree with the rendered title; the back affordance re-implemented
six times with four geometries; no shared right-slot convention. (Section 7.)

**F-07 — Accessibility is effectively absent.**
**13 accessibility props exist in the entire app**, in only 3 files —
`TodayEnergyCard` (6), `WeeklyForecastCard` (6), `LoadingState` (1). The app
renders **42 interactive elements** (28 `TouchableOpacity`, 14 `Pressable`); the
4 inside the two guidance cards carry accessibility props and **the other 38
carry none** — no `accessibilityRole`, no `accessibilityLabel`, no
`accessibilityState`. Icon-only controls
(back `‹`, next `›`, close `✕`, chevrons) are **unlabeled glyphs** and will be
announced as punctuation. No `accessibilityLiveRegion` on error or loading text.
No focus management after navigation resets. The guidance cards are the model to
follow.

**F-08 — Two parallel card implementations.**
`Card` (component) and `uiStyles.card` (style object) define the same geometry
independently. `Card` is used by 4 files; `uiStyles.card` by ~12, including
`ChartCompass`, which then overrides its `backgroundColor` back to the same
value. Any card change must currently be made twice.

**F-09 — Dead and duplicated primitives.**
`components/ui/Screen.tsx` has **zero importers**. `AppText.TitleText` duplicates
`uiStyles.h1` exactly. `formStyles.pickerWrap` is unused (`TimeZonePicker`
inlines the same style). These should be resolved during the primitives stage,
not carried forward.

**F-10 — Text scaling is unaddressed.**
No `allowFontScaling` or `maxFontSizeMultiplier` anywhere. Combined with 16
`numberOfLines` clamps and fixed-width columns — `width: 150` in
`PlanetPositionsList` / `HousesList` / `AspectsList`, `width: 110` in `InfoRow`,
`width: 38` in the weekly rhythm row — large system font sizes will clip or
overflow the chart lists and the profile rows. `redesign-plan.md` requires
dynamic-text-fit checks; there is no current strategy.

### Tier 3 — polish, resolved during propagation and Android polish

**F-11 — Loading, error, and empty states are inconsistent.**
Four loading labels and two bare indicators; four error-recovery affordances and
two dead ends; six empty states with no shared shape. Five distinct in-progress
presentations. (Section 9.)

**F-12 — iOS system blue is the app's only accent.**
`#007AFF` appears 7 times plus `rgba(0,122,255,0.6)` as a `Switch` track — as
the link color in `ProfileHeader`, `DataPrivacyCard`, `AccountActionsCard`,
`JournalListScreen`, `ProfileScreen`, and as the `ChoiceRow` selection dot. It
is both off-brand for restrained warm gold and an iOS idiom on an Android-first
product.

**F-13 — Disabled 3D stack still ships.**
`three` 0.182.0, `@react-three/fiber` 9.5.0, `expo-gl`, `@types/three` are
installed and bundled for a component commented out of the tree. Android
APK-size and startup cost with zero delivered value in the current build.

**F-14 — Dashboard density and action hierarchy.**
Seven stacked cards/panels (Your Signs, Birth Details, Today's Energy, Weekly
Forecast, plus the 7-button action panel) with no grouping, no visual rhythm,
and no scannable entry point. Birth Details duplicates content also shown on
Profile. `paddingTop` is a fixed 40 rather than `insets.top`.
`showsVerticalScrollIndicator={false}` is set here and nowhere else. No
pull-to-refresh (`RefreshControl` is used nowhere in the app), despite
`useFocusEffect` reload with a 500 ms throttle.

**F-15 — Chart list legibility.**
`PlanetPositionsList`, `HousesList`, and `AspectsList` share a 150px monospace
left column with a 12px/16 right column, no dividers, no row-level pressed
state (only a 6%-white active fill), and no visual link between the row and the
wheel. The `fontFamily: 'monospace' as any` cast resolves to Droid Sans Mono on
Android, which is not an editorial typeface.

**F-16 — JournalEditor duplicates its save action.**
A `savePill` in the header and a `bigSaveBtn` at the bottom of the scroll, with
different geometry and different loading presentation (spinner vs. text swap).
The read-only guidance context (D2 contract) is a `Card` with no visual signal
that it is fixed and non-editable versus the editable fields below it.

---

## 12. Component Disposition

Retained means the public contract stays and only styling changes.

| Component | Disposition | Note |
| --- | --- | --- |
| `theme` | **Rebuild** | Expand to semantic roles; keep the export name |
| `uiStyles` | **Migrate then retire** | 33 consumers; retire only after all migrate |
| `formStyles` | **Merge** | Fold into the token/primitive layer |
| `AppText` family | **Retain, expand** | Becomes the typography-role surface |
| `Button` | **Retain contract, rebuild** | Fix D-02; add sizes and a destructive variant |
| `Card` | **Retain, absorb `uiStyles.card`** | Single card implementation |
| `LoadingState` | **Retain, standardize** | Labels, accent color, safe area |
| `FormField` / `TextField` | **Retain, add error state** | Field-level validation |
| `Screen` | **Delete** | Zero importers |
| `AuthContainer` | **Retain, revisit keyboard** | Android `behavior` decision |
| `DateField` / `TimeField` / `TimeZonePicker` | **Refactor onto `FormField`** | Stop re-implementing labels |
| `LocationAutocompleteField` | **Retain, rework dropdown** | Overlay + max height |
| `ChartHeader` / `ProfileHeader` | **Replace with one shared header** | Part of app shell |
| `ChartWheel` | **Restyle only** | Geometry and math untouched |
| `ChartCompass` | **Restyle, reconsider placement** | Currently below the aspects list |
| `PlanetPositionsList` / `HousesList` / `AspectsList` | **Rebuild presentation** | Shared row primitive; keep data and press contracts |
| `InterpretationModal` | **Retain mechanics, restyle** | **Do not touch the circular pager** — restored and manually verified |
| `InterpretationCard` | **Restyle** | **Do not touch sentence/paragraph splitting** — it is the clipping fix |
| `TodayEnergyCard` / `WeeklyForecastCard` | **Restyle only** | Best-built components; preserve collapse and a11y contracts |
| Profile cards (9) | **Restyle** | Replace `#007AFF`; keep `InfoRow` semantics |
| `SpaceProvider` | **Retain as-is** | Load-bearing for chart focus |
| `SpaceBackground` | **Decision required** | See section 14 |

---

## 13. What Is Still Missing

### 13.1 `design-system.md` — does not exist

`docs/ui-redesign/` currently contains only `README.md` and
`redesign-plan.md`. There is **no `design-system.md` at all**, so nothing in it
is partially complete. Per `redesign-plan.md` section 3, it must define, and
currently defines none of:

| Required | Status |
| --- | --- |
| Semantic color roles (background, surface, surface-raised, border, border-strong, text-primary, text-secondary, text-tertiary, accent, accent-muted, on-accent) | Missing |
| Concrete near-black/navy environment value(s) and whether a gradient is approved | Missing |
| Warm gold accent value and its usage rules ("restrained" needs a definition: which elements may use it) | Missing |
| Ivory primary text and muted slate/lavender secondary text values | Missing |
| Planet-accent set and where it may appear (chart only? interpretation headers? backgrounds?) | Missing — `colorForPlanet()` is a reference, not an approval |
| Spacing scale, and the mapping from the 18 raw values now in use | Missing |
| Radius scale, and the mapping from the 6 raw values now in use | Missing |
| Surface/elevation/border rules for a dark environment (no shadows on black) | Missing |
| Icon sizing and the icon strategy — **the app currently has no icon library**, only text glyphs (`‹`, `›`, `✕`, `˄`, `˅`) and emoji (`🌌`, `☀️`, `🌙`) | Missing |
| Interaction states: pressed, disabled, selected, focused | Missing |
| Semantic state colors: error, warning, success, info | Missing |
| Motion principles, **or an explicit decision that motion is out of scope for V1** | Missing |
| Contrast targets and the WCAG level being held to | Missing |

### 13.2 Typography specification — does not exist

Not yet required by the sequence (stage 4), but recorded now because stage 3
must leave room for it: display/title/section/body/supporting/label roles, line
lengths and line heights for interpretation and guidance copy, the Android font
loading and fallback strategy, the text-scaling policy, and numeric/date/orb
presentation rules (which are inconsistent today — section 5).

### 13.3 Baseline documentation gaps

| Required by `redesign-plan.md` §1 | Status |
| --- | --- |
| Current commit and verification baseline | **Now recorded** (section 1 of this document) |
| Representative Android screenshots for every active route | **Missing — nothing in the repository** |
| Compact/expanded guidance state captures | Missing |
| No-aspect and missing-house fallback captures | Missing |
| Loading / error / empty / validation / destructive / view-only captures | Missing |
| Small/large text, narrow screen, keyboard, safe-area, modal/pager captures | Missing |
| Existing defects recorded separately from redesign preferences | **Now recorded** (section 10) |

**14 routes plus the interpretation sheet, across the state matrix above, is the
outstanding baseline deliverable.** It cannot be produced from this environment;
it requires a device or emulator run.

### 13.4 Repository-hygiene gaps

- ~~**Reference image location.**~~ **RESOLVED 2026-09-02.** The north-star
  image was at `docs/reference/naksha-ui-north-star.png`; it has been moved to
  the canonical `docs/ui-redesign/reference/naksha-ui-north-star.png` and the
  now-empty `docs/reference/` directory removed. It remains untracked until the
  first redesign commit.
- **No `AGENTS.md`.** `.agents/`, `.codex/`, and `.claude/` exist;
  `.claude/settings.local.json` is the only file among them. There are no
  repository-level agent instructions.
- ~~The redesign directory has no index entry for `ui-audit.md`.~~
  **RESOLVED 2026-09-02** — `README.md`'s "Documents" list now indexes
  `ui-audit.md`, `baseline.md`, and `design-system.md`.

### 13.5 Decisions the north star implies but the plan forbids

The reference image shows a **bottom tab bar** (Home / Charts / Learn / Profile),
a **`Learn` destination**, an **"Add New Chart"** affordance on the charts list,
a **share action** on the natal chart, a **favorite/star** action, and a
**tabbed interpretation view** (Overview / Strengths / Growth / Advice).

None of these exist. All of them are **navigation-contract or product-scope
changes**, which `README.md` and the stated constraints explicitly exclude. They
are recorded here as **out of scope for the visual migration** so that the
reference is not read as an approved information architecture. The reference
should be treated as directional for **surface, hierarchy, and typography
only**.

---

## 14. Open Decisions Required Before Stage 3

1. **Atmosphere approach.** Re-enable `SpaceBackground` (GL cost, Android
   performance risk, currently unmeasured), replace it with a static or SVG
   gradient/starfield, or ship a flat near-black navy for V1? This determines
   whether `three`/`@react-three/fiber`/`expo-gl` stay in the bundle (F-13).
2. **Header architecture.** Navigator headers with a themed shared config, or
   one shared in-screen header primitive with navigator headers removed from
   `screenOptions`? Both preserve `RootStackParamList`.
3. **Icon strategy.** Stay with text glyphs and emoji, or introduce an icon set?
   The north star's iconography implies a set; this affects bundle, licensing,
   and the accessibility fix for F-07.
4. **Motion.** In or out of scope for V1? `redesign-plan.md` §3 makes motion
   tokens conditional on approval.
5. **Defect handling.** Are D-01 through D-08 fixed as part of the redesign
   slices they touch, or as a separate pre-redesign defect slice? They are
   behavioral, so folding them into visual commits makes regression review
   harder.
6. **Edge-to-edge.** Keep the Android 15 opt-out for V1, or adopt edge-to-edge
   now? This changes safe-area and keyboard work across every screen and is
   cheaper to decide before the app shell stage than after.

---

## 15. Flagship Screen Recommendation

**Recommended: the `Chart` route — `ChartScreenContent` plus
`InterpretationModal` / `InterpretationCard`.**

This matches the stated decision that the Natal Chart and interpretation are the
flagship visual slice, and it is the right validation surface on the merits:

- It exercises the **most** of the system — screen shell, header, SVG chart,
  three list surfaces, cards, a primary action with four distinct states
  (`View Only` / `Save Chart` / `Save Chart Data` / `Saved to My Charts`), an
  inline warning, a full-screen sheet, and a pager.
- It contains the **longest reading surface** in the app, so it validates the
  typography decisions that everything else inherits.
- It carries **real fallbacks to preserve**: missing coordinates (view-only),
  missing houses, no aspects, save warning, invalid time zone, unsupported
  chart version.
- It is the surface the north-star reference specifies in the most detail.

Constraints for that slice, drawn from this audit:

- Do not modify the circular pager logic in `InterpretationModal` or the
  sentence/paragraph splitting in `InterpretationCard` — both are verified
  fixes with dedicated tests.
- Do not modify `useChartData`, `useChartInterpretation`,
  `chartPageBuilders`, or `SpaceProvider`'s focus contract.
- Replace React Native's core `Button` in both `ChartScreen` and
  `ChartScreenContent` with the shared primitive as part of the slice.
- Verify D-08 (Android modal/status-bar interaction) on device during the slice
  rather than assuming it.

`ChartScreen`'s two route-guard branches must be included in the slice — they
are currently the least-designed screens in the app and one of them is a dead
end.

---

## 16. Audit Method

- Static review of all 46 UI component files, 15 active screen files, `App.tsx`,
  `navigation/types.ts`, `app.json`, and the generated Android
  `AndroidManifest.xml`, `styles.xml`, `colors.xml`, and `gradle.properties`.
- Mechanical sweeps for color literals, `StyleSheet.create` sites, primitive
  import graphs, `fontSize`/`fontWeight`/`lineHeight`/`borderRadius`/spacing
  value distributions, accessibility props, `hitSlop`, `RefreshControl`,
  `allowFontScaling`, `StatusBar`, `fontFamily`, and font loading.
- Verification baseline executed as recorded in section 1.
- **No device or emulator run was performed.** Every finding here is derived
  from source and configuration. Findings marked as requiring device
  verification (D-05, D-08, keyboard behavior, and the whole screenshot
  baseline) are explicitly not confirmed visually.
- **No application code was modified.**
