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
| `accent.bright` | `#E3C078` | **Reserved** for the hero glyph or the currently focused planet. Nothing else. |
| `accent.muted` | `rgba(201,164,92,0.14)` | Accent fills, selected-row wash. |
| `accent.border` | `rgba(201,164,92,0.38)` | Focus ring, selected border. |

**"Restrained" means enforceable rules, not taste.** Gold is permitted only for:

1. The **one** primary action on a screen.
2. Focus and selected states.
3. Section eyebrow labels in the interpretation reading surface.
4. Chart-wheel planet glyphs and the focal-planet halo.
5. The active page indicator in the interpretation pager — using `accent`, **not** `accent.bright`.

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

**The glow palette.** The accents above are tuned to read as *ink* on deep
navy, which is the wrong job for a large low-opacity wash: as a halo, Pluto and
Mars all but vanished while Sun blazed. `theme.planetGlow` is the same ten hues
lifted to a common high luminance, and it owns every luminous surface — the
selected planet's halo and stable ring, and the halos on both endpoints of a
selected aspect. The identity survives; no single planet dominates.

| Planet | Accent (`theme.planet`) | Glow (`theme.planetGlow`) |
| --- | --- | --- |
| Sun | `#E8B44A` | `#FFD98A` |
| Moon | `#B9C2D6` | `#DCE4F5` |
| Mercury | `#A8B0C8` | `#CFD6EA` |
| Venus | `#E0BE96` | `#F4D9B8` |
| Mars | `#C7563A` | `#F08A6A` |
| Jupiter | `#D6B98C` | `#EFD7B0` |
| Saturn | `#CBB577` | `#E8D49B` |
| Uranus | `#7FC4C4` | `#A9E4E4` |
| Neptune | `#7D94D9` | `#A6B8F0` |
| Pluto | `#A98A7C` | `#D3B4A5` |

The two are not interchangeable. Ink stays ink (glyph tints, the inner accent
fill); glow stays glow (halos, rings). Using a glow value as text or a fill at
full opacity breaks the restraint the accent table exists to enforce.

**Usage rules — deliberately narrow:**

1. **One planet accent at a time, except for a selected aspect**, which lights
   both of its participants. Driven by the existing
   `SpaceProvider.focusedPlanet` contract plus the chart's selection state.
   The exception is the point of the rule rather than a breach of it: an
   aspect *is* a relationship between two bodies, and showing the line without
   showing which two it joins leaves the reader counting round the wheel. A
   selected house lights no planet at all.
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

#### Sourcing

`expo-font` is the loader; **it does not supply the typefaces**. The families
come from the Expo Google Fonts packages.

| Package | Provides |
| --- | --- |
| `@expo-google-fonts/inter` | Inter font assets |
| `@expo-google-fonts/cormorant-garamond` | Cormorant Garamond font assets |
| `expo-font` | `useFonts` loader |
| `expo-splash-screen` | Load gating |

Load exactly these four families — no more:

```
Inter_400Regular
Inter_500Medium
Inter_600SemiBold
CormorantGaramond_600SemiBold
```

**Do not install EB Garamond alongside Cormorant.** It is a *replacement*
candidate, not a parallel option — installed only if Cormorant fails Android
device review in Slice 3. Shipping both would double the serif payload for no
delivered value.

None of these four packages is currently in `client/package.json`. All are
approved; all are installed in Slice 3, not before.

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

**Every size sits within a ≥ 48 dp touch area.** The `sm` size has a 40 dp
*visual*; its `Pressable` must still present at least 48 dp. A visually compact
control is allowed — a compact touch target is not.

`hitSlop` alone is **not** sufficient to make a 40 dp control accessible. See
§10.2.

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
| Touch target | **Every standard interactive control has an actual or enclosing `Pressable` touch area of at least 48 × 48 dp.** A visually compact control may sit *inside* that 48 dp container. `hitSlop` may extend a target that is already close to compliant — it is **not** a substitute for a real 48 dp touch area, and must not be used to justify a 40 dp button |
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
| Back `‹` × 6 implementations | 24×33 to 40×36 dp, unlabeled | `ChevronLeft` at `icon.lg` inside a **48×48 dp `Pressable`**, `accessibilityLabel="Go back"` |
| Interpretation `‹` / `›` / `✕` | 40×40, unlabeled | Lucide icons inside **48×48 dp `Pressable`s**; "Previous", "Next", "Close" |
| `ChartCompass` chevron | unlabeled | Labeled + `expanded` state |
| `ChoiceRow` | no role/state | `radio` role + `selected` state |
| Planet / house rows | no role/label | `button` role, label reading placement and meaning |
| Journal long-press delete | **no discoverable affordance** | Visible action or an accessibility action |

### 10.4 Direct manipulation on the chart wheel

Added in Slice 6B and revised there after device review. The wheel is the one
surface in the app with continuous direct manipulation, so its rules are
written down rather than left to the implementation.

| Rule | |
| --- | --- |
| Zoom | Pinch, continuous, clamped to 1x-3x. No discrete zoom buttons. The focal point stays under the fingers, so the detail being pinched does not slide away. |
| Pan | Enabled only while zoomed, and limited to the overflow the zoom created, so the wheel cannot be flung off-screen and left there. |
| Reset | Double tap. |
| Accessibility | The same three operations are exposed as `zoomIn` / `zoomOut` / `resetZoom` accessibility actions, because a pinch is not reachable by every user. |
| Gesture composition | Pinch and pan are recognised **simultaneously**, and that pair is **raced** against the tap group. Racing is what keeps a two-finger pinch from queueing behind a one-finger tap recogniser. Taps are bounded by movement and duration rather than by pointer count. |
| Overlays | No full-screen `Pressable` over the wheel. One claimed every touch through the responder system and stopped the pinch from ever starting. |

**Tap arbitration.** Three target types overlap on the same pixels, so the
order and the tolerances are part of the design, not an implementation
detail. A tap resolves as: planet, then house band, then aspect, then nothing.

| Target | Allowance | |
| --- | --- | --- |
| Planet | 48 dp control, radius 24 | Drawn inside the transformed wheel, so it is 48 wheel-local points at every scale. The control resolves the touch itself; the gesture layer defers to it rather than selecting a second time, which is what once made a tap in a cluster land on a neighbour. |
| Aspect, in the open field | 24 | Generous, because the stroke is only 1.2-2.0 wide. |
| Aspect, inside the house band | 6 | Tightened. Every aspect line **ends at a radius inside the house band**, so at the full corridor each endpoint claims the band around its own planet's longitude — and a wedge holding several planets had almost no surface left that resolved to a house. A tap placed *on* a line still takes the aspect, which is all a conjunction needs, its whole chord being in the band. |
| House band | Drawn ring plus 16 either side | The padding is what makes the house number itself a target. |

**Slop is screen-space.** Every allowance above is stated in points under the
finger and divided by the current scale before it is compared against
wheel-local geometry. Stated in wheel-local points instead, a corridor grows
with the drawing — at 3x the aspect band measured 72 points on screen — so
zooming in to separate crowded targets made them harder to tell apart, not
easier. The planet radius is the deliberate exception, for the reason in the
table above.

None of this touches chart calculation or geometry: hit testing reads the same
endpoint, radius and cusp numbers the wheel draws with, and computes nothing of
its own.

---

## 11. Icons

**`lucide-react-native` is confirmed as Naksha's functional icon library.**
Approved; installed in Slice 4, not before.

It covers back, edit, save, delete, journal, chevrons, account, calendar,
visibility, and every other functional control.

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

**All icons are wrapped through the shared `Icon` primitive**, never rendered
directly in a screen. `Icon` is what enforces the size and stroke tokens in
§11.1 and the accessibility posture in §11.4; a raw Lucide import in a screen
bypasses both.

```tsx
// preferred
<Icon glyph={ChevronLeft} size="lg" tone="primary" />

// avoid — bypasses size, stroke, and a11y policy
<ChevronLeft size={24} color="#F4EFE6" />
```

### 11.0 Expected coverage

| Function | Icon | Replaces |
| --- | --- | --- |
| Back | `ChevronLeft` | six `‹` text implementations |
| Next / previous | `ChevronRight` / `ChevronLeft` | pager `›` / `‹` |
| Close | `X` | `✕` |
| Expand / collapse | `ChevronDown` / `ChevronUp` | `˅` / `˄` |
| Edit | `Pencil` | "Edit" text link |
| Save | `Check` | save pills |
| Delete | `Trash2` | "Delete" text link |
| Journal | `NotebookPen` | — |
| Account | `UserRound` | — |
| Calendar / date | `Calendar` | `DateField` affordance |
| Time | `Clock` | `TimeField` affordance |
| Visibility | `Eye` / `EyeOff` | password reveal (does not exist today) |
| Add | `Plus` | `+` prefix |
| Location | `MapPin` | — |

Edit and Save may remain **text** actions in the header per §4 of the shell
policy; where they appear as icons elsewhere, these are the glyphs.

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

**Accessibility labels belong on the `Pressable` or `Button`, never on the
icon.** The icon is decorative; the control carries the meaning.

```tsx
// correct — the control is labelled, the icon is silent
<Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={...}>
  <Icon glyph={ChevronLeft} size="lg" />
</Pressable>

// wrong — labels the decoration, not the control
<Pressable onPress={...}>
  <Icon glyph={ChevronLeft} accessibilityLabel="Go back" />
</Pressable>
```

`Icon` therefore renders as non-focusable and hidden from assistive technology by
default (`accessibilityElementsHidden` / `importantForAccessibility="no"`), so an
icon inside a labelled control is never announced twice. This is a property of
the primitive, not something each call site has to remember.

## 11A. ScreenHeader Policy

One shared in-screen header primitive replaces the six ad-hoc top rows the audit
found (four different geometries, three titles disagreeing with their navigator
counterparts).

| Rule | |
| --- | --- |
| Title area | **Flexible.** Sized by content within the space left by the actions — never a fixed width |
| Title wrapping | **May wrap to two lines.** Truncation is the last resort, not the first |
| Layout | **No absolute positioning.** Actions and title occupy a flex row so the title can never overlap an action |
| Back action | **48 dp target** |
| Right action | **At least a 48 dp target** |
| Edit / Save | **May remain text actions** — they are clearer as words than as glyphs |
| Font scaling | Header **expands safely** under Android font scaling; it grows rather than clipping or overlapping |
| Navigator header | **Never displayed simultaneously.** One header, always |

The two-line allowance and the no-absolute-positioning rule exist for the same
reason: the current headers centre a `flex: 1` title between fixed-width side
slots with no truncation policy, which is exactly the arrangement that breaks
first under large font scale.

Unchanged by this primitive: native-stack routing, transitions,
`RootStackParamList`, route names, parameters, linking config, and Android
hardware-back behavior.

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
| Chart wheel selection | The single approved exception — see below |
| Duration budget | If any motion is later approved: 150 ms enter, 120 ms exit |

### The one exception: chart wheel selection

Approved after Slice 6B device review, and revised there. The chart wheel may
run **two** continuously animating values, and only under all of these
conditions.

| Condition | |
| --- | --- |
| Scope | The selected planet's outer halo; a selected aspect's stroke and bloom, plus the halos on **both** of its endpoint planets. Nothing else on the wheel, and nothing anywhere else in the app. |
| Count | Two shared values for the whole wheel: `glow` drives opacity, `trace` drives `strokeDashoffset`. Both are shared by every animated element, so the count does not grow with the number of planets or aspects. |
| Geometry | Never animated. Coordinates, radii, aspect endpoints and house boundaries are computed once and do not move. `strokeDashoffset` shifts where the dashes fall along a fixed line; it does not move the line. |
| Character — glow | A slow breath: `GLOW_MAX` 0.7 to `GLOW_MIN` 0.3 over 1800 ms, eased in-out, reversing. It never reaches zero — a selection that fades to invisible reads as a bug. |
| Character — dash | Linear travel of exactly one dash period per repeat, so the flow is continuous with no jump at the loop boundary. Per aspect type, from `ASPECT_MOTION`. |
| Thread | Reanimated on the UI thread, so it cannot stutter the chart scroll. |
| Lifetime | Cancelled when the selection changes or clears, and on unmount. |
| Reduced motion | When the preference is `true` **or unresolved**: `glow` pins at `GLOW_MAX`, `trace` at 0. The dash pattern is still drawn, so the selected state stays unmistakable while nothing moves. |

**Why dashes and not a tracer.** Three device rounds rejected earlier attempts
because each read as *an animation sliding over a line* rather than the line
itself carrying motion. The cause was structural: a solid stroke underneath a
moving highlight gives the eye a stationary rail to measure the highlight
against. The accepted design has **no solid stroke beneath** — the dashes *are*
the line, so what moves is the line. A selected aspect is exactly two layers:

| Layer | |
| --- | --- |
| `aspect-bloom-{i}` | Full length, `accent.base`, stroke width `+5`, opacity `glow x ASPECT_BLOOM_OPACITY` (0.25), so at most ~0.175. Faint enough that it never reads as a rail; present so the aspect stays legible between dashes. |
| `aspect-selected-{i}` | The line itself, `accent.bright`, stroke width `+0.6`, dashed per type, animated offset. |

**Motion differs by aspect type**, because the types mean different things and a
single tempo made them interchangeable:

| Type | dash / gap | duration | direction |
| --- | --- | --- | --- |
| Conjunction | 3 / 5 | 2400 ms | outward |
| Opposition | 11 / 9 | 1700 ms | inward |
| Square | 4 / 4 | 700 ms | outward |
| Trine | 13 / 8 | 2000 ms | outward |
| Sextile | 3 / 12 | 1250 ms | outward |

**Both endpoints light.** A selected aspect puts both participants in the
wheel's highlight set, each in its own `planetGlow` hue (§1.3) — the line says
there is a relationship, the two glowing markers say between what. Each gets
the same three layers a directly selected planet gets: an animated halo, a
planet-coloured inner accent, and a static ring that is never absent while the
selection stands. A selected house lights no planet.

This does **not** authorize continuous animation anywhere else. Backgrounds
remain static, screens remain static, and any further exception needs its own
review. The justification is narrow: a selected line among a dozen crossing
lines is genuinely hard to pick out when static, and slow motion identifies it
without moving anything the reader is trying to measure.

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
| `expo-font` | 3 | Loader only — supplies no typefaces |
| `expo-splash-screen` | 3 | Load gating |
| `@expo-google-fonts/inter` | 3 | `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold` |
| `@expo-google-fonts/cormorant-garamond` | 3 | `CormorantGaramond_600SemiBold` |
| `lucide-react-native` | 4 | Functional icons; peer-depends on the already-present `react-native-svg` |
| `react-native-gesture-handler` | 6B | Pinch, pan and tap recognition on the chart wheel |
| `react-native-reanimated` | 6B | The selection glow and dash travel, on the UI thread |
| `react-native-worklets` | 6B | Reanimated 4's worklet runtime; added by it, not chosen separately |

`@expo-google-fonts/eb-garamond` is **not** installed. It enters only as a
replacement for Cormorant if Slice 3's Android device review rejects it.

**Deleted:** `components/ui/Screen.tsx` — zero importers.

Not changed by this system: chart calculation, chart data, guidance builders,
lexicon content, Supabase contracts, persistence, auth, `RootStackParamList`,
linking config, and the interpretation modal's interaction behavior.

---

## 15. Remaining Open Questions

Resolved since first draft: serif choice (Cormorant Garamond SemiBold
provisional, EB Garamond fallback — §4.4); font dependencies and sourcing
(§4.4); icon library (`lucide-react-native` confirmed — §11); Dashboard emoji
(replaced during the Dashboard slice — §11.3); the gold ceiling (a review
heuristic, not a measurement — §1.2); `accent.bright` scope (§1.2);
touch-target policy (§10.2); `ScreenHeader` policy (§11A).

Still open:

1. **`ScreenHeader` right-slot inventory.** The policy is settled (§11A). What
   remains is per-screen: which routes carry a right action at all, and whether
   any need a second one. A Slice 5 mapping exercise, not an open design
   question.
2. **Cormorant vs. EB Garamond.** Pre-approved either way; decided by Android
   device evidence in Slice 3, not by further discussion. Only one ships.
