# Naksha Design System — Proposal

Status: **proposed, not approved, not implemented**
Date: 2026-09-02
Platform focus: Android first
Direction: premium celestial editorial
Baseline: `ui-audit.md`, `baseline.md`
Reference: `docs/ui-redesign/reference/naksha-ui-north-star.png` — directional
for atmosphere, surfaces, typography, spacing, and information hierarchy only

## How to read this document

Every value here is a **proposal for review**. Nothing is approved until it is
signed off, and nothing is implemented until Slice 2.

This system **extends the existing `client/components/ui/theme.ts` and
`uiStyles.ts` and the existing shared components**. It does not create a parallel
V2 component library. The audit found 38 of 46 UI files already import `theme`
and 33 import `uiStyles` — that adoption is the migration vehicle. Every section
below ends with an explicit mapping onto files that already exist.

**No dependency is installed by this document.** Font packages are proposed in
§4.4 and must be approved separately.

---

## 1. Color

### 1.1 Semantic roles

Replaces the current 6-value `theme.colors`, which has no background, no accent,
no secondary-text color, and no state semantics.

#### Environment

| Role | Value | Use |
| --- | --- | --- |
| `background.base` | `#080B14` | App root. The deep navy near-black environment. |
| `background.raised` | `#0E1322` | Upper gradient stop; hero background lift. |
| `background.sunken` | `#05070E` | Input wells; the recessed area behind a field. |

#### Surfaces

| Role | Value | Use |
| --- | --- | --- |
| `surface` | `#131A2C` | Default card. **Opaque** — replaces `rgba(0,0,0,0.35)`. |
| `surface.raised` | `#1A2238` | Sheets, modals, pressed cards, dropdowns. |
| `surface.selected` | `rgba(201,164,92,0.10)` | Selected list row. Replaces `rgba(255,255,255,0.06)`. |
| `scrim` | `rgba(4,6,12,0.72)` | Modal backdrop. Replaces `rgba(0,0,0,0.55)`. |

The current card is a 35 %-opacity black rectangle on pure black — effectively
invisible, defined only by its border. Opaque surfaces are also cheaper on
Android: they avoid the overdraw that stacked translucency causes.

#### Borders

| Role | Value | Use |
| --- | --- | --- |
| `border` | `rgba(214,222,240,0.10)` | Default hairline. Replaces `rgba(255,255,255,0.4)`. |
| `border.strong` | `rgba(214,222,240,0.18)` | Secondary buttons, emphasized dividers. |
| `border.accent` | `rgba(201,164,92,0.38)` | Focus ring, selected state. |

The current `rgba(255,255,255,0.4)` is a loud border doing the work an invisible
surface should be doing. Opaque surfaces let the border recede.

#### Text

| Role | Value | On `background.base` | On `surface` | Use |
| --- | --- | --- | --- | --- |
| `text.primary` | `#F4EFE6` — ivory | **16.2:1** | 14.9:1 | Headings, body, values |
| `text.secondary` | `#A9B2CC` — muted slate-lavender | **8.9:1** | 8.2:1 | Supporting copy, guidance body |
| `text.tertiary` | `#7F8AA8` — dim slate | **5.5:1** | **5.0:1** | Meta, captions, hints |
| `text.disabled` | `#4E566E` | 2.4:1 | — | Disabled only. **Never for content.** |
| `text.onAccent` | `#0A0E1A` | — | 7.9:1 on `accent` | Text on a gold fill |

All content roles clear WCAG AA (4.5:1) on both the environment and the card
surface. `text.disabled` deliberately does not, and is restricted to genuinely
inert controls.

This replaces `muted` (0.75 white) and `sub` (0.85 white) — two roles whose
names implied the opposite of their values, and neither of which was a slate or
lavender.

#### State

| Role | Value | Contrast on base | Replaces |
| --- | --- | --- | --- |
| `danger` | `#E5736B` | **6.3:1** | `'crimson'` (`#DC143C`) at **4.2:1 — currently fails AA** |
| `warning` | `#D9A441` | 8.6:1 | none existed |
| `success` | `#6FBF8B` | 9.1:1 | none existed |
| `info` | `#7FA8D9` | 7.4:1 | none existed |

Each state color also gets a `.muted` fill at 12 % alpha for banner backgrounds.

### 1.2 Restrained gold

| Role | Value | Use |
| --- | --- | --- |
| `accent` | `#C9A45C` | The single warm gold. |
| `accent.bright` | `#E3C078` | Hero glyph and focused planet **only**. |
| `accent.muted` | `rgba(201,164,92,0.14)` | Accent fills, selected-row wash. |
| `accent.border` | `rgba(201,164,92,0.38)` | Focus ring, selected border. |

**"Restrained" means enforceable rules, not taste.** Gold is permitted only for:

1. The **one** primary action on a screen.
2. Focus and selected states.
3. Section eyebrow labels in the interpretation reading surface.
4. Chart-wheel planet glyphs and the focal-planet halo.
5. The active page indicator in the interpretation pager.

Gold is **prohibited** for: body copy, more than one primary action per screen,
card backgrounds, borders on non-interactive surfaces, decorative dividers, and
any state whose meaning is error, warning, or success.

Review heuristic: if `accent` and `accent.bright` occupy much more than roughly
**5 % of a screen's visible area**, the screen is probably over-gilded and should
be re-examined. This is a **prompt for judgement at the Slice 6 gate, not a
literal pixel-area measurement** and not a pass/fail test. The enumerated
allow-list above is the actual rule.

This also replaces every use of `#007AFF` — 7 literals plus a `Switch` track —
which is both off-brand and an iOS idiom on an Android-first product.

### 1.3 Restrained planet accents

Derived from the existing `colorForPlanet()` in `SpaceBackground.tsx`, adjusted
for contrast on deep navy and desaturated for restraint.

| Planet | Proposed | Current in `colorForPlanet()` |
| --- | --- | --- |
| Sun | `#E8B44A` | `#f1be47` |
| Moon | `#B9C2D6` | `#a09f9f` |
| Mercury | `#A8B0C8` | `#999999` |
| Venus | `#E0BE96` | `#e6c08a` |
| Mars | `#C7563A` | `#af2c08` (too dark on navy) |
| Jupiter | `#D6B98C` | `#d2b48c` |
| Saturn | `#CBB577` | `#d8c07a` |
| Uranus | `#7FC4C4` | `#7ad8d8` |
| Neptune | `#7D94D9` | `#4f79ff` (too saturated) |
| Pluto | `#A98A7C` | `#b08a7a` |

**Usage rules — deliberately narrow:**

1. **At most one planet accent is active at a time**, driven by the existing
   `SpaceProvider.focusedPlanet` contract, which already exists and is already
   load-bearing for the chart screen.
2. Permitted surfaces: the chart-wheel glyph tint; the focal-planet halo in a
   `hero` background at ≤ 8 % opacity; the interpretation page's eyebrow rule.
3. **Prohibited**: body text, card backgrounds, buttons, borders on inputs, list
   row fills, and any use of more than one planet color in a single view.
4. Planet accents never replace `accent` for interactive meaning. A gold button
   stays gold on a Mars page.

Rule 1 is what keeps this from becoming a ten-color rainbow. It also means the
system degrades safely: with no focused planet, the surface is simply gold and
ivory.

### 1.4 Mapping onto `theme.ts`

`theme.colors` is imported by 38 files. The migration **keeps every existing key
as a deprecated alias** so that no file breaks on the token commit, then removes
the aliases once consumers migrate.

| Existing key | Current value | New mapping | Note |
| --- | --- | --- | --- |
| `text` | `#fff` | → `text.primary` (`#F4EFE6`) | Ivory, not pure white |
| `sub` | `rgba(255,255,255,0.85)` | → `text.secondary` | |
| `muted` | `rgba(255,255,255,0.75)` | → `text.tertiary` | Naming inversion corrected |
| `border` | `rgba(255,255,255,0.4)` | → `border` (much lighter) | Surface now carries the definition |
| `cardBg` | `rgba(0,0,0,0.35)` | → `surface` (opaque) | **Also used as `Button` primary text — that is D-02 and is fixed in Slice 1** |
| `danger` | `'crimson'` | → `danger` (`#E5736B`) | Current value fails AA |

New top-level groups added: `background`, `surface`, `accent`, `planet`, `state`,
`scrim`, plus `opacity`, `radius`, `space`, `type`, and `motion` from later
sections.

---

## 2. Spacing

### 2.1 Scale

The current scale is 3 tokens against **18 distinct raw values** in use.

| Token | Value | Typical use |
| --- | --- | --- |
| `space.none` | 0 | |
| `space.hair` | 2 | Optical nudges only |
| `space.xs` | 4 | Icon-to-label, tight stacks |
| `space.sm` | 8 | Intra-component |
| `space.md` | 12 | Between related elements |
| `space.lg` | 16 | Card padding, between fields |
| `space.xl` | 20 | Screen gutter |
| `space.2xl` | 24 | Between cards |
| `space.3xl` | 32 | Between sections |
| `space.4xl` | 40 | Major breaks |
| `space.5xl` | 48 | Screen-level separation |

### 2.2 Mapping from current raw values

| Raw value in use | Occurrences | Maps to |
| --- | --- | --- |
| 0, 1, 2, 3 | 12 | `hair` (2) or `none` |
| 4 | 16 | `xs` (4) |
| 6, 7 | 25 | `sm` (8) |
| 8, 9 | 35 | `sm` (8) |
| 10 | 37 | `md` (12) |
| 12 | 36 | `md` (12) |
| 14 | 9 | `lg` (16) |
| 16 | 10 | `lg` (16) |
| 18 | 3 | `xl` (20) |
| 20 | 1 | `xl` (20) |
| 40 | 1 | `4xl` (40) |

The 10 → 12 and 6 → 8 collapses are the two that change the most pixels. They
are intentional: the current 6/7/8/9/10 cluster is noise, not rhythm.

### 2.3 Mapping onto existing tokens

| Existing | Value | New |
| --- | --- | --- |
| `spacing.screen` | 20 | → `space.xl` (unchanged value) |
| `spacing.card` | 14 | → `space.lg` (16) |
| `spacing.top` | 40 | **Deprecated.** Replaced by `insets.top + space.md`. Dashboard's fixed 40 currently ignores safe-area entirely. |

### 2.4 Vertical rhythm

- Screen gutter: `space.xl` (20) horizontal on all screens.
- Screen top: `insets.top + space.md`. Never a fixed value.
- Screen bottom: `insets.bottom + space.3xl`.
- Card internal padding: `space.lg`.
- Card-to-card: `space.md`.
- Section-to-section: `space.3xl`.

### 2.5 Retire the spacer-`View` idiom

`<View style={{ height: 8 }} />` appears in `LoginScreen`, `SignupScreen`,
`ForgotPasswordScreen`, `ResetPasswordScreen`, `CheckEmailScreen`,
`DashboardScreen`, `CompleteProfileScreen`, and `ChartScreenContent`. Replace
with a `Stack` primitive taking a `gap` token (React Native supports `gap` /
`rowGap` / `columnGap`, already used in `DashboardScreen`'s action grid).

---

## 3. Radius

| Token | Value | Use |
| --- | --- | --- |
| `radius.none` | 0 | |
| `radius.xs` | 4 | Chips, tags, inline highlights |
| `radius.sm` | 8 | Buttons, inputs, list rows |
| `radius.md` | 12 | Cards |
| `radius.lg` | 16 | Large panels |
| `radius.xl` | 20 | Sheet top corners |
| `radius.pill` | 999 | Pills, badges |
| `radius.round` | `size / 2` | Avatars, dots |

### Mapping from current raw values

| Raw | Where | Maps to |
| --- | --- | --- |
| 4 | `TodayEnergyCard`/`WeeklyForecastCard` toggle surface | `xs` |
| 7 | `ChoiceRow` selection dot | `round` |
| 8 | `Button`, list pressable rows | `sm` |
| 12 | `theme.radius.card` | `md` |
| 18 | `InterpretationModal` sheet | `xl` (20) |
| 26 | `ProfileHeader` avatar | `round` |
| 999 | save pills | `pill` |

`theme.radius.card` (12) is preserved as `radius.md` with the same value.

---

## 4. Typography

### 4.1 The problem being solved

No fonts are loaded. Ten `fontSize` values, four weights, seven line-heights, and
**eight competing definitions of the same heading roles**. `AppText.TitleText` is
byte-identical to `uiStyles.h1` and both are in use.

### 4.2 Roles

| Role | Family | Size / Line | Weight | Tracking | Use |
| --- | --- | --- | --- | --- | --- |
| `display` | Serif | 32 / 38 | 600 | −0.5 | Hero — "Sun in Virgo" |
| `title` | Serif | 26 / 32 | 600 | −0.3 | Screen title |
| `heading` | Serif | 20 / 26 | 600 | −0.2 | Card and section title |
| `subheading` | Sans | 15 / 20 | 600 | 0 | Sub-section within a card |
| `eyebrow` | Sans | 12 / 16 | 600 | +0.8, uppercase | Section label above a heading |
| `bodyLarge` | Sans | 16 / 26 | 400 | 0 | **Interpretation reading surface** |
| `body` | Sans | 15 / 23 | 400 | 0 | Default body |
| `bodySmall` | Sans | 13 / 20 | 400 | 0 | Supporting, guidance body |
| `caption` | Sans | 12 / 16 | 400 | 0 | Meta, timestamps, hints |
| `button` | Sans | 15 / 20 | 600 | +0.2 | Button labels |
| `numeric` | Sans, **tabular** | 14 / 20 | 500 | 0 | Degrees, orbs, coordinates |

Eleven roles replace ten ad-hoc sizes and eight heading definitions.

### 4.3 Reading measure

The audit found the flagship reading surface (interpretation, 14/24) and the
daily reading surface (guidance, 13/19) share no hierarchy, which
`redesign-plan.md` §4 explicitly requires them to.

| Surface | Role | Ratio |
| --- | --- | --- |
| Interpretation body | `bodyLarge` 16/26 | 1.63 |
| Guidance body | `bodySmall` 13/20 | 1.54 |
| Journal context | `bodySmall` 13/20 | 1.54 |
| List row summary | `bodySmall` 13/20 | 1.54 |

Interpretation is deliberately the largest, longest-measure surface in the app.
Every other long-form surface shares one supporting role.

### 4.4 Fonts — **approved, not yet installed**

| Slot | Proposal | Weights | Rationale |
| --- | --- | --- | --- |
| Serif display | **Cormorant Garamond** | 600 | High-contrast old-style serif; reads as celestial-editorial rather than corporate. Matches the reference's heading character. |
| Sans body | **Inter** | 400, 500, 600 | Exceptional small-size legibility on Android; **has true tabular figures**, which fixes the numeric column problem directly. |

Five font files total (1 serif + 3 sans + Inter's tabular feature is a variant
setting, not a file).

**Cormorant Garamond SemiBold (600) is the provisional display serif** and must
be **validated on Android**. Risk: low x-height and thin strokes. Mitigation — it
is restricted to ≥ 20 px (`heading` and above) and **never used for body**.

**EB Garamond remains the approved fallback** if Cormorant shows poor legibility
or rendering at heading sizes on device. Switching to it is a Slice 3 finding,
not a re-opened design decision — both are pre-approved, and device evidence
picks between them.

**Approved dependencies** (not installed until Slice 3): `expo-font`, and
`expo-splash-screen` for load gating. Neither is currently in
`client/package.json`.

Note: **`expo-status-bar` is already a dependency** and is the correct existing
tool for the D-03 status-bar fix — no new dependency is needed there.

### 4.5 Android loading and fallback strategy

1. Load via `expo-font`'s `useFonts` at the app root, before the navigation tree
   mounts.
2. Hold the native splash with `expo-splash-screen` until fonts resolve, then
   hide it. This prevents the flash-of-fallback-font that is especially visible
   with a serif display face.
3. **Fallback is mandatory, not optional.** Every role declares a platform
   fallback stack: serif roles fall back to Android's `serif`, sans roles to the
   system default. If `useFonts` errors or times out, the app renders in
   fallbacks and **must remain fully usable** — font loading never blocks the
   product.
4. Budget: if fonts have not loaded within **3 seconds**, hide the splash and
   render with fallbacks. A user must never be held on a splash by a font.
5. Font files are bundled as local assets, never fetched at runtime — the app
   must work fully offline.
6. Verify on a **release** build. Font behavior differs between debug and
   release on Android.

### 4.6 Mapping onto `AppText.tsx` and `uiStyles.ts`

`AppText` is imported by 11 files and is the correct place for roles to live.

| Existing | Disposition |
| --- | --- |
| `AppText` | Becomes `<Text role="body">` — default preserved, so existing call sites keep working |
| `MutedText` | Alias for `role="bodySmall"` + `text.secondary`. **Kept** — 11 files use it |
| `TitleText` | Alias for `role="title"`. Its duplicate `uiStyles.h1` is retired |
| `uiStyles.h1` | → `role="title"` |
| `uiStyles.sub` | → `role="body"` + `text.secondary` |
| `uiStyles.cardTitle` | → `role="heading"` |
| `uiStyles.text` | → `role="body"` |
| `uiStyles.muted` | → `text.secondary` |
| `uiStyles.errorText` | → `role="bodySmall"` + `danger`, **left-aligned** (currently centered, which reads as page-level even for one field) |
| `fontFamily: 'monospace' as any` ×3 | **Removed.** Replaced by `numeric` with Inter tabular figures — same alignment benefit, no cast, an actual editorial typeface |

---

## 5. Surfaces, Borders, and Elevation

**No shadows.** `shadowColor` / `elevation` are invisible against a near-black
environment and cost real Android overdraw. Depth comes from background
lightness steps plus a hairline border.

| Level | Background | Border | Use |
| --- | --- | --- | --- |
| 0 — environment | `background.base` | none | Screen root |
| 1 — surface | `surface` | `border` | Cards, list rows |
| 2 — raised | `surface.raised` | `border.strong` | Sheets, modals, dropdowns |
| 3 — selected | `surface.selected` | `border.accent` | Selected row, focused field |

Rules:

- Never nest a level-1 surface inside another level-1 surface. `ChartCompass`
  currently sets `uiStyles.card` and then re-declares the same
  `backgroundColor` — that resolves to one level.
- Dividers use `border` at `StyleSheet.hairlineWidth`, matching the existing
  guidance cards, which already do this correctly.
- Modal backdrop uses `scrim`, never a raw rgba literal.

### Mapping

| Existing | Disposition |
| --- | --- |
| `Card` component (4 consumers) | **The single card implementation.** Gains `variant` for levels 1–2 |
| `uiStyles.card` (~12 consumers) | **Retired** — migrate consumers to `Card`. Resolves audit F-08 |
| `ChartCompass` `backgroundColor` override | Removed; redundant once `Card` is the source |

---

## 6. Backgrounds — Quiet, Atmospheric, Hero

Approved V1 approach: deep navy base, lightweight **static** gradients, sparse
**static** SVG celestial detail, three intensity variants, flat navy fallback.
**No `three`, no `expo-gl`, no particle system, no continuous GPU effect.**

Implementation uses **`react-native-svg` 15.12.1, already a dependency** —
`<Defs>` with `<LinearGradient>` / `<RadialGradient>`, and `<Circle>` elements
for stars. No new dependency is required.

| Variant | Composition | Applied to |
| --- | --- | --- |
| **`flat`** | `background.base` solid. Nothing else. | Fallback; low-end devices; reduced-motion; any surface where the gradient measurably costs frames |
| **`quiet`** | `background.base` + one vertical linear gradient, `background.raised` → `background.base`, top 40 % only | Auth, forms, journal, lists — content-dense reading and input surfaces |
| **`atmospheric`** | `quiet` + up to **12** static stars: fixed positions, radius 0.5–1.5, three opacity tiers (0.10 / 0.18 / 0.28), `text.primary` fill | Dashboard, MyCharts, Profile |
| **`hero`** | `atmospheric` + **one** soft radial glow behind the focal element, tinted by the active planet accent at **≤ 8 %** opacity, radius ≈ 45 % of screen width | Chart route and interpretation sheet **only** |

Hard constraints:

1. **Everything is static.** No animation loop, no `requestAnimationFrame`, no
   `Animated` driver, no timers. The background renders once per layout.
2. Star positions are **deterministic constants**, not random per mount — a
   background that reshuffles on re-render reads as noise.
3. Star count is capped at 12. The disabled GL background used 5,000.
4. `pointerEvents="none"` on every background layer.
5. The background never carries information. Removing it entirely must leave the
   screen fully usable and fully legible — this is what makes `flat` a genuine
   fallback rather than a degraded mode.
6. Exactly one `hero` glow per screen, driven by the existing
   `SpaceProvider.focusedPlanet`.

### Relationship to the dormant GL stack

`three` 0.182.0, `@react-three/fiber` 9.5.0, `expo-gl`, and `@types/three` remain
installed, and `client/metro.config.js` carries `three`-specific resolver
configuration (`extraNodeModules` forcing a single `three` instance, plus a
`maath/three` alias).

**Do not remove any of it in this work.** `SpaceProvider` is live and
load-bearing for chart focus; only `SpaceBackground` is dormant. Removal is a
later isolated cleanup that must first check every reference, the metro resolver
config, the ESLint override for `components/space/SpaceBackground.tsx`, and the
`three` version pin in `package.json` `overrides`.

---

## 7. Buttons and Interaction Hierarchy

### 7.1 The problem

`Button.primary` renders `rgba(0,0,0,0.35)` text on `#fff` (D-02). Because it is
visually broken, **every auth screen renders every action as `variant="ghost"`**
— Login, "Forgot password?", and "Don't have an account? Sign Up" are three
identical buttons. Dashboard stacks one primary above six identical ghost
buttons, with destructive Sign Out styled exactly like navigation.

Six further ad-hoc button implementations bypass the primitive entirely, plus
React Native's core `Button` in `ChartScreen` and `ChartScreenContent`.

### 7.2 Variants

| Variant | Background | Border | Text | Rule |
| --- | --- | --- | --- | --- |
| `primary` | `accent` | none | `text.onAccent` | **Max one per screen** |
| `secondary` | transparent | `border.strong` | `text.primary` | Standard action |
| `tertiary` | transparent | none | `accent` | Inline / link-style |
| `destructive` | transparent | `border` | `danger` | Delete, sign out |
| `destructive.solid` | `danger` | none | `text.onAccent` | Confirmation dialogs only |

`primary` at 7.9:1 contrast replaces a combination that currently fails AA.

### 7.3 Sizes and states

| Size | Min height | Padding | Role |
| --- | --- | --- | --- |
| `sm` | 40 | `sm` / `md` | Inline, in-card |
| `md` | 48 | `md` / `lg` | Default |
| `lg` | 56 | `lg` / `xl` | Screen-level primary |

**Every size keeps a ≥ 48 dp touch target**, using `hitSlop` where the visual is
smaller than 48.

| State | Treatment |
| --- | --- |
| default | as specified |
| pressed | `opacity: 0.88`; secondary/tertiary also brighten border to `border.accent` |
| disabled | `opacity: 0.45`, no press feedback, `accessibilityState={{ disabled: true }}` |
| loading | spinner in `accent` (or `text.onAccent` on a filled primary), label retained, control disabled |

Loading replaces the five different in-progress presentations the audit found
(italic text, link-text swap, opacity 0.7 + label swap, bare spinner, spinner
row).

### 7.4 Hierarchy rules

1. One `primary` per screen. If two actions feel primary, one is not.
2. Destructive actions never share a variant with navigation. Dashboard's Sign
   Out becomes `destructive`.
3. Ghost/secondary is the default for repeated navigation actions.
4. Navigation to another screen is `secondary` or `tertiary`, never `primary`.

### 7.5 Mapping

| Existing | Disposition |
| --- | --- |
| `Button` (8 consumers) | **Retained, contract preserved.** `variant="ghost"` aliases `secondary`; new variants added |
| `CheckEmailScreen` `primaryBtn`/`secondaryBtn`/`linkBtn` | → `Button` primary / secondary / tertiary |
| `CompleteProfileScreen` `primaryBtn`/`secondaryBtn`/`savePill` | → `Button` primary / tertiary / `sm` secondary |
| `JournalEditorScreen` `savePill`/`bigSaveBtn` | → `Button`; **consolidate to one save action** (audit F-16) |
| `JournalListScreen` `newBtn` | → `Button` secondary |
| Profile card `#007AFF` text links | → `Button` tertiary; destructive ones → `destructive` |
| RN core `Button` in `ChartScreen`, `ChartScreenContent` | → shared `Button`. **Part of the Slice 6 flagship** |

---

## 8. Fields and Validation

### 8.1 The problem

`TextField` has **no error prop and no error state**. Validation is split across
inline centered text, ~15 `Alert.alert` calls, and one silent no-op. No error is
ever attached to the field that caused it.

### 8.2 Field states

| State | Border | Background | Note |
| --- | --- | --- | --- |
| default | `border` | `background.sunken` | |
| focused | `border.accent` | `background.sunken` | 1.5 px |
| error | `danger` | `background.sunken` | Message below, left-aligned |
| disabled | `border` | `surface` | `text.disabled` |

Field min height **48 dp**. Label is `subheading`; hint and error are
`bodySmall`.

### 8.3 Validation rules

1. **Field-level problems render at the field**, never as a centered page
   message and never as an `Alert`.
2. `Alert.alert` is reserved for **destructive confirmation** and **failures the
   user cannot fix inline** (network, save failure). This removes roughly a
   dozen alerts from the validation path.
3. Error text carries `accessibilityLiveRegion="polite"`.
4. No silent failures. `DashboardScreen`'s "View Birth Chart" currently returns
   with no feedback when the profile is incomplete — it must either explain or
   be visibly disabled.
5. Validate on submit, then re-validate on change once a field has errored.

### 8.4 Mapping

| Existing | Disposition |
| --- | --- |
| `FormField` (5 consumers) | Retained; gains `error` and `hint` |
| `TextField` (5 consumers) | Retained; gains `error`, `label`, focus state |
| `formStyles` | Folded into the primitives; `pickerWrap` is **unused** and deleted |
| `DateField`, `TimeField`, `TimeZonePicker` | Refactored onto `FormField` — they currently re-implement the label inline |
| `JournalEditorScreen` own `label`/`input`/`textarea` | → `FormField` + `TextField` |
| `LocationAutocompleteField` dropdown | Overlay with `maxHeight` and internal scroll; currently in-flow, so selecting a result pushes the form |
| `uiStyles.errorText` | → left-aligned `bodySmall` + `danger` |

---

## 9. Loading, Error, and Empty States

### 9.1 Loading

| Context | Treatment |
| --- | --- |
| Full screen | `LoadingState`, **safe-area aware**, indicator in `accent` |
| In-card | Inline spinner + `bodySmall` |
| In-button | See §7.3 |
| App boot | `flat` background + `accent` indicator |

Label convention: **`Loading <noun>`** — "Loading chart", "Loading charts",
"Loading journals", "Loading profile". No bare "Loading...". Remove
`LoadingState`'s `minWidth: 160` and 1-line clamp, which exist to stop the
default label from reflowing.

`ActivityIndicator` currently never receives a `color` anywhere in the app.

### 9.2 Error — new `ErrorState` primitive

Composition: `heading` title, `bodySmall` message in `text.secondary`, and
**always a recovery action**.

| Existing | Becomes |
| --- | --- |
| Dashboard: retry + sign out | `ErrorState` — primary retry, tertiary sign out |
| **MyCharts: no recovery (D-04)** | `ErrorState` with retry — fixes the dead end |
| JournalList / Profile: `#007AFF` retry link | `ErrorState` with `Button` tertiary |
| Chart route guards | `ErrorState` with a real action; the invalid-time-zone branch currently dead-ends |
| Chart save warning | Stays inline and non-blocking — **current behavior is correct** |

**Rule: no error state without a recovery action.**

### 9.3 Empty — new `EmptyState` primitive

`heading` title, `bodySmall` supporting line, optional action.

| Surface | Action |
| --- | --- |
| MyCharts | "Create a guest chart" — currently tells the user where to go but does not take them there |
| JournalList | "Write your first entry" |
| Aspects / Houses | No action; explanatory copy only. The existing houses copy is good and is kept |

### 9.4 Mapping

`LoadingState` (6 consumers) is retained and standardized. `ErrorState` and
`EmptyState` are **new files in `components/ui/`**, following the existing
primitive conventions — not a new library.

---

## 10. Touch Targets and Accessibility

### 10.1 The problem

**13 accessibility props exist in the whole app**, across 3 files. Of 42
interactive elements, **38 carry none**. No back control anywhere meets 48 dp,
and `hitSlop` is used nowhere.

`TodayEnergyCard` and `WeeklyForecastCard` are the compliance reference — they
already do this correctly.

### 10.2 Requirements

| Requirement | Rule |
| --- | --- |
| Touch target | **≥ 48 × 48 dp**, always. Use `hitSlop` when the visual is smaller |
| Role | Every interactive element declares `accessibilityRole` |
| Label | Every interactive element has a meaningful `accessibilityLabel` |
| **Icon-only controls** | **Must** have a label. `‹`, `›`, `✕`, `˄`, `˅` are announced as punctuation today |
| Expandable | `accessibilityState={{ expanded }}` |
| Disabled | `accessibilityState={{ disabled: true }}` |
| Selected | `accessibilityState={{ selected: true }}` |
| Live regions | Error and loading text use `accessibilityLiveRegion="polite"` |
| Contrast | 4.5:1 body; 3:1 for large text (≥ 18 px, or ≥ 14 px bold) and UI borders |
| Grouping | Card headers use `accessible` grouping so a card is not read as fragments |

### 10.3 Specific fixes owed

| Element | Current | Required |
| --- | --- | --- |
| Back `‹` × 6 implementations | 24×33 to 40×36 dp, unlabeled | 48×48 via `hitSlop`, `accessibilityLabel="Go back"` |
| Interpretation `‹` / `›` / `✕` | 40×40, unlabeled | 48×48, "Previous", "Next", "Close" |
| `ChartCompass` chevron | unlabeled | Labeled + `expanded` state |
| `ChoiceRow` | no role/state | `radio` role + `selected` state |
| Planet / house rows | no role/label | `button` role, label reading placement and meaning |
| Journal long-press delete | **no discoverable affordance** | Visible action or an accessibility action |

---

## 11. Icons

**`lucide-react-native` is the functional UI icon system.** Approved; installed
in Slice 4, not before.

It depends on `react-native-svg`, **already a dependency at 15.12.1** — the same
library the background variants in §6 use. No additional rendering dependency is
introduced.

Import icons **individually where practical**:

```tsx
// preferred — one icon, one import
import { ChevronLeft } from 'lucide-react-native'

// avoid — pulls the barrel
import * as Icons from 'lucide-react-native'
```

### 11.1 Sizing

| Token | Size | Use |
| --- | --- | --- |
| `icon.sm` | 16 | Inline with `bodySmall` |
| `icon.md` | 20 | Default, inline with `body` |
| `icon.lg` | 24 | Headers, actions |
| `icon.xl` | 28 | Hero, empty states |

Stroke width `1.75` at `sm`/`md`, `1.5` at `lg`/`xl` — thinner strokes at larger
sizes keep optical weight even. Color is always a semantic token, never a
literal. The optical container is **always ≥ 48 dp** regardless of glyph size.

### 11.2 What is an icon, and what is not

Three categories, with different rules:

| Category | Treatment |
| --- | --- |
| **Functional controls** | `lucide-react-native`. **Never emoji, never text glyphs.** |
| **Astrological and zodiac glyphs** (`☉ ☽ ♀ ♂ ♈ ♉ …`) | **Preserved as meaningful celestial symbols.** They are content, not chrome — they carry astrological meaning and have no Lucide equivalent. Rendered as text, styled through typography tokens. |
| **Decorative emoji** | **Removed.** |

### 11.3 Replacements owed

| Current | Location | Becomes |
| --- | --- | --- |
| `‹` back, ×6 implementations | `ChartHeader`, `ProfileHeader`, `MyCharts`, `JournalList`, `JournalEditor`, `CheckEmail`, `CompleteProfile`, `CreateGuestChart` | `ChevronLeft`, `icon.lg` |
| `‹` / `›` pager nav | `InterpretationModal` | `ChevronLeft` / `ChevronRight`, `icon.lg` |
| `✕` close | `InterpretationModal` | `X`, `icon.lg` |
| `˄` / `˅` chevron | `ChartCompass` | `ChevronUp` / `ChevronDown`, `icon.md` |
| `+` prefix on "Share your thoughts" | `JournalListScreen` | `Plus`, `icon.md` |
| `🌌` in "Welcome to Naksha 🌌" | `DashboardScreen` | Removed or replaced with a standardized icon |
| `☀️` Sun row, `🌙` Moon row | `DashboardScreen` "Your Signs" card | Replaced with the **astrological glyphs** `☉` / `☽`, which are the correct symbols and already used by `ChartWheel` and `ChartCompass` |

The Dashboard emoji replacements happen **during the Dashboard redesign slice**,
not earlier — they are visual changes, not defect fixes.

Note the `☀️` → `☉` case specifically: this is not "emoji to icon", it is
**emoji to the correct astrological glyph**, and it makes the Dashboard
consistent with the chart surface, which already renders `☉` and `☽`.

### 11.4 Accessibility

Lucide icons render as SVG and are **invisible to screen readers by default**.
Every icon-only control must therefore carry an `accessibilityLabel` on its
touchable container — see §10.3. Decorative icons inside a labelled control take
`accessibilityElementsHidden` so they are not announced twice.

## 12. Motion and Reduced Motion

V1 has **no motion system and no continuous animation**, and the approved
background approach is entirely static. This section therefore constrains rather
than introduces.

| Rule | |
| --- | --- |
| Backgrounds | Static. No loop, no timer, no `Animated` driver |
| Transitions | Platform default stack animation. No custom transitions in this migration |
| Modal | `animationType="slide"` — **unchanged**, part of the preserved interaction behavior |
| Press feedback | Opacity only. No scale, no spring |
| Duration budget | If any motion is later approved: 150 ms enter, 120 ms exit |

### Reduced motion

Read `AccessibilityInfo.isReduceMotionEnabled()` once at root and expose it
through context. When enabled:

1. Modal `animationType` becomes `"none"`.
2. Backgrounds fall back to `flat`.
3. Press feedback remains — it is state indication, not decoration.

Because the system has no continuous motion, reduced-motion support is cheap and
should be built in from Slice 2 rather than retrofitted.

---

## 13. Small Screens and Dynamic Text

### 13.1 Targets

| Axis | Target |
| --- | --- |
| Minimum width | **360 dp** |
| Minimum height | 640 dp |
| Font scale | Legible and unclipped through Android's **largest** setting |

### 13.2 Fixed-width columns must go

| Location | Current | Replacement |
| --- | --- | --- |
| `PlanetPositionsList` | `width: 150` | `flex` with `minWidth`, wrapping allowed |
| `HousesList` | `width: 150` | as above |
| `AspectsList` | `width: 150` | as above |
| `InfoRow` (Profile) | `width: 110` | `flexShrink` with a minimum |
| `WeeklyForecastCard` | `width: 38` | `minWidth`, allowed to grow |
| `LoadingState` | `minWidth: 160` | Removed |

Tabular numerals (§4.2 `numeric`) keep numeric columns aligned **without** a
fixed pixel width — which is what the fixed widths and the `monospace` cast were
compensating for.

### 13.3 Text-scaling policy

| Content | `maxFontSizeMultiplier` |
| --- | --- |
| Interpretation body | **none** — scales fully. It is the reading surface |
| Guidance and general body | 2.0 |
| Titles and headings | 1.6 |
| Labels, captions, buttons | 1.5 |
| Numeric / degree columns | 1.4 |

No `allowFontScaling={false}` anywhere. Scaling is never disabled — it is bounded
where unbounded scaling would break layout.

### 13.4 Line clamping

16 `numberOfLines` clamps exist, several on primary content.

- **Remove** from primary content: planet, house, and aspect summaries.
- **Keep** on list previews where truncation is the intent: journal entry
  preview, collapsed guidance sections.
- Never clamp a full interpretation body.

---

## 14. Migration Summary

Files that already exist and are **modified**, not replaced:

| File | Change |
| --- | --- |
| `components/ui/theme.ts` | Expanded to semantic roles; all six existing keys kept as deprecated aliases |
| `components/ui/uiStyles.ts` | Consumers migrated, then retired |
| `components/ui/formStyles.ts` | Folded in; unused `pickerWrap` deleted |
| `components/ui/AppText.tsx` | Becomes the typography-role surface; `MutedText` / `TitleText` kept |
| `components/ui/Button.tsx` | Variants and sizes added; contract preserved |
| `components/ui/Card.tsx` | Becomes the single card; absorbs `uiStyles.card` |
| `components/ui/LoadingState.tsx` | Standardized |
| `components/ui/FormField.tsx`, `TextField.tsx` | Error and focus states |

**New** files in `components/ui/` — following existing conventions:
`ErrorState.tsx`, `EmptyState.tsx`, `Stack.tsx`, `Background.tsx`, `Icon.tsx`
(a thin wrapper enforcing the §11.1 size and stroke tokens), and
`ScreenHeader.tsx` (the single shared in-screen header, replacing six ad-hoc
top rows).

**Approved dependencies, installed in the slice that needs them — not now:**

| Dependency | Slice | Note |
| --- | --- | --- |
| `expo-font` | 3 | Font loading |
| `expo-splash-screen` | 3 | Load gating |
| `lucide-react-native` | 4 | Functional icons; peer-depends on the already-present `react-native-svg` |

**Deleted:** `components/ui/Screen.tsx` — zero importers.

Not changed by this system: chart calculation, chart data, guidance builders,
lexicon content, Supabase contracts, persistence, auth, `RootStackParamList`,
linking config, and the interpretation modal's interaction behavior.

---

## 15. Remaining Open Questions

Resolved since first draft: serif choice (Cormorant Garamond SemiBold
provisional, EB Garamond fallback — §4.4); font dependencies (approved — §4.4);
icon strategy (`lucide-react-native` — §11); Dashboard emoji (replaced during
the Dashboard slice — §11.3); the gold ceiling (a review heuristic, not a
measurement — §1.2).

Still open:

1. **Header mechanism detail.** One shared in-screen header primitive is
   decided, and navigator headers will not be shown alongside it. What remains is
   the primitive's own composition: title truncation policy, and the right-slot
   convention across the four shapes in use today (empty, "Edit" link, save
   pill, none). A Slice 5 design decision.
2. **Cormorant vs. EB Garamond.** Pre-approved either way; decided by device
   evidence in Slice 3, not by further discussion.
3. **`accent.bright` scope.** Currently permitted for hero glyph and focused
   planet only. Confirm this is not also wanted for the active pager indicator.
