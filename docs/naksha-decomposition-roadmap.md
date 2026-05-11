# Naksha Decomposition Roadmap

Generated: 2026-05-09
Last updated: 2026-05-11 — marked completed slices, re-ranked remaining work.
Scope: documentation-only roadmap for large-file cleanup before feature expansion.

## 1. Purpose

Naksha has several screens, hooks, and components that mix data loading, persistence, navigation, UI layout, and domain logic. This roadmap identifies safe, independently committable decomposition slices so the codebase can become easier to extend without a broad refactor.

The goal is not to rewrite everything at once. Each slice should preserve runtime behavior, keep chart/auth/profile contracts intact, and be small enough to verify manually.

## 2. Files Reviewed

- `client/screens/ProfileScreen.tsx`
- `client/screens/DashboardScreen.tsx`
- `client/screens/CompleteProfileScreen.tsx`
- `client/screens/CheckEmailScreen.tsx`
- `client/hooks/useChartData.ts`
- `client/screens/ChartScreen.tsx`
- `client/components/charts/InterpretationModal.tsx`

## 3. Per-File Analysis

| File | Risk | Current mixed responsibilities | Best extraction candidates | Behavior that must remain unchanged | Main value |
| --- | --- | --- | --- | --- | --- |
| `ProfileScreen.tsx` | Medium | Loads profile, chart preferences, subscription, purchases; creates default preference row; renders account, birth details, preferences, billing, purchases, privacy, and sign-out. | `useProfileScreenData`, `lib/chartPreferences.ts`, `ProfileHeader`, `BirthDetailsCard`, `ChartPreferencesCard`, `SubscriptionCard`, `PurchasesCard`, `AccountActionsCard`, reusable `InfoRow`/`ChoiceRow`. | No auth metadata preference writes; default `chart_preferences` row is created/upserted; unsupported options stay disabled/coming soon. | Mostly organization, plus lower future risk for preferences and billing work. |
| `DashboardScreen.tsx` | High | Auth user lookup, user-row bootstrap, auth metadata repair, profile completion redirect, chart lookup/build/auto-save, sun/moon summary, navigation UI. | `lib/profileCompletion.ts`, `lib/dashboardChartSummary.ts`, `DashboardSignsCard`, `DashboardBirthDetailsCard`, `DashboardActions`. | Older-account repair remains; incomplete profiles still route to `CompleteProfile`; self chart opens with `chartMode: 'self'`; charts without coordinates do not save. | Reduces future auth/chart risk, but refactor carefully because the load flow is fragile. |
| `CompleteProfileScreen.tsx` | Medium | Loads user row, maps DB date/time to picker state, manages form state, validates, geocodes fallback, updates `public.users`, renders header/footer/form. | `useCompleteProfileForm`, `userRowToProfileForm`, `profileFormToUserUpdate`, `resolveBirthLocationForSave`, `CompleteProfileHeader`, `CompleteProfileFooter`. | Writes `public.users` only; manual typed location geocodes before save; OpenCage timezone can update `time_zone`; `navigation.goBack()` remains. | Reduces crash risk around date/time/geocode and prepares reuse for guest birth-data entry. |
| `CheckEmailScreen.tsx` | Medium-High | OTP UI, resend, verify, session/user confirmation, signup profile upsert, fallback profile fetch, completion routing. | `lib/profileCompletion.ts`, `lib/signupProfileBootstrap.ts`, `OtpVerificationCard`. | Resend behavior, OTP alerts, route-param profile upsert, and deterministic reset to `Dashboard` or `CompleteProfile` remain. | Reduces auth-flow drift and future profile-rule risk. |
| `useChartData.ts` | High | Saved-chart hydration, auth lookup, canonical chart lookup, render-only charts, self auto-save, guest manual save, alerts, chart state. | `lib/chartPersistence.ts`, `hydrateChartData`, `findSavedChartByIdentity`, `saveBuiltChart`, later `useChartLoader`/`useChartSaveAction`. | `fromSaved` path stays valid; self charts can auto-save; guest charts do not auto-save; missing-coordinate charts stay view-only. | High future feature value, but high regression risk without tests. |
| `ChartScreen.tsx` | Medium | Route guard, timezone validation, chart hook wiring, focus side effect, save button state, chart layout, page building, modal wiring. | `ChartScreenContent`, `ChartSaveControl`, `ChartViewOnlyNotice`, `useChartInterpretationPages`, `ChartBody`. | Invalid route empty state, saved chart flow, save button labels, initial Sun focus, and interpretation modal behavior remain. | Reduces crash/hook-order risk and prepares guest chart UI. |
| `InterpretationModal.tsx` | Medium | Modal shell, duplicate interpretation types, circular pager index math, previous/next controls, close/backdrop, page rendering. | Import shared `interpretationTypes`, `useCircularPager`, `InterpretationModalHeader`, `InterpretationPager`. | Circular swipe, first/last wrap, disabled arrows for one page, and close/reopen reset remain. | Mostly organization, with some pager edge-case risk reduction. |

## 4. Ranked Roadmap

### ✅ DONE

1. **ProfileScreen presentational split (Slice 1A)**
   - Extracted display cards: `ProfileHeader`, `BirthDetailsCard`, `SubscriptionCard`, `PurchasesCard`, `DataPrivacyCard`, `InfoRow`.
   - Supabase calls and preference save handlers remain in `ProfileScreen`.

2. **ProfileScreen interactive card extraction (Slice 1B)**
   - Extracted `ChartPreferencesCard`, `ChoiceRow`, `AccountActionsCard` (composing `DataPrivacyCard` + sign-out).
   - `onUpdatePrefs` callback passed as prop; no Supabase logic moved to components.

3. **Shared profile completion helpers**
   - `client/lib/profileCompletion.ts`: `isProfileComplete`, `needsProfileCompletion`, `profileFromAuthMetadata`, `ProfileCompletionData`.
   - Used by both `DashboardScreen` and `CheckEmailScreen`.

4. **ChartScreen shell/content split**
   - `ChartScreen.tsx`: route guard + timezone validation only.
   - `ChartScreenContent.tsx`: all hooks (`useChartData`, `useChartInterpretation`, `useSpace`) and rendering.
   - Passed props: `profile`, `chartMode`, `fromSaved`, `saved`, `tz`.

---

### REMAINING (re-ranked)

- **Next stabilization slice: Runtime `chart_data` validation** *(reduces crash risk from schema-drifted rows)*
   - Add `parseChartData(json)` validator in `client/lib/chartValidation.ts`.
   - Replace bare `as ChartData` casts in `useChartData` and `MyCharts`.
   - Return `null` on shape mismatch; render a recoverable error state.
   - Do this before further `useChartData` refactors so the safety net exists first.

- **Following stabilization slice: Test runner setup** *(foundational; enables safe refactoring of remaining large files)*
   - Add `jest` + `@testing-library/react-native`.
   - Cover: `profileCompletion`, `buildChartData`, `saveChart` guard, `useChartData` self/guest/view-only, OTP navigation, `upsertJournal` create-mode.
   - Must exist before touching `useChartData`, `DashboardScreen`, or `CompleteProfileScreen`.

- **Later stabilization slice: Auto-save failure visibility** *(UX; low-effort, high trust value)*
   - In `useChartData` auto-save catch block, emit an alert or set a degraded save-state flag.
   - No schema change needed.

- **Later hardening slice: AuthCallback handling review** *(auth reliability)*
   - Clean up verbose logging.
   - Review `handledOnce` guard for delayed/retried deep-link URLs.
   - Align profile completion rules with `CheckEmailScreen`.

- **Later decomposition slice: CompleteProfile form/save helpers** *(medium; groundwork for guest birth-data entry)*
   - Extract DB-to-form mapping, form-to-update payload, and manual geocode-before-save logic.
   - Requires test runner setup first to verify behavior is preserved.

- **Later decomposition slice: Dashboard chart summary extraction** *(medium; reduces DashboardScreen coupling)*
    - Extract saved-chart lookup/build/sun-moon summary after profile helper extraction is stable.
    - Requires test runner setup first.

- **Later decomposition slice: InterpretationModal pager extraction** *(low; organizational)*
    - Move circular pager calculations and refs into a `useCircularPager` hook.
    - Import the existing shared interpretation types instead of defining duplicates.

- **Deferred high-risk slice: useChartData persistence split** *(deferred; high regression risk)*
    - Extract persistence and hydration helpers before considering a larger hook split.
    - Must wait for test coverage and `chart_data` validation to be in place.

## 5. Completed Slices (Summary)

**Slice 1A — ProfileScreen presentational extraction** ✅
Extracted `ProfileHeader`, `BirthDetailsCard`, `SubscriptionCard`, `PurchasesCard`, `DataPrivacyCard`, `InfoRow`. Supabase calls, `onUpdatePrefs`, `onSignOut`, and navigation handlers remained in `ProfileScreen`.

**Slice 1B — ProfileScreen interactive card extraction** ✅
Extracted `ChartPreferencesCard`, `ChoiceRow`, `AccountActionsCard`. `onUpdatePrefs` passed as prop. No Supabase logic moved to components. `ProfileScreen` is now 312 lines.

**Shared profileCompletion helpers** ✅
`client/lib/profileCompletion.ts` created with `isProfileComplete`, `needsProfileCompletion`, `profileFromAuthMetadata`, and `ProfileCompletionData`. Both `DashboardScreen` and `CheckEmailScreen` import from there. Dashboard repair behavior and CheckEmail navigation behavior unchanged.

**ChartScreen shell/content split** ✅
`ChartScreen.tsx` retains only route guard (missing birth fields) and timezone validation. `ChartScreenContent.tsx` owns all hooks and rendering after both guards pass. `profile`, `chartMode`, `fromSaved`, `saved`, and `tz` passed as props.

## 6. Next Safe Slice

**Next stabilization slice: Runtime `chart_data` validation**

Add `parseChartData(json): ChartData | null` in `client/lib/chartValidation.ts`. Replace bare `as ChartData` casts in `useChartData` (saved-chart load path) and `MyCharts`. Return `null` on shape mismatch and render a recoverable error state. This is a small, targeted change with no behavior impact on valid data, and it makes subsequent `useChartData` refactoring safer.

Followed immediately by the test runner setup slice before touching `useChartData`, `DashboardScreen`, or `CompleteProfileScreen`.

## 7. Deferred / High-Risk Refactors

- Full `useChartData` rewrite or state-machine conversion.
- Moving the entire `DashboardScreen.load` flow into a hook in one pass.
- Reworking `CheckEmailScreen` OTP/session/upsert flow beyond shared helper extraction.
- Changing `CompleteProfileScreen` geocode/timezone/save sequencing without focused tests.
- Adding guest chart schema fields such as `chart_type`, `is_primary`, `relationship_label`, or a `birth_profiles` table.
- Reworking subscriptions, purchases, account deletion, or exports before those features are product-ready.
- Reworking `InterpretationModal` circular pager behavior without checking first/last/single-page cases.

## 8. Do Not Touch Without Tests

These areas have no test coverage and are high-regression risk. Do not do high-risk refactors here until the test runner setup slice is complete:

- `useChartData` auto-save/manual-save/canonical lookup behavior.
- `DashboardScreen` profile repair and self chart auto-save behavior.
- `CheckEmailScreen` OTP verification and deterministic navigation reset.
- `CompleteProfileScreen` manual geocode, timezone normalization, and `public.users` update lifecycle.
- `InterpretationModal` circular pager logic.
- Canonical chart identity and save behavior:
  - self charts with coordinates may auto-save;
  - guest charts do not auto-save;
  - guest charts can be manually saved when coordinates exist;
  - missing-coordinate charts remain view-only.
- `AuthCallbackScreen` deep-link handling and `handledOnce` guard.
- `upsertJournal` create-mode with `id: undefined`.

## 9. Verification Baseline

Run after every implementation slice:

```bash
cd client && npm run typecheck
```

Manual verification should match the touched surface:

- Profile slices: load Profile, edit birth details, return to Profile, confirm preferences still show default supported values and disabled coming-soon options.
- Dashboard slices: load with a complete profile, load with an incomplete profile, confirm Dashboard routes to `CompleteProfile` only when required fields are missing.
- Chart slices: open self chart from Dashboard, open saved chart from My Charts, open chart without coordinates and confirm `View Only`.
- Guest chart slices: confirm guest charts do not auto-save before tapping save, and missing-coordinate guest charts do not persist.
- CheckEmail slices: verify OTP success, resend, missing email/code alerts, profile-complete route to Dashboard, incomplete route to CompleteProfile.
- CompleteProfile slices: save with selected autocomplete coordinates, save with manual typed location that needs geocoding, save with invalid/missing fields.
- Interpretation slices: open planet modal, open house modal, swipe first-to-last and last-to-first, test one-page/empty-page behavior where possible.
