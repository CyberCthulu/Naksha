# Naksha UI/UX Redesign

Status: audit accepted; design system proposed; implementation not started
Platform priority: Android first
Product baseline: D0-D6.3 complete; 25 suites / 183 tests passing
Visual reference: `reference/naksha-ui-north-star.png`

## Purpose

This directory governs a controlled visual migration of the implemented Naksha V1. The product behavior is already substantial and tested; redesign work should improve clarity, hierarchy, consistency, accessibility, and perceived quality without quietly changing astrology, persistence, navigation, or account behavior.

The intended direction is premium, celestial, and editorial. Visual references are directional rather than pixel-perfect, and no palette, typeface, token values, component geometry, or animation system should be treated as approved until it is reviewed through the redesign process.

## Non-Negotiable Product Loops

The migration must preserve:

- signup, OTP/callback verification, login, session restore, password recovery, and account deletion;
- profile completion/editing, birth location/coordinates/time zone, and invalid-timezone correction;
- self, saved, guest, and missing-coordinate chart behavior;
- chart wheel, positions, houses, aspects, and interpretation navigation;
- Today’s Energy and Weekly Forecast semantics, collapse controls, transit-house context, and fallbacks;
- fixed-context guidance-to-journal handoff and journal create/edit/list/delete;
- saved-chart lookup failure handling, legacy hydration, and ChartData version compatibility.

## Scope

The visual migration covers the active V1 screens, app shell, typography, shared primitives, content hierarchy, loading/error/empty states, and Android interaction polish. It does not authorize changes to chart math, guidance builders, database schema, route structure, journal persistence, or product scope.

Android production configuration, signing, release-candidate QA, privacy/support work, and Google Play submission follow the visual migration as release-hardening phases. They are adjacent to this work but should remain separately reviewable.

iOS is intentionally later.

## Binding Decisions

Accepted 2026-09-02, after the UI audit. These govern all subsequent slices.

### Reference image scope

`reference/naksha-ui-north-star.png` is **directional for atmosphere, surfaces, typography, spacing, and information hierarchy only.**

The redesign does **not** authorize, and the reference must not be read as approving:

- a bottom-tab navigation contract;
- a `Learn` destination;
- share or favorite functionality;
- new routes;
- new product features;
- transit information inside natal interpretations.

The reference's tabbed interpretation design (Overview / Strengths / Growth / Advice) is **not** to be reproduced.

### Interpretation modal

For the first flagship implementation, the interpretation modal preserves unchanged:

- its route and callbacks;
- its data and content;
- circular pager behavior;
- sentence-splitting and the clipping fix;
- its existing tests.

Its visual hierarchy may be redesigned later. Its interaction behavior does not change in the first flagship slice.

### Atmosphere

V1 atmosphere is: deep navy base, lightweight static gradients, sparse static/SVG celestial detail, quiet/atmospheric/hero intensity variants, and a flat navy fallback.

No `three`, no `expo-gl`, no particle system, and no continuous GPU effect. Existing dependencies are used where practical — `react-native-svg` is already present and is sufficient.

The dormant GL dependencies are **not** removed until all references and configuration are checked in a later isolated cleanup. `SpaceProvider` remains live and load-bearing for chart focus; only `SpaceBackground` is dormant.

### Icon system

`lucide-react-native` is the functional UI icon system. It may be proposed now and is installed in the implementation slice that first needs it (Slice 4). Import icons individually where practical, rather than as a barrel, to keep the bundle proportionate.

Astrology and zodiac glyphs (`☉ ☽ ♈` and the rest) are **preserved as meaningful celestial symbols** — they are content, not chrome.

Emoji and text glyphs are **not** used for functional controls. The Dashboard's decorative emoji (`🌌 ☀️ 🌙`) are replaced with standardized icons during the Dashboard redesign slice, not before.

### App shell and edge-to-edge

The app uses **one shared in-screen header primitive**. Navigator headers and in-screen headers are never displayed simultaneously.

Native-stack routing, transitions, route names, parameters, linking, and Android hardware-back behavior remain unchanged.

**Android edge-to-edge is adopted during Slice 5.** The current opt-out (`edgeToEdgeEnabled=false`, `android:windowOptOutEdgeToEdgeEnforcement=true`) is removed only when the shared shell, safe-area handling, status and navigation bars, keyboard behavior, scrolling content, and modal insets are implemented together and tested as one change.

### Typography foundation

`expo-font` and `expo-splash-screen` are **approved** for the typography foundation. They are installed in Slice 3, not before.

**Cormorant Garamond SemiBold** is the provisional display serif, to be validated on Android. **EB Garamond** remains the fallback if Cormorant shows poor legibility or rendering at heading sizes.

### Pre-existing defects

D-01 through D-07 belong to a **separate pre-redesign defect-hardening series**, not to visual redesign commits. D-08 is an Android QA investigation and receives no code change until it is reproduced or verified on a device. See `baseline.md` §4.

### Test determinism

Jest is stabilized by capping workers (`maxWorkers: 2`), verified from a cleared cache, rather than by first raising the global timeout. See `baseline.md` §3.

## Product Boundaries

The following are post-V1 possibilities, not redesign deliverables:

- synastry or reusable relationship profiles;
- AI chat or provider integration;
- notifications;
- subscriptions or reports;
- dedicated shadow-work cycles/milestones;
- additional astrology or house systems;
- retrogrades, lunar phases, exact transit windows, or additional moving planets.

## Documents

- `README.md`: scope, principles, binding decisions, and preserved contracts
- `redesign-plan.md`: controlled migration sequence, validation gates, and the implementation slice queue
- `ui-audit.md`: accepted findings, ranked problems, pre-existing defects, and component disposition
- `baseline.md`: commit and verification baseline, defect register, and the Android screenshot / device-QA checklist
- `design-system.md`: proposed tokens, typography, primitives, and background variants — **proposed, not approved**
- `reference/naksha-ui-north-star.png`: directional visual reference

Use `docs/naksha-codebase-handoff.md` for canonical engineering status, `docs/Feature-List.md` for product scope, and `docs/naksha-decomposition-roadmap.md` for the full Android release sequence.
