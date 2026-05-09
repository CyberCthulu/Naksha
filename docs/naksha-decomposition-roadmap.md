# Naksha Decomposition Roadmap

Generated: 2026-05-09
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

1. **ProfileScreen presentational split**
   - Extract display cards and simple row components first.
   - Keep Supabase calls and preference save handlers in `ProfileScreen` for the first commit.

2. **Shared profile completion helpers**
   - Extract profile completeness checks, profile select fields, and auth-metadata-to-profile mapping.
   - Use from `DashboardScreen` and `CheckEmailScreen`.

3. **ChartScreen shell/content split**
   - Keep route validation and timezone validation in the shell.
   - Move valid chart rendering and hook usage into `ChartScreenContent`.

4. **CompleteProfile form/save helpers**
   - Extract DB-to-form mapping, form-to-update payload mapping, and manual geocode-before-save logic.
   - This creates useful groundwork for guest birth-data entry.

5. **InterpretationModal pager extraction**
   - Move circular pager calculations and refs into a focused hook.
   - Import the existing shared interpretation types instead of defining duplicates.

6. **Dashboard chart summary service**
   - Extract saved-chart lookup/build/sun-moon summary after profile helper extraction is stable.

7. **useChartData persistence split**
   - Extract persistence and hydration helpers before considering a larger hook split.
   - This should wait for stronger verification because it owns save behavior.

## 5. Safest First Slice

Start with `ProfileScreen.tsx` presentational extraction.

Suggested first commit:

- Add `ProfileHeader`.
- Add `BirthDetailsCard`.
- Add `ChartPreferencesCard`.
- Add `SubscriptionCard`.
- Add `PurchasesCard`.
- Add `DataPrivacyCard`.
- Add `AccountActionsCard`.
- Move `Row`/`ChoiceRow` into reusable local or component files only if the call sites stay simple.

Keep in `ProfileScreen.tsx` for this first slice:

- `load`.
- `onUpdatePrefs`.
- `onSignOut`.
- Supabase calls.
- Navigation handlers.

This is the safest first slice because it is mostly render extraction. It reduces file size without changing data ownership, auth metadata behavior, chart preferences storage, or billing/purchase behavior.

## 6. Second And Third Slices

Second slice: shared profile completion helpers.

- Add `client/lib/profileCompletion.ts`.
- Move `needsProfileCompletion` and related profile field checks there.
- Share the helper between `DashboardScreen.tsx` and `CheckEmailScreen.tsx`.
- Keep Dashboard repair behavior and CheckEmail navigation behavior unchanged.

Third slice: `ChartScreen` shell/content split.

- Keep malformed-route and invalid-timezone guards in `ChartScreen`.
- Move the valid route body into `ChartScreenContent`.
- Pass validated `profile`, `chartMode`, `fromSaved`, `saved`, and `tz` into the content component.
- Preserve saved chart flow and view-only behavior.

## 7. Deferred / High-Risk Refactors

- Full `useChartData` rewrite or state-machine conversion.
- Moving the entire `DashboardScreen.load` flow into a hook in one pass.
- Reworking `CheckEmailScreen` OTP/session/upsert flow beyond shared helper extraction.
- Changing `CompleteProfileScreen` geocode/timezone/save sequencing without focused tests.
- Adding guest chart schema fields such as `chart_type`, `is_primary`, `relationship_label`, or a `birth_profiles` table.
- Reworking subscriptions, purchases, account deletion, or exports before those features are product-ready.
- Reworking `InterpretationModal` circular pager behavior without checking first/last/single-page cases.

## 8. Do Not Touch Without Tests

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
