# Naksha Forecast + Guidance Library v1 — Plan (Claude)

Generated: 2026-06-20
Author: Claude (Opus) — read-only planning. No code changed.
Scope: design a deterministic, Naksha-owned forecast + guidance content layer that strengthens daily/weekly guidance and shadow-work primitives **before** AI integration, so AI later synthesizes from Naksha primitives instead of inventing generic astrology.

Baseline at planning time: 19 suites / 106 tests; typecheck/lint/`git diff --check` pass.

Inputs inspected: `lib/dailyTransits.ts`, `lib/astro.ts`, `lib/charts.ts`, `lib/chartPageBuilders.ts`, `lib/chartInterpretation.ts`, `lib/lexicon/*`, `screens/DashboardScreen.tsx`, `components/charts/*`, `lib/journals.ts`, `docs/Feature-List.md`, `docs/naksha-v1-gap-audit.md`, `docs/naksha-v1-gap-audit-codex.md`, `docs/naksha-codebase-handoff.md`.

---

## 1. Executive Summary

Naksha already has a **complete, deterministic natal interpretation lexicon** (sign, planet-in-sign, planet-in-house, house, house-sign, and generic aspect meanings — ~2,994 lines, all hand-written `{short, long}` blocks). What it lacks is a **transit/forecast/guidance content layer**: today's card is a thin three-field object (`transitSunSign`, `transitMoonSign`, `strongestAspect`) whose only interpretive text is the *generic* aspect meaning reused from the natal lexicon. There is no transit meaning, no mood/warning/opportunity framing, no weekly aggregation, and no shadow-work prompt library.

The recommended approach is **deterministic composition, not a 250-entry hand-written transit table**. Naksha already owns three high-value primitives — *planet tone*, *aspect tone*, and *natal-domain* (sign/house). A small set of tone/domain tables plus deterministic templates can produce structured `DailyGuidance` and `WeeklyForecast` objects (mood / warning / opportunity / transit summary / reflection prompt / suggested practice) that are coherent, on-brand, and **fully testable**, while reserving longform prose for AI later. The library should emit **structured objects** (typed fields), and the UI should render those fields; AI v2 consumes the *same* objects as grounded context rather than re-deriving astrology.

This is intentionally additive and low-risk: no changes to chart math, canonical identity, or the existing natal lexicon. It is buildable in five ordered slices, the first of which (transit tone tables + `DailyGuidance`) immediately upgrades the existing Today's Energy card.

---

## 2. Current Lexicon Inventory

All under `client/lib/lexicon/`, all deterministic, all `{ short, long }` (`Interpretation`) blocks. Coverage verified by counting `short:` entries.

| Module | File(s) | Coverage | Count |
|---|---|---|---|
| Shared types | `types.ts` | `ZodiacName`, `HouseNumber`, `AspectType`, `PlanetKey`, `Interpretation`, `maybe()` | — |
| Sign archetypes | `signs/index.ts` | 12 signs + `zodiacNameFromLongitude`, `signIndexFromLongitude` | 12 |
| Planet-in-sign | `planets/index.ts` | 10 planets × 12 signs | 120 |
| Planet-in-house | `planetHouses/meanings.ts` | 10 planets × 12 houses | 120 |
| House (generic) | `houses/meanings.ts` | 12 houses | 12 |
| House-sign (sign on cusp) | `houses/signMeanings.ts` | 12 houses × 12 signs | 144 |
| Aspect (generic) | `aspects/index.ts` | 5 aspect *types* only (conj/opp/square/trine/sextile) | 5 |
| Barrel | `index.ts` | re-exports all getters | — |

**Key gap visible here:** aspect meanings are **type-level only** — there is no transit-aware, planet-pair-aware, or directional (transit→natal) content anywhere.

---

## 3. Current Today's Energy Behavior

- `lib/astro.ts`: `computeTransitPlanets(dateUTC)` is literally `computeNatalPlanets(dateUTC)` (positions at a moment). `findAspects` supports **medium orb only**, 5 aspect types, no applying/separating, no speed, **no retrograde**, no moon phase.
- `lib/dailyTransits.ts`: limits transit emphasis to fast planets `[Moon, Sun, Mercury, Venus, Mars]`; `findDailyTransitAspects` cleanly separates transit vs natal identities (so same-name planets don't collapse); `findStrongestDailyTransitAspect` picks lowest-orb with deterministic tie-break; `buildTodayEnergy` returns:
  ```ts
  type TodayEnergy = {
    transitSunSign: ZodiacName | null
    transitMoonSign: ZodiacName | null
    strongestAspect: DailyTransitAspect | null   // aspectMeaning = generic aspect short
  }
  ```
- `DashboardScreen.tsx` renders it raw: "Transit Moon: X", "Transit Sun: Y", and one line `Transit <planet> <aspect> natal <planet> · <orb>°` plus the generic aspect short string. No mood/warning/opportunity, no prompt, no practice.

**Assessment:** the *plumbing* (transit/natal identity separation, deterministic strongest-aspect selection, fast-planet scoping) is solid and reusable. The *content/structure* layer on top is the gap.

---

## 4. Missing Content Library Pieces

1. **Transit meaning layer** — interpretation for "transit planet [aspect] natal planet" beyond the generic aspect blurb. (Recommend composed, not 250 hand-written entries.)
2. **Tone classification** — per-aspect tone (harmonious/hard/neutral) and per-transit-planet tone (e.g. Saturn=caution, Jupiter=opportunity, Mars=drive/friction, Venus=ease, Mercury=mental, Moon=mood, Sun=vitality).
3. **Mood / warning / opportunity framing** — deterministic derivation from tone + transit Moon sign + strongest aspect.
4. **Reflection prompt library** — short journaling prompts keyed by transit planet / aspect tone / natal domain.
5. **Suggested practice library** — small ritual/affirmation/grounding suggestions keyed by tone.
6. **Weekly aggregation** — multi-day rollup of strongest transits into weekly themes, daily themes, suggestions, prompts.
7. **Shadow-work prompt primitives** — prompts derived from natal hard aspects / Saturn-Pluto placements and from current hard transits.
8. **Deferred astro signals** — retrograde detection, moon phase, applying/separating, slow-planet transits. (Needed for richer forecasts; not v1.)

---

## 5. Proposed File / Module Structure

Keep new content under the existing lexicon for **data**, and a new `guidance/` module for **composition logic**. No edits to existing natal lexicon files.

```
client/lib/lexicon/
  transits/
    tone.ts            # ASPECT_TONE, TRANSIT_PLANET_TONE, NATAL_DOMAIN tables (data only)
    templates.ts       # deterministic phrase templates for composed transit meaning
    index.ts           # getTransitAspectMeaning(transit, aspect, natal) -> Interpretation
  prompts/
    reflection.ts      # REFLECTION_PROMPTS keyed by tone / planet
    practices.ts       # SUGGESTED_PRACTICES keyed by tone
    shadow.ts          # SHADOW_PROMPTS keyed by natal/transit signal
    index.ts

client/lib/guidance/
  types.ts             # GuidanceTone, DailyGuidance, WeeklyForecast, etc. (see §6)
  dailyGuidance.ts     # buildDailyGuidance(natalPlanets, dateUTC) -> DailyGuidance
  weeklyForecast.ts    # buildWeeklyForecast(natalPlanets, weekStartUTC) -> WeeklyForecast
  shadowPrompts.ts     # buildShadowPrompts(chart, transits) -> ShadowPrompt[]
  index.ts             # barrel

client/lib/guidance/__tests__/
  dailyGuidance.test.ts
  weeklyForecast.test.ts
  shadowPrompts.test.ts
client/lib/lexicon/transits/__tests__/
  transitMeaning.test.ts
```

`dailyTransits.ts` stays as the low-level transit/aspect finder; `guidance/dailyGuidance.ts` builds *on top of it* (composition over duplication). `DashboardScreen` switches from rendering `TodayEnergy` to rendering `DailyGuidance` (which can embed the existing `TodayEnergy` fields for backward continuity).

---

## 6. Proposed TypeScript Types

All additive; reuse existing `Interpretation`, `ZodiacName`, `PlanetKey`, `AspectType`, `DailyTransitAspect`.

```ts
// lib/guidance/types.ts
export type GuidanceTone = 'flow' | 'tension' | 'amplify' | 'neutral'
// flow = trine/sextile; tension = square/opp; amplify = conj; neutral = fallback

export type TransitMeaning = Interpretation & {
  tone: GuidanceTone
  transit: PlanetKey
  natal: PlanetKey
  aspect: AspectType
}

export type ReflectionPrompt = { id: string; text: string; tone: GuidanceTone }
export type SuggestedPractice = {
  id: string
  kind: 'grounding' | 'affirmation' | 'ritual' | 'rest' | 'action'
  text: string
  tone: GuidanceTone
}

export type DailyGuidance = {
  dateUTC: string                 // ISO day
  transitSunSign: ZodiacName | null
  transitMoonSign: ZodiacName | null
  strongestAspect: DailyTransitAspect | null
  tone: GuidanceTone
  mood: string                    // from transit Moon sign + tone
  warning: string | null          // present when tension/amplify-hard
  opportunity: string | null      // present when flow/amplify-soft
  transitSummary: string          // composed one-paragraph deterministic summary
  reflectionPrompt: ReflectionPrompt
  suggestedPractice: SuggestedPractice
}

export type WeeklyDayTheme = {
  dateUTC: string
  tone: GuidanceTone
  theme: string
  strongestAspect: DailyTransitAspect | null
}

export type WeeklyForecast = {
  weekStartUTC: string
  weekEndUTC: string
  days: WeeklyDayTheme[]
  strongestTransits: DailyTransitAspect[]   // top N across the week, de-duped
  weeklyThemes: string[]
  suggestions: string[]
  journalPrompts: ReflectionPrompt[]
}

export type ShadowPrompt = {
  id: string
  source: 'natal' | 'transit'
  trigger: string                 // e.g. "Saturn square natal Moon"
  prompt: string
  tone: GuidanceTone
}
```

---

## 7. Daily Guidance v1 Design

`buildDailyGuidance(natalPlanets, dateUTC, orbMode='medium'): DailyGuidance`

Deterministic pipeline:
1. Call existing `buildTodayEnergy(...)` to get transit Sun/Moon sign + strongest aspect (reuse, don't reimplement).
2. **Tone** = `ASPECT_TONE[strongestAspect.type]` (trine/sextile→`flow`, square/opp→`tension`, conj→`amplify`), or `neutral` when no aspect is exact.
3. **Mood** = template from `transitMoonSign` archetype (pull `SIGN_MEANINGS[moonSign].short`) blended with tone — e.g. "An emotionally {moon-flavor} day with an undercurrent of {tone-word}."
4. **Warning / opportunity** = tone-gated: `tension`/hard-`amplify` populate `warning`, `flow`/soft-`amplify` populate `opportunity`; the other is `null`. Text composed from `TRANSIT_PLANET_TONE[transit]` + natal-planet domain.
5. **transitSummary** = composed paragraph from `getTransitAspectMeaning(transit, aspect, natal)` (see §5 transits module) — built from templates, not free prose.
6. **reflectionPrompt** = deterministic pick from `REFLECTION_PROMPTS` filtered by tone + transit planet (stable selection by hashing dateUTC so it's stable within a day, testable).
7. **suggestedPractice** = deterministic pick from `SUGGESTED_PRACTICES` filtered by tone.

Design rules: every field is pure and deterministic given `(natalPlanets, dateUTC)`. No randomness — "pick" uses a stable index derived from the date so tests can assert exact output. No network, no AI.

---

## 8. Weekly Forecast v1 Design

`buildWeeklyForecast(natalPlanets, weekStartUTC, orbMode='medium'): WeeklyForecast`

1. For each of 7 days, call `buildDailyGuidance` (or at least `buildTodayEnergy` + tone) → `WeeklyDayTheme`.
2. **strongestTransits** = collect each day's strongest aspect, de-dupe by `(transit, aspect, natal)` keeping lowest orb, sort, take top 3–5.
3. **weeklyThemes** = derive 1–3 themes from the dominant tone across the week + the recurring transit planets (e.g. a week with 3 Mars-square days → "friction/assertion theme").
4. **suggestions** = tone-weighted picks from `SUGGESTED_PRACTICES`.
5. **journalPrompts** = 2–3 `ReflectionPrompt`s spanning the week's tones.
6. Week range surfaced as `weekStartUTC`/`weekEndUTC`.

Deterministic, no AI. This is the first feature that needs a clear "what is the user's week start?" product decision (Sun vs Mon, user tz vs UTC) — flag in implementation, default to user timezone Monday start.

---

## 9. Shadow Prompt Library v1 Design

`buildShadowPrompts(natalPlanets, planetHouses, dateUTC): ShadowPrompt[]`

Two deterministic sources:
- **Natal**: hard natal aspects (square/opp) involving Moon, Saturn, Pluto, Mars → map to a `SHADOW_PROMPTS` entry keyed by `(planetPair, aspectTone)`. Also Saturn/Pluto house placement → a growth-edge prompt.
- **Transit**: today's strongest *hard* transit aspect → a "what is being activated" prompt.

Each prompt is short, introspective, and tone-tagged. The library is a fixed table keyed by signal; selection is deterministic. No AI generation in v1 — these are the *primitives* AI will later expand.

Volume target for v1: ~24–40 curated prompts (enough to cover the hard-aspect × core-planet space) rather than exhaustive.

---

## 10. How This Later Feeds AI Chat

The entire point is **grounding**. When AI chat lands:
- AI receives the **structured objects** (`DailyGuidance`, `WeeklyForecast`, `ShadowPrompt[]`, plus existing natal interpretation pages) as JSON context — not prose to paraphrase.
- AI's job becomes *synthesis and personalization* of Naksha-owned primitives (tone, transit summary, natal domain), drastically reducing hallucinated/generic astrology and keeping voice consistent.
- The deterministic `transitSummary`/`mood`/`warning`/`opportunity` fields act as a **factual spine**; AI adds warmth/length/dialogue.
- Because every primitive is pure and typed, the same object can be (a) rendered in UI, (b) embedded in an AI prompt, (c) cached, and (d) unit-tested — one source of truth.

Explicitly: keep **astrology determinism in code**, hand **language/empathy/length to AI**. Never let AI compute aspects or invent placements.

---

## 11. Test Plan

All pure functions → high-value, cheap tests. Target ~5–6 new suites (keeps the 19→~25 trajectory honest).

- `lexicon/transits/__tests__/transitMeaning.test.ts`: tone mapping per aspect type; composed meaning is non-empty and stable for a sample `(transit, aspect, natal)`; fallback for unknown combos.
- `guidance/__tests__/dailyGuidance.test.ts`: fixed-date determinism (same input → identical output); tone gating (tension populates warning + null opportunity, flow vice-versa); no-aspect day yields `neutral` + safe fields; reflection/practice picks are stable for a given date.
- `guidance/__tests__/weeklyForecast.test.ts`: 7-day span produces 7 day themes; strongestTransits de-dup + ordering; themes/suggestions/prompts non-empty; week range correct.
- `guidance/__tests__/shadowPrompts.test.ts`: natal hard aspect → expected prompt; no hard aspects → empty or gentle default; transit-sourced prompt appears on a hard-transit day.
- Keep all existing 106 tests green; no changes to natal lexicon or chart math.
- Use fixed UTC dates + a fixed sample natal chart fixture for determinism (mirror the existing `dailyTransits.test.ts` style).

---

## 12. Implementation Slices (Recommended Order)

1. **Transit tone tables + composed transit meaning** (`lexicon/transits/*`). Pure data + `getTransitAspectMeaning`. Tests. No UI change yet. *Unlocks everything else.*
2. **DailyGuidance** (`guidance/dailyGuidance.ts` + types). Build the structured object from existing `buildTodayEnergy` + tone tables. Tests. Then swap `DashboardScreen`'s Today's Energy card to render mood/warning/opportunity/summary/prompt/practice. *Immediate visible upgrade.*
3. **Reflection + practice libraries** (`lexicon/prompts/reflection.ts`, `practices.ts`). Wire into DailyGuidance fields. Tests. (Can merge into slice 2 if small.)
4. **WeeklyForecast** (`guidance/weeklyForecast.ts`). Aggregate dailies. Tests. Add a Dashboard or dedicated weekly surface (UI scope per product). Decide week-start convention.
5. **Shadow prompt library** (`lexicon/prompts/shadow.ts`, `guidance/shadowPrompts.ts`). Natal + transit sourced. Tests. Surface in journaling entry-point (e.g. "prompt of the day" seed into `JournalEditorScreen`).

Each slice is independently committable, additive, and verified with `typecheck`/`test`/`lint`/`git diff --check`. None touches chart identity, the natal lexicon, or auth.

---

## 13. Explicit Deferrals

- **AI integration of any kind** — this plan deliberately precedes it. No LLM dependency added.
- **Retrograde detection, moon phase, applying/separating, planetary speed** — require astro-engine work; defer to a "transit signals v2" slice. v1 forecasts use position + aspect only.
- **Slow-planet transits (Jupiter→Pluto) and transit-to-house** — v1 stays on fast-planet transit-to-natal-planet to match existing `dailyTransits` scoping.
- **Additional house systems / zodiac / orb modes** — unchanged; still Whole Sign / Tropical / medium only.
- **Exhaustive 250-entry hand-written transit table** — rejected in favor of composition; an override table for a few high-signal combos is optional, not v1-blocking.
- **Notifications / push of daily/weekly guidance** — separate feature (needs `expo-notifications` + scheduling); the library produces the content but delivery is out of scope.
- **Persisted/saved guidance history & tagging** — defer; v1 computes on demand. (Saved AI readings remain a post-AI concern.)
- **Localization / multi-language prompt content** — defer.

---

### Bottom line
Build the deterministic forecast + guidance library as **typed, pure, testable primitives** (tone tables → composed transit meaning → `DailyGuidance` → `WeeklyForecast` → `ShadowPrompt[]`), upgrade Today's Energy in slice 2 for immediate value, and keep astrology determinism in code so AI later personalizes Naksha-owned facts instead of inventing astrology. No chart-math, natal-lexicon, or auth changes; ~5 additive slices and ~5 new test suites.
