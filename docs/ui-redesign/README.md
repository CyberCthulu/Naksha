# Naksha UI/UX Redesign

Status: planning and baseline phase
Platform priority: Android first
Product baseline: D0-D6.3 complete; 25 suites / 183 tests passing

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

- `README.md`: scope, principles, and preserved contracts
- `redesign-plan.md`: controlled migration sequence and validation gates

Use `docs/naksha-codebase-handoff.md` for canonical engineering status, `docs/Feature-List.md` for product scope, and `docs/naksha-decomposition-roadmap.md` for the full Android release sequence.
