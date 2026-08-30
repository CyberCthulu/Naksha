# Naksha UI/UX Redesign Plan

Status: planning and baseline phase
Direction: Android-first, premium/celestial/editorial
Constraint: preserve current V1 behavior throughout the migration

## Migration Sequence

Proceed in this order:

baseline -> current UI audit -> design system/tokens -> typography -> primitives -> app shell -> flagship screen -> validation -> screen-by-screen propagation -> Android polish

Each stage should end with a reviewable artifact and a clear behavior-regression check. Do not begin broad screen propagation before the flagship screen validates the direction.

## 1. Baseline

Capture the state from which visual changes will be judged:

- current commit and 25-suite / 183-test verification baseline;
- representative Android screenshots for every active route;
- compact/expanded guidance states, no-aspect and missing-house fallbacks;
- loading, error, empty, validation, destructive, and view-only states;
- small/large text, narrow screen, keyboard, safe-area, and modal/pager behavior.

Record existing defects separately from redesign preferences so visual work does not accidentally redefine behavior.

## 2. Current UI Audit

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

## 3. Design System and Tokens

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

## 7. Flagship Screen

Select one representative screen after the UI audit. It should exercise enough of the system to validate the design direction, likely including content hierarchy, shared actions, loading/error states, and Android scrolling.

The screen choice and its detailed composition require explicit review; this plan does not pre-approve a Dashboard redesign or any specific layout.

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

Also perform focused Android visual/manual QA for every changed state. Automated tests protect behavior; they do not approve visual quality.

## Transition to Release Hardening

Visual completion is not store readiness. After Android polish, continue through the separately reviewable release phases in `docs/naksha-decomposition-roadmap.md`:

1. production identity/configuration and signing;
2. signed release-candidate QA;
3. privacy, retention, support, and store artifacts;
4. Google Play testing tracks and submission.

No calendar estimate is fixed here. Timing depends on design approval, device findings, release configuration, and store review.
