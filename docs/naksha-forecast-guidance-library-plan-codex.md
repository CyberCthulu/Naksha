# Naksha Forecast + Guidance Library v1 Plan - Codex

Generated: 2026-06-20
Scope: deterministic forecast, transit-guidance, reflection-prompt, and practice primitives to build before AI chat.
Status: planning only; no source changes are part of this document.

## 1. Executive Summary

Naksha already has a strong deterministic natal interpretation library. For the current ten planets, it contains complete planet-in-sign and planet-in-house coverage, complete house-sign coverage, generic house/sign archetypes, and five generic aspect meanings. The weak point is not natal prose. The weak point is the layer between calculated transits and useful guidance.

Today, `buildTodayEnergy` returns transit Sun sign, transit Moon sign, and one lowest-orb fast-transit-to-natal aspect. The Dashboard then displays a generic aspect sentence. It has no transit-planet meaning, natal-target meaning, transit-through-house context, mood/warning/opportunity selection, reflection prompt, practice, or weekly aggregation.

The recommended v1 architecture is a deterministic composition system:

1. Keep astronomy, aspect detection, date handling, ranking, and content selection as pure local TypeScript.
2. Add small curated content primitives for transit planets, natal target planets, aspect dynamics, sign mood, house focus, prompts, and practices.
3. Compose those primitives into typed daily and weekly guidance objects with stable source IDs and deterministic fallbacks.
4. Use sparse combination overrides only where generic composition is misleading, especially conjunctions and sensitive planet pairs.
5. Let future AI receive the resulting structured context. AI may summarize or converse; it must not invent chart placements, transit events, dates, or Naksha content sources.

This plan avoids a giant prose matrix. Five daily transit planets x ten natal planets x five aspects would already require 250 bespoke entries before signs or houses. A compositional library gives full coverage with a much smaller, testable content surface.

Recommended product boundary:

- Daily guidance v1: deterministic, local, personalized, and complete enough to render without AI.
- Weekly forecast v1: seven deterministic daily snapshots plus deduplicated weekly transit themes.
- Shadow prompts v1: curated reflective prompts and safe practices selected from natal/transit primitives.
- AI chat: deferred until these outputs are stable and can be passed as structured, provenance-aware context.

## 2. Current Lexicon Inventory

### Shared contracts

`client/lib/lexicon/types.ts` currently defines:

- `ZodiacName`: all 12 signs.
- `HouseNumber`: houses 1 through 12.
- `AspectType`: conjunction, opposition, square, trine, and sextile.
- `PlanetKey`: Sun through Pluto, ten planets total.
- `Interpretation`: `{ short, long }` prose.
- `maybe`: null-safe lookup helper.

### Existing content coverage

| Content area | File | Current coverage | Notes |
|---|---|---:|---|
| General sign archetypes | `lexicon/signs/index.ts` | 12 / 12 signs | Includes longitude-to-sign helpers. |
| Planet in sign | `lexicon/planets/index.ts` | 120 / 120 combinations | Ten planets x twelve signs. |
| Generic house meaning | `lexicon/houses/meanings.ts` | 12 / 12 houses | Broad life-area descriptions. |
| Sign on house cusp | `lexicon/houses/signMeanings.ts` | 144 / 144 combinations | Also includes sign-flavor fallbacks. |
| Planet in house | `lexicon/planetHouses/meanings.ts` | 120 / 120 combinations | Ten planets x twelve houses. |
| Generic aspect meaning | `lexicon/aspects/index.ts` | 5 / 5 aspect types | Aspect geometry only, not planet-pair or transit specific. |

### Current lookup and composition behavior

- `chartPageBuilders.ts` creates planet pages from planet-in-sign plus planet-in-house meanings.
- `chartPageBuilders.ts` creates house pages from generic house plus sign-on-house meanings.
- `chartInterpretation.ts` combines short planet-sign and planet-house text into list summaries.
- `AspectsList.tsx` shows the same generic aspect meaning for every planet pair of a given aspect type.
- `InterpretationModal.tsx` and `InterpretationCard.tsx` render the selected natal prose.

### Important inventory conclusion

Natal placement coverage is effectively complete for the current engine. New work should not rewrite or duplicate these files. Forecast work needs a separate guidance vocabulary because `Interpretation { short, long }` is descriptive natal prose, while forecast guidance needs tone, warning, opportunity, prompt, practice, ranking, provenance, and time-window metadata.

## 3. Current Today's Energy Behavior

`client/lib/dailyTransits.ts` currently:

- Uses `computeTransitPlanets`, which calculates the same ten bodies used for natal positions at a supplied UTC instant.
- Limits daily transit candidates to Moon, Sun, Mercury, Venus, and Mars.
- Builds separate transit and natal identities before calling the generic `findAspects` helper.
- Detects conjunction, opposition, trine, square, and sextile with the current medium fixed orbs.
- Sorts hits by lowest orb, then transit-planet priority, natal-planet name, and aspect type.
- Returns all daily hits, the strongest hit, or `TodayEnergy` containing:
  - transit Sun sign;
  - transit Moon sign;
  - one optional strongest transit-to-natal aspect;
  - the generic short meaning for its aspect type.

`DashboardScreen.tsx` currently:

- Calls `buildTodayEnergy(payload.planets, new Date())`.
- Does not pass natal houses, planet houses, chart time zone, or calculation preferences.
- Renders transit Moon sign, transit Sun sign, one aspect label/orb, and generic aspect prose.
- Owns the presentation inline inside an already large Dashboard screen.

Current tests correctly cover:

- Deterministic transit positions for a fixed instant.
- Transit/natal identity separation.
- Fast-planet filtering.
- Lowest-orb strongest-aspect selection.
- Sun/Moon sign output and generic meaning.
- No-aspect fallback.

The current implementation is a good low-level base. It should remain available while richer builders are added around it.

## 4. Missing Content Library Pieces

### 4.1 Transit planet meanings

Naksha needs guidance-oriented meanings for the bodies it uses as transits:

| Transit | Deterministic guidance domain |
|---|---|
| Moon | Mood, instinct, emotional weather, immediate needs |
| Sun | Focus, vitality, visibility, confidence |
| Mercury | Thinking, communication, choices, information |
| Venus | Values, relationships, pleasure, receptivity |
| Mars | Drive, assertion, conflict, action |
| Jupiter | Expansion, opportunity, belief, excess; useful for weekly v1 |
| Saturn | Structure, responsibility, limits, maturity; useful for weekly v1 |

Uranus, Neptune, and Pluto should stay out of weekly v1 headlines until longer-range transit handling exists. Their slow movement can otherwise dominate repeated weekly output.

Each transit-planet primitive should provide:

- stable content ID;
- focus/theme tags;
- neutral summary clause;
- constructive expression;
- overextension/watch-for clause;
- practice tags;
- prompt tags.

### 4.2 Natal target meanings

Current planet-in-sign prose describes a natal placement, but transit guidance also needs a concise description of what is being activated:

- Sun: identity, confidence, visibility, purpose.
- Moon: feelings, security, habits, belonging.
- Mercury: thoughts, communication, decisions.
- Venus: relationships, values, pleasure, money.
- Mars: drive, anger, courage, boundaries.
- Jupiter: growth, belief, opportunity, excess.
- Saturn: duty, limits, structure, mastery.
- Uranus: freedom, disruption, change.
- Neptune: imagination, compassion, ambiguity.
- Pluto: power, depth, release, transformation.

These should be compact domain primitives, not copies of natal long-form interpretations.

### 4.3 Aspect dynamics

The five generic aspect meanings need guidance metadata:

- tone: supportive, challenging, intensifying, or integrative;
- intensity weight;
- action mode: blend, balance, adjust, flow, or engage;
- warning modifier;
- opportunity modifier;
- prompt strategy;
- conjunction default behavior plus sparse planet-pair overrides.

A conjunction cannot always be treated as supportive or challenging. Its tone should default to intensifying and allow curated overrides for high-value pairs.

### 4.4 Transit sign guidance

The existing 12 sign archetypes are descriptive. Daily guidance needs concise fields such as:

- mood/atmosphere;
- constructive expression;
- shadow/watch-for;
- opportunity;
- grounding practice tags.

Moon-sign guidance should be the fallback mood source when no close transit aspect exists. Sun-sign guidance can provide background focus rather than competing with the primary transit event.

### 4.5 Transit through natal house guidance

When natal houses exist, current helpers can assign transit planets to those Whole Sign houses. Guidance should then include the activated life area.

V1 should use compositional house focus:

- 12 concise house focus primitives;
- transit-planet action combined with house domain;
- optional sparse transit-planet/house overrides later.

Do not reuse natal planet-in-house long prose verbatim. A natal placement describes a stable pattern; a transit through a house describes temporary emphasis.

### 4.6 Prompt and practice libraries

Missing reusable content includes:

- reflection prompts keyed by natal target, aspect tone, sign shadow, house focus, and transit planet;
- suggested practices keyed by tone/theme;
- safe no-aspect fallback prompts and practices;
- weekly integration prompts;
- stable IDs and source tags for every item.

### 4.7 Ranking and fallback rules

Current ranking is lowest orb only. Guidance needs deterministic significance rules:

- normalize exactness against the allowed orb for the aspect;
- weight transit planet and natal target importance;
- weight aspect intensity;
- avoid allowing Moon hits to dominate every weekly headline;
- select a challenging event for warning and a supportive event for opportunity when available;
- use curated sign/house fallbacks when no relevant event exists;
- deduplicate repeated events in weekly sampling.

## 5. Proposed File and Module Structure

Keep current natal lexicon and `dailyTransits.ts` contracts stable. Add a guidance layer beside them.

```text
client/lib/
  dailyTransits.ts                 # existing low-level daily transit identities/hits
  guidance/
    types.ts                       # forecast/result/domain contracts
    transitEvents.ts               # enrich hits with signs, houses, tone, stable IDs
    rankTransitEvents.ts           # significance, tie-breaks, role selection
    dailyGuidance.ts               # build deterministic DailyGuidance
    weeklyForecast.ts              # sample, dedupe, aggregate seven days
    shadowPrompts.ts               # deterministic prompt candidate/selection logic
    practiceSelector.ts            # deterministic practice selection
    aiContext.ts                   # later adapter only; no provider calls in v1
  lexicon/
    guidance/
      index.ts
      types.ts                     # content primitive contracts
      transitPlanets.ts            # Moon through Saturn guidance domains
      natalTargets.ts              # ten natal planet activation domains
      aspectDynamics.ts            # tone/action/warning/opportunity metadata
      signGuidance.ts              # 12 mood/shadow/opportunity primitives
      houseGuidance.ts             # 12 temporary life-area focus primitives
      combinationOverrides.ts      # sparse exceptions only
      reflectionPrompts.ts         # stable prompt records
      practices.ts                 # stable safe practice records
client/components/guidance/
  TodayEnergyCard.tsx              # extracted Dashboard presentation
  GuidanceSection.tsx              # mood/watch/opportunity/prompt/practice
  WeeklyForecastView.tsx           # after helper behavior is stable
client/screens/
  WeeklyForecastScreen.tsx         # later UI slice
```

Notes:

- `dailyTransits.ts` can remain the public compatibility facade during migration.
- `DashboardScreen.tsx` should not absorb forecast composition or a larger card body.
- First slices should require no database migration.
- The existing `journals.prompt_template` column can store a selected prompt ID once JournalEditor forwards it.
- Forecasts should remain ephemeral/local in v1. Saved readings and forecast caching are separate product decisions.

## 6. Proposed TypeScript Types

The exact names can follow repository conventions, but the contracts should carry stable IDs and provenance.

```ts
type GuidanceTone =
  | 'supportive'
  | 'challenging'
  | 'intensifying'
  | 'integrative'

type GuidanceIntensity = 'low' | 'medium' | 'high'

type GuidanceSection = {
  title: string
  body: string
  sourceIds: string[]
}

type GuidanceChartContext = {
  timeZone: string
  planets: PlanetPos[]
  houses: HouseCusp[] | null
  planetHouses: PlanetHousePlacement[] | null
}

type TransitAspectEvent = {
  id: string
  evaluatedAt: string
  transitPlanet: PlanetKey
  transitSign: ZodiacName
  transitHouse: HouseNumber | null
  natalPlanet: PlanetKey
  natalSign: ZodiacName
  natalHouse: HouseNumber | null
  aspect: AspectType
  orb: number
  score: number
  tone: GuidanceTone
  intensity: GuidanceIntensity
  sourceIds: string[]
}

type ReflectionPrompt = {
  id: string
  title: string
  prompt: string
  followUp?: string
  intensity: 'gentle' | 'deep'
  tags: string[]
  sourceIds: string[]
}

type SuggestedPractice = {
  id: string
  title: string
  steps: string[]
  durationMinutes?: number
  tags: string[]
  safetyNote?: string
  sourceIds: string[]
}

type DailyGuidance = {
  schemaVersion: 1
  source: 'deterministic'
  date: string
  timeZone: string
  evaluatedAt: string
  transitSunSign: ZodiacName
  transitMoonSign: ZodiacName
  primaryTransit: TransitAspectEvent | null
  supportingTransits: TransitAspectEvent[]
  mood: GuidanceSection
  warning: GuidanceSection
  opportunity: GuidanceSection
  transitSummary: GuidanceSection
  reflectionPrompt: ReflectionPrompt
  suggestedPractice: SuggestedPractice
  sourceIds: string[]
}

type WeeklyDayTheme = {
  date: string
  title: string
  summary: string
  primaryTransitId: string | null
  promptId: string
  sourceIds: string[]
}

type WeeklyForecast = {
  schemaVersion: 1
  source: 'deterministic'
  startDate: string
  endDate: string
  timeZone: string
  dailyThemes: WeeklyDayTheme[]
  strongestTransits: TransitAspectEvent[]
  weeklyThemes: GuidanceSection[]
  suggestions: SuggestedPractice[]
  journalPrompts: ReflectionPrompt[]
  sourceIds: string[]
}
```

Design rules:

- Builders receive the evaluation date/time explicitly; they do not call `new Date()` internally.
- The same inputs always produce the same output.
- `sourceIds` identify curated primitives used in each section.
- Result objects contain no user name, email, birth location, or other unnecessary PII.
- Do not expand the stored `ChartData` JSON shape for ephemeral forecast output.
- Keep result types distinct from natal `Interpretation`; forecast content has different responsibilities.

## 7. Daily Guidance v1 Design

### Inputs

- `GuidanceChartContext` built from validated chart data.
- Evaluation instant.
- Current supported orb mode.
- Optional content version.

### Deterministic calculation flow

1. Compute transit positions for the supplied instant.
2. Determine transit Sun and Moon signs.
3. Find fast transit-to-natal aspects using the existing identity-safe helper.
4. If natal houses exist, assign transit planets to natal Whole Sign houses.
5. Enrich aspect hits with natal signs/houses, transit houses, aspect tone, content IDs, and significance score.
6. Rank events with stable tie-breaking.
7. Select:
   - primary event: highest overall score;
   - warning event: highest challenging/integrative candidate;
   - opportunity event: highest supportive candidate;
   - supporting events: next one or two distinct events.
8. Compose sections from curated primitives and sparse overrides.
9. Select a prompt and practice deterministically from matching tags.
10. Return a complete object even when no aspect qualifies.

### Section rules

**Mood**

- Start with transit Moon sign guidance.
- Modify with the primary event tone when one exists.
- Keep language temporary: "The tone may feel..." rather than identity claims.

**Warning**

- Prefer square/opposition or a challenging conjunction override.
- Use a calm UI label such as "Watch for" even though the object field remains `warning`.
- Never predict harm, illness, betrayal, financial loss, or unavoidable events.
- If no challenging event exists, use the Moon-sign shadow as a light watch-for.

**Opportunity**

- Prefer trine/sextile or a supportive conjunction override.
- Describe an available action, not a guaranteed outcome.
- If no supportive event exists, use the transit Sun-sign constructive expression.

**Transit summary**

- Name the exact transit/natal planets, aspect, orb, and activated natal house when available.
- Include at most the primary event plus two supporting events.
- Do not synthesize unrelated generic natal paragraphs.

**Reflection prompt**

- Select from natal target + aspect tone + transit house/sign tags.
- Keep the prompt stable for the user's local date.
- Allow direct handoff to JournalEditor with `prompt_template` set to the prompt ID.

**Suggested practice**

- Select a low-risk, short action from matching tags.
- Initial practices should be simple: pause before replying, brief breathing check-in, short walk, single-task focus, boundary review, gratitude list, creative free-write, or tidying one small area.
- Avoid medical claims, extreme breathwork, fasting, substances, fire rituals, or instructions presented as treatment.

### No-aspect fallback

The daily object must never collapse to an empty card. When no aspect qualifies:

- Mood comes from Moon-sign guidance.
- Opportunity comes from Sun-sign guidance.
- Warning comes from the Moon-sign shadow field.
- Summary states that no tight personal transit aspect is emphasized.
- Prompt and practice come from sign/theme fallbacks.

### Content voice

- Reflective, invitational, and specific.
- No fatalism or certainty.
- No diagnosis or claims about trauma, karma, health, money, or another person's motives.
- Use "may," "can," "notice," and "consider" rather than "will" or "must."

## 8. Weekly Forecast v1 Design

### Week boundary

- Use the chart/user time zone.
- Define v1 as ISO Monday through Sunday.
- Accept an explicit local start date; do not infer a week from server UTC silently.

### Sampling strategy

V1 does not need a precision ephemeris event solver. Use deterministic sampling:

- Build each day's guidance at local noon for its daily theme.
- Sample transit positions every six hours across the seven-day range to find the minimum sampled orb for each stable transit/natal/aspect key.
- Label any resulting time as a closest sampled time, not an exact perfection time.
- Continue using `astronomy-engine`; do not hand-roll planetary motion.

### Transit scopes

- Daily themes: Moon, Sun, Mercury, Venus, Mars.
- Weekly headline events: Sun, Mercury, Venus, Mars, Jupiter, Saturn.
- Moon may shape each day but should not occupy most weekly headline slots.
- Uranus, Neptune, and Pluto remain deferred until longer-range event handling is designed.

### Aggregation flow

1. Generate seven daily guidance objects.
2. Collect sampled weekly aspect events.
3. Deduplicate by transit planet + aspect + natal planet.
4. Keep the minimum sampled orb and its timestamp for each key.
5. Rank with stable weights and cap repeated transit planets.
6. Select up to five strongest weekly transits.
7. Aggregate source tags into two or three weekly themes.
8. Select up to three distinct practices and three journal prompts.
9. Produce exactly seven `dailyThemes`, including calm fallback days.

### Weekly output constraints

- Seven daily themes, one per local date.
- Maximum five strongest transit events.
- Maximum three weekly themes.
- Maximum three practices and three prompts.
- No duplicate prompt or practice IDs.
- No claim that a sampled timestamp is astronomically exact.
- No persistence or notification scheduling in the first weekly slice.

### Weekly theme composition

Weekly prose should select from curated theme records keyed by dominant tags, for example:

- communication and decisions;
- emotional regulation and belonging;
- relationships and values;
- action and boundaries;
- responsibility and structure;
- growth and perspective;
- visibility and confidence;
- rest and integration.

Do not concatenate seven daily paragraphs. Weekly output should be a compact synthesis of selected deterministic primitives.

## 9. Shadow Prompt Library v1 Design

### Purpose

The shadow library should help users notice patterns and choose constructive action. It should not impersonate therapy, diagnose trauma, recover memories, or make deterministic claims about karma.

### Primitive coverage

Build composable records rather than prompts for every chart combination:

- 10 natal planet domains.
- 12 sign polarity records: gift, overextension, integration direction.
- 12 house domains: life area, avoidance pattern, constructive inquiry.
- 5 aspect dynamics.
- 5 fast transit triggers, with Jupiter/Saturn weekly additions.
- A small generic integration/fallback set.

Suggested first content target:

- 30 planet prompts: notice, explore, integrate for each planet.
- 24 house prompts: awareness and action for each house.
- 10 aspect prompts: tension/support versions for each aspect family.
- 10 fast-transit prompts: two per daily transit planet.
- 12 sign integration prompts.
- 12 to 20 safe suggested practices.

This is enough variety for deterministic selection without building hundreds of bespoke prompts.

### Prompt triggers

Prompts may be selected from:

- primary daily transit;
- warning or opportunity transit;
- activated natal planet;
- transit through natal house;
- natal planet sign/house when no transit event qualifies;
- dominant weekly theme.

### Deterministic rotation

- Gather all prompts matching the event tags.
- Sort by stable ID.
- Select using a stable index derived from local date + prompt category + non-PII chart fingerprint.
- The same chart/date returns the same prompt.
- A new date can rotate within the same valid candidate set.
- Never use `Math.random()` in builders.

### Journal integration

The existing schema already has `journals.prompt_template`.

Future UI handoff should:

- navigate to JournalEditor with prompt ID, title, and optional prompt text;
- display the prompt separately from the user's editable response;
- pass `prompt_template` into `upsertJournal`;
- avoid storing the entire daily/weekly forecast in the journal row;
- preserve journal deletion and chart `ON DELETE SET NULL` behavior.

### Safety and tone requirements

- Default to gentle intensity.
- Offer deeper prompts explicitly rather than automatically.
- Include permission to pause or skip.
- Avoid clinical terminology and certainty about hidden motives.
- Keep practices accessible and low risk.
- Do not derive prompts from private journal history without explicit future consent.

## 10. How This Later Feeds AI Chat

AI should consume Naksha's structured output, not raw birth data plus an instruction to improvise astrology.

### Future context envelope

```ts
type GuidanceContextV1 = {
  schemaVersion: 1
  intent: 'natal' | 'daily' | 'weekly' | 'shadow' | 'love' | 'purpose'
  chartAnchors: {
    sun: { sign: ZodiacName; house: HouseNumber | null }
    moon: { sign: ZodiacName; house: HouseNumber | null }
    rising: ZodiacName | null
  }
  relevantNatalPlacements: Array<{
    planet: PlanetKey
    sign: ZodiacName
    house: HouseNumber | null
    sourceIds: string[]
  }>
  dailyGuidance?: DailyGuidance
  weeklyForecast?: WeeklyForecast
  selectedPrompts?: ReflectionPrompt[]
  userQuestion: string
  consentedJournalExcerpts?: Array<{ id: number; excerpt: string }>
}
```

### Deterministic responsibilities

Keep these local/pure or in trusted Naksha server code:

- planetary positions and houses;
- aspect detection and orbs;
- time-zone/date boundaries;
- event ranking and deduplication;
- guidance section selection;
- prompt/practice selection;
- source IDs/content versions;
- input validation and PII minimization.

### AI responsibilities later

AI may:

- summarize already selected deterministic sections;
- answer a user question using the supplied placements/events;
- connect multiple supplied themes conversationally;
- adjust tone/length within Naksha voice constraints;
- suggest which existing prompt/practice to explore.

AI must not:

- recalculate or invent placements, aspects, houses, dates, retrogrades, or eclipses;
- claim a transit that is absent from context;
- replace deterministic warnings/opportunities with unsupported predictions;
- receive service-role or provider secrets in the client;
- receive full journal history by default;
- make medical, legal, financial, or mental-health diagnoses.

### Prompt routing later

Future intent routing should select deterministic context bundles:

- natal: relevant planet/sign/house/aspect primitives;
- daily: `DailyGuidance` plus primary/supporting events;
- weekly: `WeeklyForecast` plus dominant themes;
- shadow: selected prompts/practices and their source events;
- love: Venus, Mars, Moon, 5th/7th/8th-house context that actually exists;
- purpose: Sun, Saturn, Jupiter, 9th/10th/11th-house context that actually exists.

The router should choose context. It should not create astrology.

## 11. Test Plan

### Lexicon/content contract tests

- Existing natal coverage remains 120 planet-sign, 120 planet-house, 144 house-sign, 12 signs, 12 houses, and 5 aspects.
- All required guidance planet, natal target, aspect, sign, and house keys exist.
- Stable IDs are unique and non-empty.
- Every content record has non-empty prose and valid tags.
- Every prompt practice reference resolves.
- Sparse overrides reference valid planets/aspects only.

Avoid snapshotting entire long-form prose. Test completeness, IDs, and representative sentinel records so editorial changes do not create noisy failures.

### Transit enrichment and ranking tests

- Same input yields the same event IDs, scores, ordering, and output.
- Transit and natal planets with the same name stay distinct.
- Exactness is normalized against each aspect's allowed orb.
- Tie-break behavior is stable.
- Warning selection prefers valid challenging candidates.
- Opportunity selection prefers valid supportive candidates.
- Conjunction overrides change tone only where configured.
- Missing houses degrade to `null` without dropping guidance.
- Transit-house assignment uses natal Whole Sign houses when available.

### Daily guidance tests

- Complete object for a representative square, trine, opposition, conjunction, and sextile.
- Complete no-aspect fallback.
- Mood, warning, opportunity, summary, prompt, and practice are never empty.
- Source IDs contain only primitives actually used.
- Explicit evaluation instant controls output; no hidden wall-clock calls.
- Local date/time-zone boundaries are stable around midnight and DST transitions.
- Prompt/practice rotation is stable for the same local date and changes only through defined rules.
- Builders do not mutate chart input.

### Weekly forecast tests

- ISO Monday-Sunday range contains exactly seven local dates.
- Six-hour sampling produces stable minimum sampled orbs.
- Repeated event keys deduplicate correctly.
- Moon events shape daily themes but do not flood weekly headlines.
- Limits for events/themes/prompts/practices are enforced.
- No duplicate prompt or practice IDs.
- Fallback week still returns seven usable daily themes.
- Time zones crossing UTC date boundaries produce correct local dates.
- Sampled event times are labeled as sampled, not exact.

### Shadow prompt tests

- Planet, sign, house, aspect, and transit triggers return valid candidates.
- Gentle prompts are the default.
- Stable date-based rotation is deterministic.
- No-match fallback returns a safe generic prompt/practice.
- Journal handoff preserves `prompt_template` and does not alter create/update ID behavior.

### UI tests

- Extracted TodayEnergyCard renders all six target sections and fallback state.
- Dashboard passes structured guidance rather than composing prose inline.
- Weekly view renders seven days and empty/fallback states.
- Journal action passes prompt ID/title/text correctly.
- Existing Dashboard, journal, chart, typecheck, lint, and 19-suite baseline continue to pass.

## 12. Implementation Slices in Recommended Order

### Slice 1: Content contracts and coverage tests

- Add guidance content/result types.
- Add transit planet, natal target, aspect dynamic, sign, and house primitives.
- Add prompt/practice record contracts and a small complete starter library.
- Add uniqueness, reference-integrity, and coverage tests.
- No UI, persistence, route, or migration change.

Why first: content completeness becomes measurable before builders depend on it.

### Slice 2: Transit event enrichment and ranking

- Preserve existing `dailyTransits.ts` exports.
- Enrich hits with typed planet keys, signs, optional houses, stable IDs, tone, intensity, score, and source IDs.
- Add deterministic warning/opportunity/primary selection.
- Add focused pure-helper tests.
- Keep current Dashboard output unchanged in this slice.

Why second: daily and weekly should share one event model and ranking rule.

### Slice 3: Structured DailyGuidance builder

- Implement daily composition and no-aspect fallback.
- Add deterministic prompt/practice selection.
- Require explicit instant and time zone.
- Extend daily-transit tests into daily-guidance tests.
- Do not change persistence.

Why third: validate the product object independently of UI.

### Slice 4: Today’s Energy UI expansion and journal handoff

- Extract `TodayEnergyCard` from Dashboard.
- Render mood, Watch for, opportunity, summary, reflection prompt, and practice.
- Add "Reflect in journal" handoff with prompt ID.
- Forward `prompt_template` through JournalEditor to `upsertJournal`.
- Update Dashboard and journal-focused tests.

Why fourth: ship immediate user value without weekly complexity.

### Slice 5: Weekly forecast helper

- Add local-week calculation, six-hour sampling, event deduplication, tag aggregation, and limits.
- Keep it as a pure library first.
- Add DST/time-zone, dedupe, ranking, and fallback tests.
- No notifications or saving.

Why fifth: stabilize forecast math/content before adding a screen.

### Slice 6: Weekly forecast UI

- Add a focused WeeklyForecast screen and route.
- Reuse daily guidance, prompts, and practices.
- Add journal handoff for weekly prompts.
- Keep Dashboard to a compact weekly entry/summary rather than embedding seven days.
- Add focused screen tests and manual QA.

### Slice 7: AI context adapter, still without AI

- Build and validate `GuidanceContextV1` from deterministic outputs.
- Redact unnecessary PII.
- Add source/provenance validation tests.
- Do not add an LLM SDK, provider call, chat UI, conversation persistence, or prompt logging yet.

Why last: AI integration should begin only after the context contract is stable.

## 13. Explicit Deferrals

Defer these from Forecast + Guidance Library v1:

- AI provider integration, chat UI, streaming, saved conversations, and prompt audit logs.
- Push notifications, scheduling, and notification preferences.
- Saved forecast/readings history, tags, favorites, and premium gating.
- Forecast persistence or cache tables.
- Exact transit perfection solver, applying/separating status, and aspect-duration windows.
- Retrograde stations, ingress events, eclipses, lunar phases, void-of-course Moon, and planetary hours.
- Uranus/Neptune/Pluto weekly headline logic and long-range transit timelines.
- Synastry, composite charts, compatibility, solar returns, progressions, and additional chart systems.
- Medical, financial, legal, trauma, diagnostic, or deterministic karmic guidance.
- Journal-history personalization without explicit user consent and retention rules.
- Content CMS/admin tooling, localization, and user-authored prompt libraries.
- Milestone tracking and gamification.

These deferrals keep v1 deterministic, reviewable, and small enough to test thoroughly. The library should first prove that Naksha can produce useful daily and weekly guidance without AI. AI can then add conversation and synthesis without becoming the source of astrological truth.
