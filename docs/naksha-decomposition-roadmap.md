# Naksha Decomposition Roadmap

Generated: 2026-05-09
Last updated: 2026-05-11 — marked stabilization fixes complete, re-ranked remaining test/refactor work.
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
| `useChartData.ts` | High | Saved-chart hydration, `chart_data` validation handling, auth lookup, canonical chart lookup, render-only charts, self auto-save, guest manual save, save warnings, async cancellation guards, alerts, chart state. | `lib/chartPersistence.ts`, `hydrateChartData`, `findSavedChartByIdentity`, `saveBuiltChart`, later `useChartLoader`/`useChartSaveAction`. | `fromSaved` path stays valid; self charts can auto-save; guest charts do not auto-save; missing-coordinate charts stay view-only; save warnings and cancellation behavior remain. | High future feature value, but high regression risk without focused hook tests. |
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

5. **Runtime `chart_data` validation**
   - Added `client/lib/chartDataValidation.ts` with `parseChartData`.
   - Persisted chart reads in `useChartData`, `MyCharts`, and `DashboardScreen` validate JSON before use.

6. **Test runner setup**
   - Added Jest/Expo config and `npm test`.
   - Initial pure-helper tests cover `profileCompletion`, `chartDataValidation`, and journal upsert payload behavior.

7. **Auto-save failure visibility**
   - `useChartData` exposes `saveWarning`.
   - `ChartScreenContent` shows an inline warning when self chart auto-save fails, while the chart remains visible.

8. **AuthCallback handling hardening**
   - URL processing now deduplicates real callback URLs without permanently blocking later URL events when no initial URL exists.
   - Raw URL/token logs and step-by-step success logs were removed; real failures use warnings and user-visible alerts.

9. **Journal create-mode payload fix**
   - `upsertJournal` omits `id` when creating a new journal entry and preserves it for updates.
   - Tests cover create/update payload behavior and `chart_id` preservation.

10. **useChartData async cancellation guard**
    - Added mounted/current-operation guards for async chart load and save work.
    - Stale loads and post-unmount saves no longer update React state or show stale alerts.

11. **CompleteProfile top spacing polish**
    - Removed duplicate safe-area padding from the in-screen header.
    - Shared `AuthContainer` remains responsible for safe-area top padding.

12. **Chart generation and persistence helper tests**
    - `lib/__tests__/charts.test.ts` added.
    - Covers `buildChartData` shape with and without coordinates, `saveChart` coordinate guard, canonical upsert payload/onConflict, and Supabase error propagation.

13. **Auth/profile navigation screen tests**
    - `screens/__tests__/CheckEmailScreen.test.tsx` and `screens/__tests__/AuthCallbackScreen.test.tsx` added.
    - Covers missing email/code validation, resend success/failure, OTP complete/incomplete profile resets, AuthCallback token/code/fragment paths, delayed URL handling, and auth error alert plus finish routing.

---

### REMAINING (re-ranked)

- **Next test slice: Dashboard profile repair and chart summary** *(remaining high-risk screen logic)*
   - Cover complete-profile load, incomplete-profile redirect, auth metadata repair, saved chart summary hydration, invalid saved `chart_data` fallback, self chart auto-save, and missing-coordinate no-save behavior.
   - Do this before extracting Dashboard chart summary or profile repair helpers.

- **Next test slice: CompleteProfile save/geocode lifecycle** *(profile source-of-truth reliability)*
   - Cover load/prefill, missing field validation, selected-coordinate save, manual geocode fallback, timezone update from geocode, and `public.users` update payload.

- **Later decomposition slice: CompleteProfile form/save helpers** *(medium; groundwork for guest birth-data entry)*
   - Extract DB-to-form mapping, form-to-update payload, and manual geocode-before-save logic.
   - Requires focused save/geocode tests first to verify behavior is preserved.

- **Later decomposition slice: Dashboard chart summary extraction** *(medium; reduces DashboardScreen coupling)*
    - Extract saved-chart lookup/build/sun-moon summary after profile helper extraction is stable.
    - Requires focused Dashboard/useChartData tests first.

- **Later decomposition slice: InterpretationModal pager extraction** *(low; organizational)*
    - Move circular pager calculations and refs into a `useCircularPager` hook.
    - Import the existing shared interpretation types instead of defining duplicates.

- **Deferred high-risk slice: useChartData persistence split** *(deferred; high regression risk)*
    - Extract persistence and hydration helpers before considering a larger hook split.
    - Must wait for focused hook coverage; `chart_data` validation is already in place.

## 5. Completed Slices (Summary)

**Slice 1A — ProfileScreen presentational extraction** ✅
Extracted `ProfileHeader`, `BirthDetailsCard`, `SubscriptionCard`, `PurchasesCard`, `DataPrivacyCard`, `InfoRow`. Supabase calls, `onUpdatePrefs`, `onSignOut`, and navigation handlers remained in `ProfileScreen`.

**Slice 1B — ProfileScreen interactive card extraction** ✅
Extracted `ChartPreferencesCard`, `ChoiceRow`, `AccountActionsCard`. `onUpdatePrefs` passed as prop. No Supabase logic moved to components. `ProfileScreen` is now 312 lines.

**Shared profileCompletion helpers** ✅
`client/lib/profileCompletion.ts` created with `isProfileComplete`, `needsProfileCompletion`, `profileFromAuthMetadata`, and `ProfileCompletionData`. Both `DashboardScreen` and `CheckEmailScreen` import from there. Dashboard repair behavior and CheckEmail navigation behavior unchanged.

**ChartScreen shell/content split** ✅
`ChartScreen.tsx` retains only route guard (missing birth fields) and timezone validation. `ChartScreenContent.tsx` owns all hooks and rendering after both guards pass. `profile`, `chartMode`, `fromSaved`, `saved`, and `tz` passed as props.

**Runtime `chart_data` validation** ✅
`client/lib/chartDataValidation.ts` created with `parseChartData`. `useChartData`, `MyCharts`, and `DashboardScreen` now validate persisted chart JSON before use and degrade safely on malformed rows.

**Test runner setup** ✅
`client/jest.config.js` and `"test": "jest"` added. Initial tests cover `profileCompletion`, `chartDataValidation`, and journal upsert payload behavior.

**Auto-save failure visibility** ✅
`useChartData` now returns `saveWarning`; `ChartScreenContent` shows an inline warning when self chart auto-save fails. Manual save success clears the warning.

**AuthCallback handling hardening** ✅
Auth callback URL processing no longer treats a null initial URL as permanently handled. Real URLs are deduplicated, noisy/sensitive logs were removed, and auth errors produce warnings plus user-visible alerts before normal finish routing.

**Journal create-mode payload fix** ✅
`upsertJournal` omits `id` for create-mode upserts and preserves `id` for update-mode upserts. Tests verify create/update payload construction and `chart_id` behavior.

**`useChartData` branch coverage** ✅
`hooks/__tests__/useChartData.test.tsx` added (7 tests). Covers: valid `fromSaved` load skips auth/recompute; invalid saved data falls back to recompute; missing-coordinate view-only blocks DB lookup and save; self charts auto-save; guest charts do not auto-save; auto-save failure sets `saveWarning` and leaves `isSaved: false`; manual save clears warning and sets `isSaved: true`.

**useChartData async cancellation guard** ✅
Mounted/current-operation guards prevent stale async load/save work from updating state or showing stale alerts after unmount or after a newer load supersedes an older one.

**CompleteProfile top spacing polish** ✅
Removed duplicate top safe-area padding from the screen header. Safe-area behavior remains owned by `AuthContainer`.

**Chart generation and persistence helper tests** ✅
`lib/__tests__/charts.test.ts` added. Covers `buildChartData` shape with and without coordinates, `saveChart` coordinate guard, canonical upsert payload/onConflict, and Supabase error propagation.

**Auth/profile navigation screen tests** ✅
`screens/__tests__/CheckEmailScreen.test.tsx` and `screens/__tests__/AuthCallbackScreen.test.tsx` added. Covers CheckEmail missing email/code validation, resend success/failure, OTP complete profile to `Dashboard`, OTP incomplete profile to `CompleteProfile`, AuthCallback token hash to `verifyOtp`, auth code to `exchangeCodeForSession`, fragment tokens to `setSession`, delayed URL after null initial URL, and auth error alert plus finish routing. Total test baseline: 7 suites, 35 tests.

## 6. Next Safe Slice

**Next test slices: Dashboard and CompleteProfile coverage**

`useChartData`, chart helper, and auth/profile navigation coverage are complete (7 suites, 35 tests). The two highest-remaining-risk untested areas are:

1. `DashboardScreen` — profile repair, profile completion redirect, saved chart lookup, chart summary derivation, invalid saved `chart_data` fallback, and self chart auto-save/missing-coordinate no-save behavior.
2. `CompleteProfileScreen` — load/prefill, missing required field validation, selected-coordinate save, manual geocode fallback, timezone update from geocode, and `public.users` update payload.

Both can proceed independently. Neither should require source changes. They unblock safe decomposition of `DashboardScreen` and `CompleteProfileScreen`.

## 7. Deferred / High-Risk Refactors

- Full `useChartData` rewrite or state-machine conversion.
- Moving the entire `DashboardScreen.load` flow into a hook in one pass.
- Reworking `CheckEmailScreen` OTP/session/upsert flow beyond shared helper extraction.
- Changing `CompleteProfileScreen` geocode/timezone/save sequencing without focused tests.
- Adding guest chart schema fields such as `chart_type`, `is_primary`, `relationship_label`, or a `birth_profiles` table.
- Reworking subscriptions, purchases, account deletion, or exports before those features are product-ready.
- Reworking `InterpretationModal` circular pager behavior without checking first/last/single-page cases.

## 8. Do Not Touch Without Tests

These areas have little or no focused test coverage and are high-regression risk. Do not do high-risk refactors here until targeted tests exist:

- `useChartData` auto-save/manual-save/canonical lookup/save-warning/cancellation behavior.
- `DashboardScreen` profile repair and self chart auto-save behavior.
- `CheckEmailScreen` OTP/session/upsert flow beyond the covered navigation paths.
- `CompleteProfileScreen` manual geocode, timezone normalization, and `public.users` update lifecycle.
- `InterpretationModal` circular pager logic.
- Canonical chart identity and save behavior:
  - self charts with coordinates may auto-save;
  - guest charts do not auto-save;
  - guest charts can be manually saved when coordinates exist;
  - missing-coordinate charts remain view-only.
- `AuthCallbackScreen` deep-link behavior beyond the covered token/code/fragment/delayed URL paths.
- Journal UI flows beyond the pure `upsertJournal` payload tests.

## 9. Verification Baseline

Run after every implementation slice:

```bash
cd client && npm run typecheck
cd client && npm test
git diff --check
```

Manual verification should match the touched surface:

- Profile slices: load Profile, edit birth details, return to Profile, confirm preferences still show default supported values and disabled coming-soon options.
- Dashboard slices: load with a complete profile, load with an incomplete profile, confirm Dashboard routes to `CompleteProfile` only when required fields are missing.
- Chart slices: open self chart from Dashboard, open saved chart from My Charts, open chart without coordinates and confirm `View Only`.
- Guest chart slices: confirm guest charts do not auto-save before tapping save, and missing-coordinate guest charts do not persist.
- CheckEmail slices: verify OTP success, resend, missing email/code alerts, profile-complete route to Dashboard, incomplete route to CompleteProfile.
- CompleteProfile slices: save with selected autocomplete coordinates, save with manual typed location that needs geocoding, save with invalid/missing fields.
- Interpretation slices: open planet modal, open house modal, swipe first-to-last and last-to-first, test one-page/empty-page behavior where possible.
