# Naksha UI/UX Redesign Plan

Status: stages 1-2 complete; stage 3 proposed and awaiting approval; no implementation started
Direction: Android-first, premium/celestial/editorial
Constraint: preserve current V1 behavior throughout the migration
Binding decisions: see `README.md` "Binding Decisions" (accepted 2026-09-02)

## Migration Sequence

Proceed in this order:

baseline -> current UI audit -> design system/tokens -> typography -> primitives -> app shell -> flagship screen -> validation -> screen-by-screen propagation -> Android polish

Each stage should end with a reviewable artifact and a clear behavior-regression check. Do not begin broad screen propagation before the flagship screen validates the direction.

## 1. Baseline — documentarily complete, visually incomplete

Recorded in `baseline.md`: branch `main`, commit `deaae7e6`, verification results, the cold-cache Jest flake and its remedy, the D-01 to D-08 defect register, the Android screenshot checklist, and device-QA requirements.

**Outstanding:** the screenshot captures and device QA themselves. They require a device or emulator and are the gating dependency for the flagship review.

Capture the state from which visual changes will be judged:

- current commit and 25-suite / 183-test verification baseline;
- representative Android screenshots for every active route;
- compact/expanded guidance states, no-aspect and missing-house fallbacks;
- loading, error, empty, validation, destructive, and view-only states;
- small/large text, narrow screen, keyboard, safe-area, and modal/pager behavior.

Record existing defects separately from redesign preferences so visual work does not accidentally redefine behavior.

## 2. Current UI Audit — complete and accepted

Delivered in `ui-audit.md` and accepted 2026-09-02 as the planning baseline. It inventories 14 routes plus the interpretation sheet and 46 shared UI files, ranks 16 findings across three tiers, records 8 pre-existing defects separately from redesign preferences, and assigns a disposition to every shared component.

Audit the active V1 experience before choosing solutions:

- information hierarchy and repeated content;
- typography, spacing, color, border, elevation, and icon inconsistency;
- mixed shared-primitives versus inline styling;
- touch targets, focus order, labels, contrast, and dynamic text fit;
- loading/error state consistency, including navigation transitions;
- Dashboard density and action hierarchy;
- chart legibility and interpretation reading flow;
- JournalEditor context/response distinction;
- auth/profile form ergonomics on Android.

The audit should rank user-facing problems and identify which existing components can be retained.

## 3. Design System and Tokens — proposed, awaiting approval

Delivered in `design-system.md` as a **proposal**. It extends the existing `theme.ts`, `uiStyles.ts`, `AppText`, `Button`, `Card`, `LoadingState`, `FormField`, and `TextField` rather than introducing a parallel V2 library, and it maps every existing token key and style onto its replacement.

Open questions are listed in `design-system.md` §15. Nothing is implemented until those are settled and Slice 2 is authorized.

After the audit and visual review, approve the minimum token contract needed for implementation:

- semantic color roles;
- spacing scale;
- surface, border, radius, and elevation rules;
- icon sizing and interaction-state rules;
- motion principles only if motion is approved;
- loading, error, warning, success, and disabled semantics.

Do not encode speculative future brands, astrology systems, themes, or platform abstractions.

## 4. Typography

Approve typography before rebuilding content-heavy components:

- display, screen title, section title, body, supporting, and label roles;
- readable line lengths and line heights for interpretation/guidance copy;
- Android font loading and fallback behavior;
- text scaling, wrapping, and clipping checks;
- numeric/date/orb presentation where relevant.

The guidance cards, chart lists, interpretations, and journal context should share a coherent reading hierarchy.

## 5. Primitives

Migrate the smallest shared layer before individual screens:

- text roles;
- buttons and icon buttons;
- cards/surfaces;
- fields, validation, and selection controls;
- loading/error/empty indicators;
- dividers, list rows, and destructive confirmations;
- modal/sheet shell where the existing interaction permits it.

Preserve component behavior and props unless a reviewed accessibility or UX fix requires a narrow contract change. Avoid a parallel component library that leaves old and new primitives indefinitely mixed.

## 6. App Shell

Apply approved foundations to the app-level experience:

- root background and safe-area behavior;
- stack headers and route transitions without changing route names/contracts;
- keyboard and system-bar behavior;
- consistent screen gutters and vertical rhythm;
- coherent loading and navigation-progress presentation.

The typed `RootStackParamList` and current deep-link/auth callback behavior remain intact.

## 7. Flagship Screen — selected

**The flagship slice is the Natal Chart route plus the interpretation sheet/modal.** Selected 2026-09-02.

It must preserve chart calculations, chart data, chart-wheel behavior, positions, houses, aspects, saved-chart behavior, navigation, persistence, and Supabase behavior.

The interpretation modal preserves its route, callbacks, data, content, circular pager behavior, sentence-splitting and clipping fix, and existing tests. Its visual hierarchy may be redesigned later; its interaction behavior does not change in this slice. The reference image's tabbed interpretation design is not reproduced.

Its detailed composition still requires explicit review. This plan does not pre-approve any specific layout.

For the chosen screen:

- implement approved tokens, typography, primitives, and shell patterns;
- preserve all existing data, state, callbacks, accessibility contracts, and fallbacks;
- compare against the baseline on representative Android sizes;
- capture decisions that should propagate and exceptions that should remain local.

## 8. Validation Gate

Before propagating the design:

- review visual direction and content hierarchy on-device;
- verify text fit, keyboard behavior, touch targets, scrolling, safe areas, and accessibility labels;
- run typecheck, tests, lint, and `git diff --check`;
- exercise the flagship screen's complete functional path;
- confirm no chart, guidance, journal, auth, persistence, or navigation semantics changed unintentionally.

Revise foundations here rather than compensating screen by screen later.

## 9. Screen-by-Screen Propagation

Propagate approved patterns in small, independently verifiable slices. Final order should follow the UI audit; a practical inventory is:

- auth and recovery screens;
- profile completion and profile/account controls;
- Dashboard and guidance cards;
- chart shell, wheel/list surfaces, and interpretation modal;
- saved charts and guest chart creation;
- journal list and fixed-context JournalEditor.

For each screen, include its loading, error, empty, validation, destructive, and narrow-screen states. Do not limit review to the happy path.

## 10. Android Polish

After all active screens use the approved system:

- test representative Android screen sizes and supported OS versions;
- verify status/navigation bars, keyboard avoidance, back behavior, gestures, safe areas, and modal layering;
- inspect dynamic text scaling and the longest real guidance/house strings;
- verify chart SVG and pager rendering on release builds;
- remove obsolete styles/assets only after confirming they have no remaining callers;
- capture final store-quality screenshots after release-candidate styling is stable.

## Verification Per Slice

Run:

```bash
cd client
npm run typecheck
npm test
npm run lint
cd ..
git diff --check
```

The test gate is only meaningful once Slice 0 lands. Until then, `npm test` can fail with 5000 ms timeouts on a cold cache while the product is healthy — see `baseline.md` §3. Do not read a cold-cache timeout as a regression, and do not raise the global timeout to hide it.

Also perform focused Android visual/manual QA for every changed state. Automated tests protect behavior; they do not approve visual quality.

## Implementation Slice Queue

Prepared 2026-09-02. **Not executed.** Each slice is independently reviewable and ends at a gate. No slice begins before its predecessor's gate passes.

### Slice 0 — Deterministic Jest configuration

Scope: `client/jest.config.js` only. Add `maxWorkers: 2`.
Not in scope: raising `testTimeout`; changing any test; changing any application code.
Gate: `npx jest --clearCache`, then `npm test` passes 183/183 on the **first** run, repeated from a cleared cache at least twice. If it does not, escalate to a documented `testTimeout` increase as a second, separate step.
Why first: every later slice uses this suite as its regression gate.

### Slice 1 — Pre-redesign defects

Scope: D-01 through D-06, as narrow behavioral fixes with **no visual redesign**.

- D-01: give the auth-callback text an explicit color.
- D-02: correct `Button` primary foreground/background roles.
- D-03: align splash, status bar, and interface style with the **existing** dark application, using the already-present `expo-status-bar`. Not the new palette — that is Slice 2.
- D-04: give the MyCharts error branch a recovery action.
- D-05: resolve the nested touchables in the saved-chart row. **Confirm the actual misbehavior on a device before choosing the fix shape.**
- D-06: bring back-button touch targets to 48 dp via `hitSlop`, and label them.

Not in scope: D-07, which is a separate engineering/performance change with focused verification; D-08, which is an Android QA investigation with no code change until reproduced on a device; any token, typography, or layout change.
Gate: full verification, plus device confirmation of D-01, D-02, and D-03.

### Slice 2 — Design tokens — **COMPLETE**

Scope: expand `components/ui/theme.ts` to the approved semantic roles, keeping all six existing keys as deprecated aliases so no consumer breaks. Add `Background` with the quiet/atmospheric/hero/flat variants using the already-present `react-native-svg`. Add reduced-motion detection at the root.
Not in scope: typography; component restyling; deleting `uiStyles`; removing the dormant GL dependencies.
Gate: full verification; no visual regression against the baseline screenshots; alias removal deferred.

**Delivered.** `theme.ts` now carries the full V2 semantic layer — background, surface, border, text, accent, state, planet, scrim, space, radius, elevation, icon, touch-target, and motion-budget tokens. `Background.tsx` implements the four static variants on `react-native-svg` with deterministic star positions. `useReducedMotion.tsx` provides the tri-state preference hook and an optional root provider.

**Deliberately not delivered — no screen has migrated.** Every V1 compatibility key keeps its exact pre-V2 value; none is aliased to a V2 role, so importing the token layer repaints nothing. `Background` is created but not applied anywhere; global application belongs to Slice 5. 35 files still consume `theme.colors.*` and are visually unchanged.

### Slice 3 — Typography — **IMPLEMENTED, pending Cormorant Android visual approval**

Scope: install the approved `expo-font` and `expo-splash-screen`; bundle font assets; `useFonts` with splash gating and a mandatory fallback path; the typography roles in `AppText`.
Display serif: **Cormorant Garamond SemiBold**, provisional. Validate on Android at `heading` size and above. If legibility or rendering is poor, **replace** it with the pre-approved EB Garamond — a finding to record, not a decision to re-open. **Do not install EB Garamond alongside Cormorant.** Only one serif ships.
Not in scope: applying roles across screens; that is Slices 4-6.
Gate: full verification; **release-build** font verification on device; confirmed graceful fallback when font loading fails or exceeds the 3 s budget; explicit Cormorant/EB Garamond determination recorded.

**Delivered.** `theme.typography` carries all eleven approved roles with their families, sizes, line heights, tracking, uppercase transform, and tabular figures. `useAppFonts` loads exactly four families through `expo-font`, holds the native splash, and releases it on success, failure, or a 3-second timeout. `AppText`, `MutedText`, and `TitleText` gained an opt-in `variant` prop.

**Not delivered — no screen has migrated.** Omitting `variant` preserves the exact V1 appearance, so the eleven files using these components are visually unchanged. Exactly one existing element opts in — the Dashboard greeting — so Cormorant can be judged in Expo Go without redesigning anything.

**Open gate: Cormorant Garamond has not been seen on an Android device.** Slice 3 cannot be signed off until it is. If it reads poorly at `heading` size and above, the pre-approved replacement is EB Garamond; that swap is a finding, not a reopened decision.

Deferred to a development build: the runtime `useFonts` path is what Expo Go supports. The `expo-font` config plugin was added to `app.json` by the installer and is inert until a prebuild happens.

### Slice 4 — Primitives — **IMPLEMENTED**

Scope: install `lucide-react-native` (peer-depends on the already-present `react-native-svg`) and add the `Icon` primitive enforcing the size, stroke, and accessibility policy — **all icons render through it**, never raw in a screen; `Button` variants and sizes; `Card` absorbing `uiStyles.card`; `FormField` / `TextField` error and focus states; standardized `LoadingState`; new `ErrorState`, `EmptyState`, `Stack`; delete the zero-importer `Screen.tsx`; delete the unused `formStyles.pickerWrap`.
Icons are imported individually where practical, never as a barrel. Accessibility labels go on the `Pressable`/`Button`, never on the decorative icon; `Icon` is hidden from assistive technology by default. Astrological and zodiac glyphs stay as text — they are content, not chrome. Emoji are never functional controls.
Touch targets: every standard interactive control gets an actual or enclosing `Pressable` of at least 48 dp. The `sm` button's 40 dp visual sits inside a 48 dp touch area. `hitSlop` is not a substitute.
Not in scope: migrating screens onto the new primitives; replacing Dashboard decorative emoji, which belongs to the Dashboard redesign slice.
Gate: full verification; every new and changed primitive meets the accessibility requirements in `design-system.md` §10; every icon-only control carries an `accessibilityLabel`.

**Delivered.** `Icon` wraps sixteen individually imported Lucide glyphs behind a semantic name map and is the only file permitted to import Lucide. `Button` gained the five approved variants plus `ghost` as an alias for `secondary`, three sizes, and a loading state, all inside a guaranteed 48 dp touch area. `Card` moved to the opaque surfaces with `default`/`raised`/`selected`. `FormField` and `TextField` gained label, hint, error, focus, and disabled semantics. `LoadingState` moved to semantic typography and an accent indicator. `ErrorState`, `EmptyState`, and `Stack` are new. `Screen.tsx` was deleted after re-confirming zero importers.

**Not delivered — no feature screen was migrated.** Existing callers were left untouched, so several now render V2 primitives inside V1 screens. Those inconsistencies are expected and are resolved during screen propagation, not here.

**Known temporary inconsistencies, for later screen migration:**

- Dashboard's error branch has two default-variant Buttons, so it now shows two gold primary actions; one of them is Sign Out, which should be destructive. Both are call-site fixes for the Dashboard slice.
- Cards on the Dashboard, guidance cards, and the Journal editor are now opaque navy against screens that are still pure black.
- Auth screens render V2 fields and gold-free secondary buttons inside otherwise V1 layouts.
- `uiStyles.card` still has sixteen callers and is untouched; `Card` and `uiStyles.card` therefore look different until those migrate.
- `formStyles.ts` is now orphaned — `TextField` was its last consumer. It is deliberately retained, as retiring it is out of scope for this slice.

### Slice 5 — App shell and edge-to-edge

This slice is deliberately larger than its neighbours: **adopting edge-to-edge piecemeal is what makes it expensive.** The shell and the inset model change together, once.

Scope, implemented and tested as **one** change:

- `ScreenHeader` — the single shared in-screen header primitive, replacing six ad-hoc top rows. Navigator headers and in-screen headers are **never shown simultaneously**. Policy in `design-system.md` §11A: flexible title area, title may wrap to two lines, no absolute positioning that can overlap actions, 48 dp back target, at-least-48 dp right target, Edit/Save may remain text actions, and the header expands safely under Android font scaling.
- Adopt Android edge-to-edge: remove `edgeToEdgeEnabled=false` and `android:windowOptOutEdgeToEdgeEnforcement`.
- Safe-area handling across every screen; screen top padding driven by `insets.top`, never a fixed 40.
- Status and navigation bar treatment.
- Keyboard behavior — including a real Android path, since `KeyboardAvoidingView` is currently a no-op there.
- Scrolling content insets.
- Modal insets, including the `InterpretationModal` sheet and its `statusBarTranslucent` posture. **This is where D-08 is resolved** — by then it is a design requirement, not an open QA question.
- Root background wiring for the §6 variants.

Unchanged: native-stack routing, transitions, `RootStackParamList`, route names, parameters, linking config, the auth/unauthenticated stack split, and Android hardware-back behavior.

Not in scope: per-screen visual redesign.

Gate: full verification; on-device verification of status and navigation bars, keyboard on every form, safe areas in both gesture and 3-button navigation, modal insets, and hardware-back; deep-link and auth-callback routing re-verified; **the opt-out is removed only once all of the above pass together.**

### Slice 6 — Natal Chart and interpretation flagship

Scope: the Chart route and the interpretation sheet, including both `ChartScreen` route-guard branches and the replacement of React Native's core `Button` in `ChartScreen` and `ChartScreenContent`.
Preserve: chart calculations, chart data, chart-wheel behavior, positions, houses, aspects, saved-chart behavior, navigation, persistence, Supabase behavior; and the interpretation modal's route, callbacks, data, content, circular pager behavior, sentence-splitting/clipping fix, and existing tests.
Not in scope: the reference's tabbed interpretation design; transit information inside natal interpretations; any new route or feature.
Gate: the full validation gate in stage 8 above, compared against the baseline screenshots, on device.

### Later — Dashboard redesign slice

Not sequenced here; it belongs to stage 9 propagation. Recorded now because it owns one deferred item: **replacing the Dashboard's decorative emoji** (`🌌` in the welcome heading; `☀️` / `🌙` in the "Your Signs" card) with standardized icons. The Sun and Moon rows specifically become the astrological glyphs `☉` and `☽`, matching what `ChartWheel` and `ChartCompass` already render.

## Transition to Release Hardening

Visual completion is not store readiness. After Android polish, continue through the separately reviewable release phases in `docs/naksha-decomposition-roadmap.md`:

1. production identity/configuration and signing;
2. signed release-candidate QA;
3. privacy, retention, support, and store artifacts;
4. Google Play testing tracks and submission.

No calendar estimate is fixed here. Timing depends on design approval, device findings, release configuration, and store review.
