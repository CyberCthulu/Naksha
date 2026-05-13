# Naksha Decomposition Roadmap

Generated: 2026-05-09
Last updated: 2026-05-12 — cleanup/stabilization complete enough for feature expansion.
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
| `DashboardScreen.tsx` | High | Auth user lookup, user-row bootstrap, auth metadata repair, profile completion redirect, chart lookup/build/auto-save, sun/moon summary, navigation UI. | `lib/profileCompletion.ts`, `lib/dashboardChartSummary.ts`, `DashboardSignsCard`, `DashboardBirthDetailsCard`, `DashboardActions`. | Older-account repair remains; incomplete profiles still route to `CompleteProfile`; self chart opens with `chartMode: 'self'`; charts without coordinates do not save. | Focused tests now guard current behavior; future extraction should be tied to a feature or defect. |
| `CompleteProfileScreen.tsx` | Medium | Loads user row, maps DB date/time to picker state, manages form state, validates, geocodes fallback, updates `public.users`, renders header/footer/form. | `useCompleteProfileForm`, `userRowToProfileForm`, `profileFormToUserUpdate`, `resolveBirthLocationForSave`, `CompleteProfileHeader`, `CompleteProfileFooter`. | Writes `public.users` only; manual typed location geocodes before save; OpenCage timezone can update `time_zone`; `navigation.goBack()` remains. | Save/geocode lifecycle tests now guard current behavior and prepare reuse for guest birth-data entry. |
| `CheckEmailScreen.tsx` | Medium-High | OTP UI, resend, verify, session/user confirmation, signup profile upsert, fallback profile fetch, completion routing. | `lib/profileCompletion.ts`, `lib/signupProfileBootstrap.ts`, `OtpVerificationCard`. | Resend behavior, OTP alerts, route-param profile upsert, and deterministic reset to `Dashboard` or `CompleteProfile` remain. | Reduces auth-flow drift and future profile-rule risk. |
| `useChartData.ts` | High | Saved-chart hydration, `chart_data` validation handling, auth lookup, canonical chart lookup, render-only charts, self auto-save, guest manual save, save warnings, async cancellation guards, alerts, chart state. | `lib/chartPersistence.ts`, `hydrateChartData`, `findSavedChartByIdentity`, `saveBuiltChart`, later `useChartLoader`/`useChartSaveAction`. | `fromSaved` path stays valid; self charts can auto-save; guest charts do not auto-save; missing-coordinate charts stay view-only; save warnings and cancellation behavior remain. | High future feature value; focused hook tests now guard current behavior. |
| `ChartScreen.tsx` | Medium | Route guard, timezone validation, chart hook wiring, focus side effect, save button state, chart layout, page building, modal wiring. | `ChartScreenContent`, `ChartSaveControl`, `ChartViewOnlyNotice`, `useChartInterpretationPages`, `ChartBody`. | Invalid route empty state, saved chart flow, save button labels, initial Sun focus, and interpretation modal behavior remain. | Reduces crash/hook-order risk and prepares guest chart UI. |
| `InterpretationModal.tsx` | Medium | Modal shell, duplicate interpretation types, circular pager index math, previous/next controls, close/backdrop, page rendering. | Import shared `interpretationTypes`, `useCircularPager`, `InterpretationModalHeader`, `InterpretationPager`. | Circular swipe, first/last wrap, disabled arrows for one page, and close/reopen reset remain. | Pager tests now guard current behavior; extraction is optional and should be feature-attached. |

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

14. **DashboardScreen behavior tests**
    - `screens/__tests__/DashboardScreen.test.tsx` added.
    - Covers complete/incomplete profile behavior, auth metadata repair, saved chart summary hydration, invalid saved `chart_data` fallback, self chart auto-save, and missing-coordinate no-save behavior.

15. **CompleteProfileScreen save/geocode lifecycle tests**
    - `screens/__tests__/CompleteProfileScreen.test.tsx` added.
    - Covers load/prefill, validation, selected-coordinate save, manual geocode fallback, geocode failure, timezone handling, and `public.users` update payload.

16. **InterpretationModal pager tests**
    - `components/charts/__tests__/InterpretationModal.test.tsx` added.
    - Covers closed state, one-page behavior, prev/next controls, circular boundaries, close, and close/reopen reset behavior.

17. **ESLint setup and warning cleanup**
    - Added Expo-compatible ESLint flat config and `"lint": "eslint ."`.
    - Cleaned warnings narrowly; `npm run lint` passes cleanly.

18. **Supabase generated types**
    - `client/lib/database.types.ts` generated from Supabase.
    - `client/lib/supabase.ts` uses `createClient<Database>()`.
    - Shared DB row aliases in `domainTypes.ts` derive from generated `Tables`.

---

### REMAINING (re-ranked)

- **Next feature slice: Wire chart preferences to chart math** *(highest user trust impact)*
   - `public.chart_preferences` stores supported defaults, but `buildChartData` and aspect math still use the current hardcoded behavior.
   - Preserve Whole Sign, Tropical, and medium-orb output until additional systems have math, DB constraints, UI, and tests.

- **Next feature slice: Guest chart creation UI** *(activates existing chartMode groundwork)*
   - Add a user-facing form for another person's birth data and navigate to `ChartScreen` with `chartMode: 'guest'`.
   - Do not add synastry, compatibility, or guest-specific schema until that workflow is defined.

- **Product decision slice: Chat, subscription, and service stubs** *(feature clarity)*
   - Decide whether to implement or intentionally park `ChatScreen`, `SubscriptionScreen`, and placeholder service modules.
   - The empty screens remain unregistered in `App.tsx`.

- **Tooling slice: CI-backed schema/migration validation** *(release safety)*
   - Automate or document a reliable `supabase db reset`/`db diff` workflow.
   - Client tests, lint, generated types, and typecheck are in place; migration validation is still manual.

- **Feature-attached cleanup slices** *(ongoing, not standalone)*
   - Extract Dashboard, CompleteProfile, Profile, CheckEmail, `useChartData`, or `InterpretationModal` internals only when touching that surface for a concrete feature or defect.
   - Avoid broad open-ended refactors now that stabilization coverage is in place.

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
`screens/__tests__/CheckEmailScreen.test.tsx` and `screens/__tests__/AuthCallbackScreen.test.tsx` added. Covers CheckEmail missing email/code validation, resend success/failure, OTP complete profile to `Dashboard`, OTP incomplete profile to `CompleteProfile`, AuthCallback token hash to `verifyOtp`, auth code to `exchangeCodeForSession`, fragment tokens to `setSession`, delayed URL after null initial URL, and auth error alert plus finish routing.

**DashboardScreen behavior tests** ✅
`screens/__tests__/DashboardScreen.test.tsx` added. Covers complete/incomplete profile behavior, auth metadata repair, saved chart summary hydration, invalid saved `chart_data` fallback, self chart auto-save, and missing-coordinate no-save behavior.

**CompleteProfileScreen save/geocode lifecycle tests** ✅
`screens/__tests__/CompleteProfileScreen.test.tsx` added. Covers load/prefill, validation, selected-coordinate save, manual geocode fallback, geocode failure, timezone handling, and `public.users` update payload.

**InterpretationModal pager tests** ✅
`components/charts/__tests__/InterpretationModal.test.tsx` added. Covers closed state, one-page behavior, prev/next controls, circular boundaries, close, and close/reopen reset behavior.

**ESLint setup and warning cleanup** ✅
Expo-compatible ESLint flat config and `"lint": "eslint ."` added. Targeted cleanup brought `npm run lint` to zero warnings/errors.

**Supabase generated types** ✅
`client/lib/database.types.ts` generated from Supabase. `client/lib/supabase.ts` now uses `createClient<Database>()`, and DB row aliases in `domainTypes.ts` derive from generated `Tables`.

**Final cleanup verification baseline** ✅
`npm run typecheck`, `npm test` (10 suites / 55 tests), and `npm run lint` pass cleanly.

## 6. Next Safe Slice

**Next feature slice: Wire chart preferences to chart math**

Cleanup/stabilization is complete enough for feature expansion. Future cleanup should be attached to specific feature work or real defects, not broad open-ended refactoring.

The best next feature-facing slice is applying the already-stored chart preferences to the chart calculation path while preserving the current supported defaults:

- Whole Sign houses.
- Tropical zodiac.
- Medium orbs.

Do not claim Placidus, Sidereal, Vedic, or alternate orb modes are implemented until the math, DB constraints, UI states, and tests all support them.

## 7. Deferred / High-Risk Refactors

- Full `useChartData` rewrite or state-machine conversion.
- Moving the entire `DashboardScreen.load` flow into a hook in one pass without a feature or defect reason.
- Reworking `CheckEmailScreen` OTP/session/upsert flow beyond covered behavior without a product reason.
- Changing `CompleteProfileScreen` geocode/timezone/save sequencing without updating focused tests.
- Adding guest chart schema fields such as `chart_type`, `is_primary`, `relationship_label`, or a `birth_profiles` table.
- Reworking subscriptions, purchases, account deletion, or exports before those features are product-ready.
- Implementing additional chart systems before math, DB constraints, UI, and tests are ready.

## 8. Guardrails For Future Work

These areas now have focused coverage or explicit contracts, but they remain high-regression surfaces. Update targeted tests when changing them:

- `useChartData` auto-save/manual-save/canonical lookup/save-warning/cancellation behavior.
- `DashboardScreen` profile repair and self chart auto-save behavior.
- `CheckEmailScreen` OTP/session/upsert flow beyond the covered navigation paths.
- `CompleteProfileScreen` manual geocode, timezone normalization, and `public.users` update lifecycle.
- `InterpretationModal` circular pager logic.
- Chart preference math integration once preferences become active inputs.
- Canonical chart identity and save behavior:
  - self charts with coordinates may auto-save;
  - guest charts do not auto-save;
  - guest charts can be manually saved when coordinates exist;
  - missing-coordinate charts remain view-only.
- `AuthCallbackScreen` deep-link behavior beyond the covered token/code/fragment/delayed URL paths.
- Journal UI flows beyond the pure `upsertJournal` payload tests.
- Supabase schema/migration validation, which is still manual rather than CI-backed.

## 9. Verification Baseline

Run after every implementation slice:

```bash
cd client && npm run typecheck
cd client && npm test
cd client && npm run lint
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
