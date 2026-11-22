# Naksha Complete Lexicon / Interpretation Audit

## Executive Assessment

**Naksha has extensive placement copy, but it does not yet have a consistently complete interpretation system.** Its strongest passages translate symbolism into recognizable emotional or relational experience. Its weakest surfaces either define terminology, repeat an archetypal formula, or concatenate separate pieces without interpreting their interaction.

The central problems are:

1. **Natal aspects have no planet-pair interpretation.** Every supported pairing receives one of five generic aspect summaries. Moon square Saturn and Mercury square Neptune display the same interpretive sentence.
2. **Placement coverage conceals substantial semantic repetition.** All 120 planet-house entries contain “Growth comes through…”. So do 138 of 144 house-sign entries.
3. **Some visible house content is misleading within the stated Whole Sign framework.** Seventeen entries assert natural sign/planet–house associations as unqualified rulership facts. Generic fourth- and tenth-house descriptions identify those houses with IC and MC.
4. **Sky Now has a better interpretive foundation, but insufficient aspect differentiation.** For 44 of 45 pairs, opposition and square share their meaning; conjunction, trine, and sextile share theirs.
5. **Daily guidance mostly assembles meanings rather than explaining interactions.** Weekly guidance ranks and lists patterns without developing a coherent account of the week.
6. **Personalization is uneven.** Houses rarely affect guidance beyond an appended label. Outer-planet sign descriptions make individual psychological claims without explaining their shared generational context.
7. **Prompt and practice quality exceeds selection quality.** Many individual exercises are usable; their connection to the displayed configuration is sometimes weak.

My editorial assessment:

| Measure | Assessment |
|---|---|
| Content-return completeness within implemented scope | **8/10** |
| Interpretive completeness against the product brief | **4/10** |
| Ready to treat content review as complete | **No** |
| Primary work required | Interpretation architecture, contextual accuracy, differentiation, and substantial editorial revision |

These ratings are judgments, not calculated coverage percentages. Exact coverage measurements follow.

**Audit basis.** Repository revision `53b70eb5`; source tracing, content enumeration, inspection of relevant tests/documentation, and in-memory execution of existing interpretation functions. Rendered sequences below follow the actual component branches; this was not a device-layout verification. No files were written or modified, no tests were added, and nothing was committed, pushed, or deployed. A separate untracked editorial report appeared during the session; it was neither read nor changed.

## System Map

| Family/surface | Source and composition | Route to the user |
|---|---|---|
| A. Generic signs | `lexicon/signs/index.ts` | Sign-coordinate helpers are used. Generic sign prose has no production consumer found. |
| B. Generic planets | No standalone natal planet-archetype library | Planet names/glyphs appear in Compass. Generic meanings exist separately as guidance primitives, without a dedicated explanatory surface. |
| C. Planet in sign | `PLANET_SIGN_MEANINGS` | Chart hero; planet rows; planet interpretation modal |
| D. Generic houses | `HOUSE_MEANINGS` | First long block in each house modal |
| E. House-sign | `HOUSE_SIGN_MEANINGS`; dormant generic-plus-sign fallback | House rows, selected-house summary, second house-modal block |
| F. Planet in house | `PLANET_HOUSE_MEANINGS` | Combined planet-row/modal summary; second planet-modal block |
| G–H. Generic/natal aspects | Five `ASPECT_MEANINGS` | Aspect list and selected-aspect detail use only `.short` |
| I. Sky Now aspects | 45 pair themes, five dynamics, five Moon–Saturn overrides | Selected current aspect: title → dynamic → meaning → practice → reflection → shared-sky framing |
| J. Daily guidance | Current positions → transit-to-natal aspects → closest eligible aspect → guidance primitives → prompt/practice selection | Today’s Energy card |
| K. Weekly forecast | Seven local-noon daily builds plus separately ranked weekly transit events | Weekly pattern → daily rhythm → underlying transits → reflection/practice |
| L. Reflection/practice | 34 prompts and 24 practices | Daily/weekly cards; journal creation handoff |
| M. Fallbacks | Null lookups, house-sign blending, background guidance, selection fallback pools | Mostly silent omission or similarly styled content |
| N. Final experience | Page builders, cards, selection state, expansion state | Separate interpretive fragments; no natal-chart synthesis or weekly narrative synthesis |

The primary placement pipeline is:

```text
Planet longitude + assigned Whole Sign house
→ sign lookup + planet-house lookup
→ mechanically joined short summary
→ InterpretationPage
→ InterpretationModal / InterpretationCard
→ summary, sign long text, house long text
```

The pipeline does **not** reconcile the two interpretations, incorporate natal aspects, or decide which theme should lead.

Sources: [chart interpretation composition](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/chartInterpretation.ts:52), [page builders](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/chartPageBuilders.ts:14), [Dashboard guidance construction](/home/vinal/Vins-ProjectDirectory/Naksha/client/screens/DashboardScreen.tsx:574).

## Coverage Inventory

“Authored” below means explicitly stored content. It does **not** certify that the content is meaningfully bespoke.

| Family | Theoretical inventory | Authored coverage | Composition/generic coverage | Missing or inaccessible |
|---|---:|---:|---|---|
| Generic signs | 12 | **12/12, 100%** | None needed | All 12 generic prose records unused by production UI |
| Standalone generic natal planets | 10 | **0/10** | 10 natal-target activation primitives exist elsewhere | No complete beginner-facing planet explanations |
| Planet-sign | 120 | **120/120, 100%** | 0 fallback-generated | 0 missing supported keys |
| Generic houses | 12 | **12/12, 100%** | None needed | Shorts function mainly as fallback material; long descriptions are rendered |
| House-sign | 144 | **144/144, 100%** | Actual fallback use **0/144** | 12 sign-flavor fallback strings dormant for supported keys |
| Planet-house | 120 | **120/120, 100%** | 0 fallback-generated | 0 missing supported keys |
| Generic aspects | 5 | **5/5, 100%** | Reused across every natal pair | Five long descriptions have no current production rendering path found |
| Natal pair-aspect readings | 225 nominal cells | **0/225 pair-specific, 0%** | **225/225** receive generic type-level text | Entire pair-specific interpretive layer absent |
| Sky Now pair themes | 45 pairs | **45/45, 100%** | Five reusable aspect operators | Pair content usually shared across aspects |
| Sky Now pair-aspect readings | 225 nominal cells | Five partial meaning/practice overrides: **2.2%** | **220/225, 97.8%** use ordinary composition | No empty supported lookups; not 225 bespoke readings |
| Daily transit-aspect space | 10 transiting × 10 natal × 5 = 500 | Five transit-planet primitives; ten targets; five dynamics | **250 supported cells: 50% of ten-planet space** | Transiting Jupiter through Pluto excluded |
| Weekly highlight space | Same 500 | Seven transit-planet primitives; ten targets; five dynamics | **350 supported cells: 70%** | Transiting Uranus, Neptune, Pluto excluded |
| Guidance signs | 12 | **12/12, 100%** | Used primarily for Sun/Moon background | Other transit signs do not shape the selected transit interpretation |
| Guidance houses | 12 | **12/12, 100%** | Only focus text reaches guidance UI | Constructive, warning, inquiry fields unused in composition |
| Reflection prompts | No meaningful exhaustive combination denominator | **34 authored** | Selection from reusable pools | Five cannot be selected with an ordinary primary transit |
| Suggested practices | No meaningful exhaustive combination denominator | **24 authored** | Selection from reusable pools | Three cannot win representative weekly selection when a top transit exists |
| Planet-sign-house summaries | 10 × 12 × 12 = 1,440 | **0 integrated three-factor readings** | **1,440 mechanically composable summaries** | No interaction-specific synthesis |

There are **413 `{short, long}` records** across generic signs, planet-sign, generic houses, house-sign, planet-house, and generic aspects. There are also **104 guidance records**: 46 primitives, 34 prompts, and 24 practices.

**Structural uniqueness is misleading here.** Every short and long string within the enumerated placement families is distinct. That does not prevent repeated sentence structures or nearly interchangeable human meanings.

**The 225 aspect denominator is combinatorial, not entirely astronomically reachable.** At least 11 cells cannot occur in ordinary geocentric natal/current-sky data under these orbs:

- Sun–Mercury: all four non-conjunction types.
- Sun–Venus: all four non-conjunction types.
- Mercury–Venus: square, trine, opposition.

This follows from the inner planets’ limited elongation from the Sun. It does not apply to transit-to-natal comparisons, which compare different moments. These cells should not inflate claims about real-sky coverage. [NASA on Mercury’s elongation](https://www.nasa.gov/podcasts/gravity-assist/gravity-assist-podcast-mercury-with-faith-vilas/), [NASA Venus reference](https://ntrs.nasa.gov/api/citations/19750016555/downloads/19750016555.pdf).

**Observed fallback frequency.** I evaluated:

- Four natal planetary sets: `1960-06-15T12:00Z`, `1980-03-21T00:00Z`, `1990-01-01T12:00Z`, `2000-09-23T06:00Z`.
- Every date of 2026 at `20:00Z`, using `America/Los_Angeles`.
- Weekly builds every seventh sampled date.

Results:

| Measurement | Result |
|---|---:|
| Daily builds | 1,460 |
| Daily no-primary-aspect fallback | **0/1,460** |
| Weekly builds | 212 |
| Weekly no-highlight fallback | **0/212** |
| Distinct daily Mood bodies | **60** |
| Distinct selected prompts | **29/34** |
| Distinct selected practices | **24/24** |
| Same practice on adjacent sampled dates | **109/1,456 comparisons, 7.5%** |

This is a reproducible audit corpus, not a population estimate. It shows that ordinary composition deserves more attention than rare empty-result fallbacks.

## Content Family Scorecard

Scores: **1 = seriously inadequate; 3 = serviceable but limited; 5 = strong**. Coverage is reported separately from quality.

| Family | Coverage | Specificity | Human legibility | Differentiation | Voice | Actionability | Context | Rewrite severity |
|---|---|---:|---:|---:|---:|---:|---:|---|
| A. Generic signs | 12/12; not surfaced | 2 | 3 | 3 | 3 | 1 | 3 | Light/substantial plus surface decision |
| B. Generic planets | Standalone 0/10 | — | — | — | — | — | — | New explanatory layer |
| C. Planet-sign | 120/120 | 3 | 4 | 3 | 3 | 3 | 2 | Mixed; outer planets substantial |
| D. Generic houses | 12/12 | 2 | 3 | 2 | 3 | 1 | 2 | Accuracy edits and selective rewrite |
| E. House-sign | 144/144 | 2 | 3 | 2 | 2 | 2 | 2 | Substantial |
| F. Planet-house | 120/120 | 2 | 3 | 2 | 2 | 2 | 2 | Substantial |
| G. Generic aspects | 5/5 | 1 | 2 | 3 | 3 | 1 | 3 | Keep only as introductory definitions |
| H. Natal aspects | 0 pair-specific | 1 | 1 | 1 | 3 | 1 | 3 | New content and rendering architecture |
| I. Sky Now | 225 composed results | 3 | 4 | 2 | 4 | 4 | 4 | Extend aspect differentiation |
| J. Daily guidance | 250 supported cells | 2 | 3 | 2 | 3 | 3 | 3 | Architectural |
| K. Weekly forecast | 350 highlight cells | 2 | 2 | 2 | 3 | 2 | 3 | Architectural |
| L. Prompts/practices | 34/24 | 3 | 4 | 2 | 4 | 4 | 3 | Selection change; selective edits |
| M. Fallback/composition | Broad text availability | 1 | 3 | 1 | 3 | 2 | 3 | Explicit quality/provenance treatment |
| N. Rendered experience | Main surfaces reachable | 2 | 3 | 2 | 3 | 2 | 3 | Composition and hierarchy changes |

A generic glossary can score adequately as a glossary. The low scores arise where Naksha presents that glossary as the interpretation.

## Planet-in-Sign Audit

The family is genuinely authored at all 120 keys. It is the strongest large natal-content family, particularly among personal planets. It often answers what a placement could feel like or how someone might behave.

However:

- Symbolic meanings are usually assumed rather than introduced.
- “You are,” “you’re wired,” and “you’re here to” frequently exceed a tendency-based voice.
- All 120 long entries follow two paragraphs.
- Outer planets receive the same degree of personal certainty as Sun, Moon, Mercury, Venus, and Mars.
- Venus is overwhelmingly interpreted through romantic love, narrowing values, pleasure, aesthetics, and receptivity.
- Similar sign adjectives recur across planets without always producing a sufficiently different psychological mechanism.

Representative input → lookup → visible meaning:

| Configuration; illustrative longitude | Actual short text | What the long text adds | Assessment |
|---|---|---|---|
| Sun in Aries; `5°` | “Your core self is bold, direct, and wired for action.” | Initiating, taking risks, speaking first; patience and emotional awareness | Recognizable behavior. “Built to” and “wired” overstate certainty. |
| Moon in Scorpio; `215°` | “You experience emotions intensely and need depth, not surface-level connection.” | Privacy, suspicion, earned trust, allowing safe connection | Useful emotional mechanism. “Transformative healing” is less concrete than the preceding material. |
| Mercury in Pisces; `335°` | “Your mind is imaginative, intuitive, and symbolic.” | Images and impressions; understanding before articulation; difficulty with clarity | Distinctive and legible. “Rather than strict logic” can become a limiting stereotype. |
| Venus in Capricorn; `275°` | “You love seriously and value commitment and reliability.” | Slow opening, loyalty, long-term intention; warmth alongside responsibility | One of the clearer relationship interpretations. Still too exclusively romantic. |
| Mars in Cancer; `95°` | “You act protectively and are driven by emotional security.” | Protective motivation, indirect anger, suppression, boundaries | Good symbol-to-behavior connection. Could allow a broader range than defensiveness and moodiness. |
| Saturn in Aquarius; `305°` | “You learn individuality while honoring collective responsibility.” | Outsider feelings, independence versus belonging | Too close to generic Aquarius/Uranus material. Saturn’s relationship to rules, authority, accountability, and social structure is underdeveloped. |
| Neptune in Pisces; `335°` | “You’re deeply intuitive, imaginative, and spiritually sensitive.” | Empathy, unseen realms, boundaries, healing/art | Excessively personal for a shared slow-planet sign position; abstract and difficult to examine behaviorally. |

For each row, longitude selects the sign; `getPlanetSignMeaning` returns the stored `{short,long}` object. The hero shows `short`. Opening the planet page shows the composed summary, then the complete sign `long`, then the house `long` when available.

Sources: [planet-sign library](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/lexicon/planets/index.ts:21), [Saturn in Aquarius](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/lexicon/planets/index.ts:663), [Neptune in Pisces](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/lexicon/planets/index.ts:852).

**Most serious contextual issue:** all 36 Uranus/Neptune/Pluto sign entries use individual-facing prose without a generational/cohort explanation. Phrases such as “You’re here to revolutionize…” and “Your life pushes you…” turn shared symbolism into a personal assignment.

**Dignity treatment is inconsistent.** Some placements are described as “at home,” including modern outer-planet domiciles; Saturn in Aquarius is not explained on the same basis. The issue is an unstated editorial doctrine, not an obligation to add technical dignity terminology everywhere.

## Planet-in-House Audit

All 120 entries are explicitly authored. All 120 use:

- A “With [planet] in the [house]…” opening.
- Two paragraphs.
- A “Growth comes through…” construction.

This is a family-wide template, even though it is not generated by a runtime template.

| Requested placement | What users are told | What remains weak |
|---|---|---|
| Sun 1st | Visible identity, self-definition, confidence, recognition | Repeats identity/presence in several forms. “You are often meant to…” introduces destiny language. |
| Moon 4th | Home, family, emotional memory, belonging | Says the Moon rules the fourth house. Promises an internally stable foundation “regardless of external circumstances,” an unrealistic standard. |
| Mercury 3rd | Quick thinking, curiosity, speaking/writing/teaching | Says Mercury rules the third house. Substitutes a Gemini-like thinking style for the house’s life setting. |
| Venus 7th | Harmony, fairness, cooperation, partnership | Says Venus rules the seventh house. Assumes ease attracting partners without chart qualification. |
| Mars 10th | Career ambition, initiative, leadership, professional conflict | Clearly locates a life area, but “aligning ambition with purpose” is an interchangeable conclusion. |
| Saturn 12th | Hidden fears, isolation, internal pressure, spiritual strength | Heavy psychological claims with little observable behavior; “deep inner work” is not explained. |
| Pluto 8th | Transformation, intensity, power, rebirth | Says Pluto rules the eighth house; repeatedly restates intensity without showing how it operates. |

The family often explains **where** a planetary theme might appear. It less reliably explains **how** it works there.

Compare:

- Mercury 3rd: quick, curious, mentally active.
- Mercury in Gemini: mental agility, connections, variety.
- Gemini on the 3rd: communication and mental flexibility.

These should be related, but they are not interchangeable. Naksha repeatedly approaches them as though they were.

A stronger existing example is **Venus 6th**: affection through practical help, followed by the risk of tying love to usefulness. That is a recognizable mechanism, not merely a topic list.

Sources: [Sun 1st](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/lexicon/planetHouses/meanings.ts:10), [Moon 4th](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/lexicon/planetHouses/meanings.ts:103), [Saturn 12th](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/lexicon/planetHouses/meanings.ts:526), [Pluto 8th](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/lexicon/planetHouses/meanings.ts:727).

## House Audit

The 12 generic meanings are mostly concise topic definitions. That is appropriate introductory material, but it is not sufficient interpretation.

| Houses | Current emphasis | Editorial concern |
|---|---|---|
| 1 / 7 | Identity and partnerships | Angle names are treated as house aliases; clarify the relationship in Whole Sign. |
| 2 / 8 | Personal values/resources; merging/transformation | Second house is relatively concrete. Eighth house becomes psychological/mystical quickly, with less practical explanation of shared obligations and resources. |
| 3 / 9 | Communication/learning; philosophy/travel | Understandable distinction, though not developed into lived examples. |
| 4 / 10 | Home/roots; career/public role | Explicit IC/MC equivalence is misleading in Whole Sign. |
| 5 / 11 | Creativity/romance; groups/future goals | Useful topical contrast. Eleventh-house technological emphasis needs a stated interpretive rationale. |
| 6 / 12 | Work/routines; subconscious/spirituality | Twelfth-house “karmic patterns” are asserted without definition or context. |

The fourth-house text begins “The 4th House (IC)…”, and the tenth begins “The 10th House (MC)…”. Whole Sign houses do not make those angles identical to those houses. This is a substantive framework error, not stylistic shorthand that a beginner can safely decode. [House meanings](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/lexicon/houses/meanings.ts:24), [Astrodienst house-system explanation](https://www.astro.com/astrowiki/en/House_System?nho2=133).

The generic house material should provide orientation. It should not carry unsupported biographical or metaphysical certainty.

## House-Sign Audit

Coverage is **144/144 authored**, with no current use of the fallback.

Its principal weakness is treating sign traits as adjectives applied to a house topic, then adding a familiar corrective lesson.

| Configuration; raw cusp longitude | Resulting emphasis | Assessment |
|---|---|---|
| Aries 1st; `0°` | Direct initiative; patience and pacing | Clear, but largely repeats generic Aries and Sun/Mars-in-Aries material. |
| Scorpio 4th; `210°` | Intense/private roots; secrecy, trust, vulnerability | Recognizable themes, but suggests an early-life history from a sign alone. |
| Capricorn 10th; `270°` | Discipline, duty, achievement; personal fulfillment | “Capricorn rules this house” is misleading; otherwise heavily archetypal. |
| Pisces 12th; `330°` | Sensitive subconscious, unseen, blurred boundaries | Natural-house conflation plus repeated abstract sensitivity. |
| Pisces 1st; `330°` | Soft/dreamy presence; porous sensitivity | More useful when describing how others may perceive someone; ending is the standard grounding/boundaries prescription. |
| Aquarius 4th; `300°` | Unconventional or unpredictable home; independence | Assumed biography and sign stereotypes crowd out alternative expressions. |
| Cancer 10th; `90°` | Caring public role; nurturing work; boundaries | Life area is clear; career suggestions remain broad. |
| Virgo 7th; `150°` | Practical support, improvement, criticism | One of the better combinations: it explains how helpfulness can become evaluation. |
| Gemini 8th; `60°` | Talking/thinking about intimacy and complexity | Useful tension between understanding an experience and feeling it, though “transformation” remains abstract. |

Actual route:

```text
{house, lon}
→ getHouseMeaning(house)
→ getHouseSignMeaning(house, zodiacNameFromLongitude(lon))
→ authored object; no fallback
→ house row / selected-house summary
→ modal:
  House number
  Sign
  house-sign short
  generic house long
  house-sign long
```

The generic block and specific block often repeat the life-area definition before reaching anything new.

**Whole Sign coupling matters:** the 144 cells are not 144 independently selectable settings within a chart. A rising sign determines the complete sequence. Reading all 12 house pages therefore exposes the repeated template very quickly.

Sources: [house-sign lookup/fallback](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/lexicon/houses/index.ts:16), [house-page composition](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/chartPageBuilders.ts:58), [Virgo seventh-house example](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/lexicon/houses/signMeanings.ts:487).

## Natal Aspect Audit

**There is no natal planet-pair interpretation library to audit.** The absence is the finding.

Both natal rendering paths request only `getAspectMeaning(type)`:

- Aspect list.
- Selected aspect detail beneath the wheel.

Neither passes the participating planets into an interpretive lookup. The detail surface does not offer a longer pair-specific reading.

For an illustrative raw aspect `{a:"Moon", b:"Saturn", type:"square", orb:0.5}`, the complete interpretive result is:

> “Friction that pushes you toward growth and action.”

The component adds the planet names, “Square,” and `0.50° orb`. Those labels create specificity around a sentence that has none.

| Requested configuration | Actual interpretive sentence |
|---|---|
| Sun conjunct Moon | “Two energies fused together, amplifying each other.” |
| Sun opposite Moon | “A polarity that asks for balance and integration.” |
| Moon square Saturn | “Friction that pushes you toward growth and action.” |
| Moon trine Saturn | “A natural flow of energy and ease between planets.” |
| Mercury square Neptune | “Friction that pushes you toward growth and action.” |
| Venus opposite Mars | “A polarity that asks for balance and integration.” |
| Mars opposite Saturn | “A polarity that asks for balance and integration.” |
| Jupiter conjunct Uranus | “Two energies fused together, amplifying each other.” |
| Saturn conjunct Neptune | “Two energies fused together, amplifying each other.” |
| Uranus trine Pluto | “A natural flow of energy and ease between planets.” |

The requested differentiation checks therefore fail:

- **Sun opposite Saturn versus Mercury opposite Saturn:** identical interpretation.
- **Moon square Saturn versus Moon opposite Saturn:** different generic aspect labels, no explanation of how the same planetary relationship changes.
- **Venus trine Saturn versus Venus sextile Saturn:** generic ease versus opportunity, without describing affection, commitment, caution, reliability, or relationship behavior.

A beginner cannot learn what part of life the aspect describes, how it may feel, what they might do, or why these planets matter.

Sources: [aspect list lookup](/home/vinal/Vins-ProjectDirectory/Naksha/client/components/charts/AspectsList.tsx:38), [selected-aspect lookup](/home/vinal/Vins-ProjectDirectory/Naksha/client/components/charts/ChartScreenContent.tsx:278), [generic aspect copy](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/lexicon/aspects/index.ts:4).

The five longer generic explanations are currently unused. Surfacing them alone would not solve this problem.

## Sky Now Audit

Sky Now is more interpretive than natal aspects. It has:

- Pair-specific themes.
- Practices and reflections tied to those themes.
- Separate aspect framing.
- Explicit shared-sky language.
- A longer-background qualification for all ten pairings formed entirely from Jupiter through Pluto.

However, its aspect differentiation is mostly superficial.

For **44/45 pairs**:

```text
opposition or square → pair.friction
conjunction, trine, or sextile → pair.potential
practice → unchanged
reflection → unchanged
```

Only Moon–Saturn has five separate meanings and practices.

Measured across 225 returned objects:

| Field | Distinct values |
|---|---:|
| Meaning | **93** |
| Practice | **49** |
| Reflection | **45** |
| Fully serialized object | Different aspect framing can make all 225 distinct |

The last row is why full-object uniqueness is an inadequate quality test.

Source: [Sky Now composition](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/lexicon/aspects/currentSky.ts:557).

Representative traces use the same aspect identities as the natal examples. Raw current longitudes establish the aspect; the lookup sorts the pair symmetrically, selects potential/friction or an override, then constructs a `SkyAspectMeaning`.

The UI renders **pair names → aspect → orb → title → dynamic → meaning → Work with it → practice → Reflect → reflection → shared-sky qualification**.

| Configuration | Actual meaning or excerpt | Actual practical direction | Assessment |
|---|---|---|---|
| Sun conjunct Moon | “A sense of direction may find support in the places, people, and routines that help you feel at home.” | Give a meaningful priority space alongside care | Better than natal. Does not meaningfully interpret concentration/fusion beyond the separate operator. |
| Sun opposite Moon | “The wish to move forward may sit alongside a need for comfort or reassurance.” | Same practice and reflection as conjunction | Contrast is legible; square receives this same meaning. |
| Moon square Saturn | “Comfort and responsibility may seem difficult to fit into the same plan.” Followed by self-criticism, withholding needs, pushing through | Rework an expectation that leaves no room for rest/support | Strong configuration-specific mechanism. |
| Moon trine Saturn | “Emotional care and consistency are symbolically working together.” | Use reliable support and steadying routines | Meaningfully different from square; appropriately symbolic. |
| Mercury square Neptune | “An impression may feel persuasive even when the details remain unclear.” | Develop creative ideas and verify practical facts separately | Clear, economical, observable. |
| Venus opposite Mars | “Wanting closeness and wanting things your own way may pull against each other.” | Express desire while allowing another preference or a no | Strong relational specificity and consent. |
| Mars opposite Saturn | “The wish to act may meet a delay, constraint, or demanding standard, inviting frustration.” | Separate what can move from what needs preparation | Useful, but square gets the same mechanism and practice. |
| Jupiter conjunct Uranus | Curiosity opening learning/experimentation beyond usual assumptions | Explore an idea and check usefulness | Calibrated as longer background; could fit several Jupiter/Uranus aspect types unchanged. |
| Saturn conjunct Neptune | Routine giving a creative/compassionate intention practical expression | Give the vision a sustainable modest form | Conjunction receives only the favorable branch, despite potential conflict or dissolution. |
| Uranus trine Pluto | Questioning established patterns revealing more deliberate agency | Change what is within influence and consider affected people | Responsible but broad; little that distinguishes trine from sextile or conjunction. |

Moon–Saturn is the clearest demonstration that the architecture can deliver better differentiation.

There are also dead fields: the base Moon–Saturn potential, friction, and practice are always overridden. Some inner-planet friction fields cannot reach the real current-sky UI because their hard aspects cannot occur.

**Sky planets themselves have no interpretation.** Selecting a planet shows its position. The invitation to select “a planet or aspect to explore what it may mean” promises more than the planet branch provides.

Source: [Sky Now rendering](/home/vinal/Vins-ProjectDirectory/Naksha/client/components/charts/CurrentSkyCompass.tsx:153).

## Daily Guidance Audit

The daily pipeline correctly distinguishes transiting and natal identities, including same-name planets. It is deterministic and genuinely uses natal longitudes.

Its interpretation is nevertheless shallow relative to the information available.

Actual composition:

| Section | Inputs |
|---|---|
| Mood | Transit Moon sign atmosphere + generic primary-aspect summary |
| Watch for | Aspect warning + transiting planet warning + natal planet warning |
| Opportunity | Aspect opportunity + transiting planet constructive text + natal planet constructive text |
| Transit summary | Planet names/aspect/orb + transiting planet topic list + natal planet topic list |
| Life area | House of the transiting planet in the natal Whole Sign framework |
| Reflection/practice | Source-match pool, otherwise tag-match pool, then deterministic hash |

For same-planet conjunctions, Opportunity suppresses the duplicate natal constructive fragment. Other sections still repeat closely overlapping meanings.

Sources: [daily builder](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/guidance/dailyGuidance.ts:156), [selection](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/guidance/dailyGuidance.ts:69).

### Five generated-output traces

These were evaluated using existing functions at **October 2, 2026, 12:00 p.m. America/Los_Angeles**, or `2026-10-02T19:00:00Z`.

Calculated transit longitudes included:

```text
Sun     189.6000767720177°
Moon     89.46670213996174°
Mercury 213.0178587399015°
```

D1–D4 use deliberately isolated synthetic natal targets to expose composition. They are not represented as complete birth charts. Their house arrays are Aries-first Whole Sign houses.

D5 uses calculated natal planets and houses for **January 1, 1990, 12:00 UTC, London: 51.5074, −0.1278**. That calculation also produces Aries-first houses.

All five produce the visible metadata:

> Moon in Gemini | Sun in Libra

All five then follow the expanded UI order given below. Quotations are actual output; shorter rows identify excerpts explicitly.

**D1 — Transit Sun conjunct natal Sun**

Raw natal target: `Sun 189.6000767720177°`.

Lookup: transit Sun + natal Sun + conjunction. Primary object: `conj`, orb `0`, tone `intensifying`; transit house 7.

- **Mood:** “Mentally mobile, conversational, and alert to alternatives. Two functions converge, increasing concentration without deciding how that concentration will be used.”
- **Watch for:** Overidentification, performance/defensiveness, and feedback becoming a judgment of the whole self.
- **Opportunity:** “Coordinate the two functions deliberately and give the added concentration a specific purpose. Put steady attention behind the priority that best expresses your intended direction.”
- **Transit summary:** “Sun conjoins natal Sun within 0.00°. This brings purpose, vitality, visibility, and conscious priorities into contact with purpose, self-definition, visibility, and conscious direction.”
- **Life area:** House 7; partnership, reciprocity, one-to-one dynamics.
- **Reflection:** “What experience or preparation supports your confidence here?” Follow-up asks what fact, rehearsal, or perspective would strengthen it.
- **Practice:** Reciprocity check-in; write what is offered and requested, then choose a clarifying conversation or boundary.

**Finding:** the summary describes purpose contacting purpose. It never interprets a return or renewal of a familiar solar theme. The practice is selected through background Libra, although the reader is not told that.

**D2 — Transit Moon square natal Saturn**

Raw natal target: `Saturn 179.46670213996174°`.

Lookup: transit Moon + natal Saturn + square. Primary object: `square`, orb `0`, tone `challenging`; transit house 3.

The expanded reading is:

- **Mood:** “Mentally mobile, conversational, and alert to alternatives. Two demands interfere with each other, creating pressure for an adjustment or new skill.”
- **Watch for:** “Watch for repeating the same forceful response when the underlying conflict requires a different method. A temporary feeling may make habitual defenses seem more necessary than they are. Fear of falling short may turn preparation into delay or standards into punishment.”
- **Opportunity:** “Let the friction reveal the blocked function, then make one practical change in approach. Identify the immediate need, then choose a response you can still support after the mood shifts. Distinguish the real obligation from inherited pressure, then build a standard you can maintain.”
- **Transit summary:** “Moon squares natal Saturn within 0.00°. This brings immediate feelings, instinctive reactions, comfort, and belonging into contact with duty, authority, time, standards, and earned competence.”
- **Life area:** House 3; “communication, learning, and everyday thinking.”
- **Reflection — Use the friction:** “What recurring point of friction is asking for an adjustment rather than more force?” Follow-up: “Which skill, limit, or expectation could be changed first?”
- **Practice — Completion pass:** “Finish one nearly complete task before opening another loop.” Steps: choose a nearly finished useful task; complete, send, file, or schedule it before starting another.

**Finding:** the ingredients are related, but the reading never directly explains the conflict between wanting emotional reassurance and feeling required to remain competent or controlled. The completion practice can reinforce productivity pressure immediately after warning against punitive standards.

**D3 — Transit Moon trine natal Saturn**

Raw natal target: `Saturn 209.46670213996174°`.

Lookup: the same two planet primitives as D2, with trine. Primary object: `trine`, orb `0`, tone `supportive`; house 3.

- **Mood:** Same Gemini opening, followed by “Low resistance lets two functions cooperate, making an existing capacity easier to use.”
- **Watch for:** The first sentence changes to the trine warning. **The temporary-feeling warning and the fear-of-falling-short warning are identical to D2.**
- **Opportunity:** The first sentence changes to “Apply the available ease to reinforce a skill, relationship, or useful piece of work.” **Both planet-specific instructions remain identical to D2.**
- **Transit summary:** Changes “squares” to “trines”; both topic lists remain identical.
- **Life area:** The same house-3 label.
- **Reflection:** “Which responsibility needs a clearer structure rather than more pressure?” Follow-up asks for a repeatable next step.
- **Practice:** Three-line check-in: “I feel,” “I need,” “I choose,” followed by a small response.

**Finding:** the aspect operator changes, but the psychological interpretation barely does. Sky Now’s Moon–Saturn trine is appreciably better.

**D4 — Transit Mercury square natal Neptune**

Raw natal target: `Neptune 303.0178587399015°`.

Lookup: transit Mercury + natal Neptune + square. Primary object: orb `0`, tone `challenging`; house 8.

- **Mood:** **Exactly the same as D2.**
- **Watch for:** Generic square warning, then speed/too many inputs producing certainty without understanding, then hope/projection supplying missing details.
- **Opportunity:** Generic adjustment instruction, then separating facts from assumptions, then giving an impression an observable form.
- **Transit summary:** “Mercury squares natal Neptune within 0.00°. This brings interpretation, language, decisions, and information exchange into contact with imagination, empathy, ideals, ambiguity, and perceptual boundaries.”
- **Life area:** House 8; shared resources, trust, vulnerability, transformation.
- **Reflection:** “Does this conversation need understanding, a decision, a request, or a boundary?”
- **Practice — Assumption audit:** Separate what happened from assigned meaning; write “observed” and “inferred” columns; verify one inference.

**Finding:** this is a relatively successful combination because the independently authored planet fragments already overlap around perception and evidence. The practice is better than the explanatory paragraph.

**D5 — Calculated ten-planet natal chart**

Natal Moon: `333.2675900418851°`. Transit Mercury: `213.0178587399015°`.

The real aspect calculation selects **Mercury trine natal Moon, orb 0.25°**, house 8.

- **Mood:** The same Gemini-plus-trine body as D3.
- **Watch for:** Generic trine warning; Mercury’s certainty-without-understanding warning; Moon’s familiarity-versus-safety warning.
- **Opportunity:** Generic trine opening; clarify facts/question; support the present emotional need without assuming an old protective habit is necessary.
- **Transit summary:** “Mercury trines natal Moon within 0.25°. This brings interpretation, language, decisions, and information exchange into contact with emotional memory, belonging, regulation, and familiar responses.”
- **Life area:** House 8; shared resources, trust, vulnerability, transformation.
- **Reflection:** “What are you willing to let remain unclear for now, without forcing an answer or treating uncertainty as a problem?”
- **Practice:** The same Assumption audit selected for D4.

**Finding:** this could explain giving language to feelings, listening, or communicating a need. Instead it presents two vocabulary lists and selects a Mercury–Neptune-associated reflection/practice through a Mercury source match.

These traces show a consistent pattern: **the user must perform the final interpretive synthesis.**

Additional daily findings:

- Selection ranks by absolute orb, not psychological relevance, duration, natal target importance, or normalized closeness within each aspect’s orb.
- Only five transiting planets are eligible.
- The natal target’s sign, house, and natal relationships do not modify the prose.
- Transit house is appended after the main reading; it does not change the warning, opportunity, prompt, or practice.
- The Moon-sign atmosphere is shared sky, but appears under the personal-sounding heading “Mood.”
- Mood has only **60 primary-aspect bodies**: 12 Moon signs × five dynamics, regardless of the planet pair.
- Daily orb values are rounded before ranking, allowing near-ties to become tie-break decisions.
- There is no duration explanation distinguishing a brief lunar contact from a slower emphasis.

## Weekly Forecast Audit

Weekly processing is more considered than simply taking seven daily winners:

- Monday–Sunday in the supplied profile time zone.
- Seven local-noon snapshots.
- Jupiter and Saturn added to eligible transiting planets.
- Tighter weekly orb limits.
- Scores incorporating transiting planet, aspect, closeness, and sampled persistence.
- Maximum five highlights, maximum two per transiting planet, maximum one Moon highlight.

These are useful editorial controls. They do not create narrative coherence.

The three weekly themes are simply the first three ranked transits mapped to:

```text
sampled persistence
+ generic aspect summary
+ “It connects [transit topics] with [natal topics].”
```

There is no relationship between the themes, no resolution of competing emphases, and no week-level life-area synthesis.

Sources: [weekly theme composition](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/guidance/weeklyForecast.ts:107), [ranking rules](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/guidance/weeklyTransitEvents.ts:48).

**Generated weekly trace using D5’s complete chart**

Evaluation: October 2, 2026. Resulting week: **September 28–October 4, 2026**.

Top theme:

> **Saturn square natal Neptune**
> “This pattern appears in 7 of 7 sampled days. Two demands interfere with each other, creating pressure for an adjustment or new skill. It connects limits, responsibility, standards, time, and durability with imagination, empathy, ideals, ambiguity, and perceptual boundaries.”

Second theme: Saturn square natal Sun. It repeats the same persistence and square sentences, changing only the natal topic list.

Third theme: Sun square natal Uranus. It repeats the same square sentence again.

The displayed daily rhythm is:

| Day | Daily title | House |
|---|---|---:|
| Monday | Sun square natal Uranus | 7 |
| Tuesday | Moon opposite natal Pluto | 2 |
| Wednesday | Sun trine natal Venus | 7 |
| Thursday | Sun sextile natal Mars | 7 |
| Friday | Mercury trine natal Moon | 8 |
| Saturday | Sun square natal Sun | 7 |
| Sunday | Mercury sextile natal Uranus | 8 |

Every daily body repeats its aspect title in sentence form, then supplies the two topic lists.

Underlying transits then repeat:

1. Saturn square Neptune — September 28, `0.3°`, seven sampled days.
2. Saturn square Sun — October 4, `0.5°`, seven sampled days.
3. Sun square Uranus — September 28, `0.1°`, three sampled days.
4. Sun square Sun — October 3, `0.2°`, four sampled days.
5. Mercury trine Moon — October 2, `0.3°`, four sampled days.

The weekly reflection is:

> “Which responsibility needs a clearer structure rather than more pressure?”

The practice is **Two-minute pause**: step away from the message/task if safe, then name the intended result before acting.

**Assessment:** the strongest theme leads by ranking, but not by explanation. The week opens with a Saturn–Neptune interaction, shifts into fast-planet daily fragments, repeats transit metadata, and closes with a square-associated pause. It never explains how the week’s themes connect.

**Collapsed-state problem:** the two-line theme preview begins with sampled persistence and generic mechanics. The most specific material is at the end and can be truncated. “Strongest transit” then repeats the same title.

**Context strengths and limits:**

- “Sampled days” is appropriately explicit.
- A selected date is the closest sampled snapshot, not necessarily exact culmination.
- Seven noon samples can miss brief contacts.
- No applying/separating, speed, retrograde, or exact-event reasoning informs the prose.
- Jupiter/Saturn appear in weekly highlights but never in the daily-theme builder.
- Ranking does not distinguish natal Sun/Moon targets from outer-planet targets.
- Weekly reflection says to notice what “repeated across the week,” even when the user opens the forecast before the week has unfolded.

The repository’s own target is stronger: **strongest theme → supporting/transitional influence → life area → tension/opportunity across the week → reflective close**. Current output does not implement that editorial progression. [Content-phase requirements](/home/vinal/Vins-ProjectDirectory/Naksha/docs/release-hardening-plan.md:195).

## Reflection / Practice Audit

The library contains **34 prompts and 24 practices**. Several are clear, modest, and usable without astrology knowledge.

Strong examples:

- Assumption audit: separates observation from inference.
- Capacity inventory: checks existing commitments before accepting another.
- Conversation outline: observation, request, and genuine question.
- One-variable experiment: reversible experimentation.
- Release one control: distinguishes personal responsibility from overmanagement.
- Desire without demand: distinguishes desire from entitlement.

Their weakness is often **selection**, not prose.

Daily selection:

1. Any matching source ID qualifies a record.
2. If none match, any matching tag qualifies it.
3. Otherwise the entire library qualifies.
4. A hash selects from the pool.

It does not rank stronger matches, enforce tone compatibility, or coordinate the prompt with the practice.

An exhaustive structural enumeration of 250 primary transit cells × 12 Sun signs × 12 Moon signs found:

| Measurement | Prompts | Practices |
|---|---:|---:|
| Contexts examined | 36,000 | 36,000 |
| Source-match pool size | 4–11 | 2–10 |
| Mean pool size | 6.44 | 5.69 |
| Contexts with no source match | 0 | 0 |
| Records eligible somewhere with a primary transit | 29/34 | 24/24 |

The five excluded prompts are all house-only:

- Resource stewardship.
- Inner foundation.
- Create without performance.
- Shared future.
- Gentle release.

House context never enters `activeRecords`, so these cannot win ordinary primary-transit selection. They can appear through background tag fallback, including when the supposedly relevant house has not been activated.

For representative weekly selection across all 350 supported transit cells:

- **29/34 prompts** can attain the top score.
- **21/24 practices** can attain the top score.
- Values check, Tidy one area, and Rest window never win that selection.

They may still appear through other routes; this is conditional unreachability, not global deletion.

In the 1,460-reading corpus, **919 selected prompts, 62.9%, had a different tone label from the reading**. Different tone is not automatically wrong. The percentage demonstrates that tone is not a daily selection constraint.

**Journal handoff loses context.** It carries the main prompt and practice summary/steps, but not the prompt follow-up, transit explanation, evaluation date, or practice title. Saving stores the response and prompt ID; reopening does not reconstruct the original guidance context. This weakens later reflection and editorial reproducibility.

Sources: [selection inputs](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/guidance/dailyGuidance.ts:261), [house-only prompts](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/lexicon/guidance/reflectionPrompts.ts:152), [journal handoff](/home/vinal/Vins-ProjectDirectory/Naksha/client/screens/DashboardScreen.tsx:226), [journal persistence](/home/vinal/Vins-ProjectDirectory/Naksha/client/screens/JournalEditorScreen.tsx:204).

## Fallback Audit

Normal composition and exceptional fallback must not be conflated. Most generic output here is the normal path.

| Mechanism | Trigger/frequency | Result | Risk |
|---|---|---|---|
| Natal generic aspect text | Every natal aspect | One of five sentences | **Highest: P1.** Looks configuration-specific because names/orb surround it. |
| Ordinary Sky composition | 220/225 nominal cells | Pair potential/friction plus generic dynamic | **P1.** Aspect differentiation appears stronger than it is. |
| Daily/weekly primitive assembly | Every primary interpretation | Topic lists and reusable instructions | **P1.** Produces text without a relational mechanism. |
| House-sign blend | Missing authored cell | Generic house meaning + sign adverbial flavor | **P2 latent.** Currently 0/144; would repeat generic house text in the same modal. |
| Missing planet-sign/planet-house | Missing/unsupported key | Null; summary uses remaining component; empty blocks disappear | **P2 latent.** No explicit indication that part of the reading is missing. |
| Missing houses | No usable house set | Sign reading or transit-to-natal guidance continues without house block | Generally appropriate degradation; personalization is reduced. |
| Daily no primary | No eligible aspect or unsupported selected natal target | Moon atmosphere/watch-for; Sun opportunity; explicit background summary | **P2.** Useful as background, but Mood remains personal-sounding. |
| Missing Sun/Moon sign | Missing upstream position | Generic Sun/Moon primitive or generic warning | Defensive path; not encountered with successful normal ten-body computation. |
| Prompt source → tag fallback | No source matches | Broader semantic pool | **P2.** Can select house-associated content without house relevance. |
| Prompt/practice whole-library fallback | Neither source nor tag matches | Any record | **P2 latent.** No such case in supported sign-pair enumeration. |
| Weekly no highlights | No events inside weekly limits | “Background rhythm”; most frequent daily prompt/practice | **P2.** “No tight personal transit” is broader than the filtered evidence. |
| Unsupported Sky pair/aspect | Unknown/repeated planet or unsupported type | Null; no invented reading | Appropriate |
| Weekly “theme unavailable” UI branch | Empty externally supplied theme array | Availability message | Not reached by the normal builder, which creates a background theme |
| Default chart focus | Initial state | Sun placement leads | **P2 composition.** A default focal placement is not an assessed chart theme. |

No-aspect background enumeration across all 144 Sun/Moon sign pairs found:

- Prompts: tag fallback in **144/144**.
- Practices: direct source matches in **108/144**, tag fallback in **36/144**.
- Entire-library fallback: **0/144** for both.

No production telemetry was available to determine real-user fallback rates.

## Rendered-Experience Audit

**Planet reading: Sun in Aries, first house**

Raw input:

```text
planet = { name: "Sun", lon: 5 }
placement = { name: "Sun", house: 1 }
```

The page builder produces:

```text
title: Sun
subtitle: Aries · House 1
summary:
  Your core self is bold, direct, and wired for action.
  This tends to show up most clearly when your identity is visible,
  self-defining, and central to how you move through life.

blocks:
  Sun in Aries → stored long interpretation
  Sun in House 1 → stored long interpretation
```

The user encounters:

1. Hero: “Sun in Aries,” house label, sign short.
2. Planet row: position, house, combined summary.
3. Modal: “Planet Interpretation,” Sun, subtitle, the same combined summary.
4. “Sun in Aries,” followed by its full long copy.
5. “Sun in House 1,” followed by its full long copy.

The visible theme is repeated rather than developed: bold identity → visible identity → initiating → strong visible identity → self-definition → authentic confidence.

**The joining sentence is not a synthesis.** It always uses:

> “This tends to show up most clearly when…”

That construction treats an entire house description as a condition. For Saturn in Aquarius/12th it produces:

> “This tends to show up most clearly when your growth comes through inner discipline, confronting hidden fears, and developing spiritual strength.”

The sentence is grammatical enough to pass superficial checks, but its causal meaning is weak.

**Mixed placements are not reconciled.** Mercury in Pisces/3rd first describes imaginative, impression-based thinking, then quick, highly active communication. Mars in Cancer/10th describes indirect protective action, then public initiative and leadership. Both combinations could be interpreted coherently; Naksha merely places the statements beside each other.

**House reading:** the sign-specific short leads, followed by a generic house paragraph, followed by another sign-specific paragraph. This often moves from specific → generic → repeated specific, rather than developing an explanation.

**Natal aspect reading:** there is no deeper reading behind the generic sentence.

**Sky Now:** the most complete sequence, because it explicitly includes a meaning, practice, and reflection. However, a generic dynamic paragraph always precedes the more useful pair meaning.

**Daily/weekly:** collapsed cards withhold most practical content and truncate the explanatory material to two lines. Expanded cards expose complete text, but also expose the repetition.

**Sentence rendering:** `InterpretationCard` splits long copy into individual sentence `Text` elements. It preserves authored paragraph gaps, but creates a sentence-by-sentence reading rhythm. It does not improve the underlying logical progression.

Sources: [summary join](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/chartInterpretation.ts:69), [card text rendering](/home/vinal/Vins-ProjectDirectory/Naksha/client/components/charts/InterpretationCard.tsx:83), [daily expansion order](/home/vinal/Vins-ProjectDirectory/Naksha/client/components/guidance/TodayEnergyCard.tsx:71), [weekly preview](/home/vinal/Vins-ProjectDirectory/Naksha/client/components/guidance/WeeklyForecastCard.tsx:111).

The final natal experience is a collection of placement readings. It does not yet feel like one reading of a person’s chart.

## Repetition / Genericity Findings

Measured phrase incidence counts entries containing the phrase, case-insensitively, across short and long fields.

| Pattern | Planet-sign | Planet-house | House-sign |
|---|---:|---:|---:|
| “Growth comes through” | 0/120 | **120/120, 100%** | **138/144, 95.8%** |
| “You may” | 55/120, 45.8% | **118/120, 98.3%** | **132/144, 91.7%** |
| “The challenge is” | 15/120, 12.5% | 0 | 5/144, 3.5% |
| “At your best” | 1/120 | 0 | 1/144 |
| Two-paragraph long structure | **120/120** | **120/120** | **144/144** |
| Long text starts “With…” | 59/120 | **120/120** | **144/144** |

“At your best” is not a significant repetition problem in this corpus. The growth-ending template is.

Average long-entry lengths:

- Planet-sign: approximately **50 words**.
- Planet-house: approximately **70 words**.
- House-sign: approximately **73 words**.

The larger house families use more words without consistently providing more interpretive depth.

Severe semantic collisions:

| Configurations | Shared human meaning |
|---|---|
| Any two natal squares | Exactly the same sentence |
| Any two natal oppositions | Exactly the same sentence |
| Sky Venus–Saturn trine/sextile/conjunction | Same meaning, practice, reflection; operator changes |
| Daily Moon–Saturn square/trine | Same two planet-specific warnings and constructive instructions |
| Neptune in Pisces / Neptune 12th / Pisces 12th | Sensitivity, unseen/intuition, blurred boundaries, grounding, healing |
| Venus in Capricorn / Capricorn 7th / Saturn 7th | Serious commitment, slow opening, reliability, need for warmth |
| Mercury in Gemini / Mercury 3rd / Gemini 3rd | Quick thinking, curiosity, communication, need for focus |
| Saturn in Aquarius / Uranus in Aquarius / Aquarius 11th | Individuality, outsider feelings, collective contribution |
| Pluto in Scorpio / Pluto 8th / Scorpio 8th | Depth, intensity, transformation, power, trust |

Related meanings are astrologically reasonable. The problem is that the text often fails to explain the different role played by planet, sign, and house.

Repeated corrective abstractions include:

- Grounding.
- Balance.
- Clarity.
- Authenticity.
- Boundaries.
- Sustainable growth.
- Inner strength.
- Transformation.
- Meaningful impact.

These become interchangeable when the text does not identify a concrete situation, response, or internal conflict.

**Distinct editorial voices are present:**

1. **Natal signs:** expressive and identity-assertive — “wired,” “your gift,” “you’re here.”
2. **House families:** repetitive developmental coaching — “You may… Growth comes through…”
3. **Guidance:** procedural and abstract — “functions,” “activation,” “perceptual boundaries,” “proportionate.”
4. **Sky Now:** gentler symbolic reflection with clearer relational examples.
5. **Generic houses/aspects:** glossary voice.

The product currently sounds like several related libraries, not one consistently edited author.

## Context / Personalization Findings

**Natal**

- Planet-sign and house prose generally describes enduring tendencies, but regularly slips into vocation, destiny, guaranteed maturation, or assumed childhood.
- Outer-planet signs are personalized without cohort framing.
- House-sign descriptions can imply family history from one placement.
- Guest charts retain “you” language. The modal does not identify whose perspective the prose addresses.
- No content layer calibrates claims to birth-time uncertainty or the strength of corroborating chart factors.

**Sky Now**

- Explicit shared-sky framing is a strength.
- Slow-pair background qualification is a strength.
- Advice often shifts into “your day,” “your needs,” or “your direction.” This is acceptable as an invitation, but should not be confused with demonstrated natal activation.
- Conjunction’s favorable default produces an interpretation bias even though the dynamic paragraph acknowledges ambiguity.

**Transit-to-natal**

- Directional identities are preserved correctly.
- Natal longitude genuinely determines selection.
- Natal sign and house do not affect the selected planet’s meaning.
- Generic transit and target descriptions can suggest a more integrated personal reading than was actually constructed.
- The shared Moon atmosphere becomes the lead personal “Mood.”
- Source IDs identify referenced records, not necessarily active astrological factors. A selected prompt can add a Jupiter, Neptune, or house source ID without that factor being the primary transit.

**Weekly**

- Sampled timing is disclosed.
- “Strongest” means strongest under the implemented filters and weights, not all ten planets or a complete chart assessment.
- Forecast and retrospective language coexist.
- Profile birth time zone defines the week; Sky Now’s display timestamp uses device-local formatting. Their temporal frames can differ.
- Missing exact-event analysis is acceptable if wording remains calibrated; it should not be presented as precise timing.

**Psychological framing**

The main risks are not overt diagnosis. They are subtler:

- Turning ordinary needs into defects requiring development.
- Equating security with inner self-sufficiency regardless of circumstances.
- Treating Scorpio/Pluto/8th-house symbolism as inherently deeper than other experience.
- Assuming hidden fears or inherited wounds.
- Presenting maturation as an inevitable positive arc.
- Encouraging boundaries in long text while describing Venus in Pisces as loving “without boundaries” in the prominent short text.

## Strongest Existing Content

These are benchmarks for particular qualities, not blanket endorsements of their families.

| Example | Why it works |
|---|---|
| Sky Moon–Saturn opposition | Defines both symbols, identifies reassurance versus duty, and proposes support/boundaries that directly address the tension. |
| Sky Moon–Saturn square versus trine/sextile | Changes the lived mechanism and practical response, not just the aspect label. |
| Sky Mercury–Neptune friction | “An impression may feel persuasive even when the details remain unclear” is recognizable and testable. |
| Sky Venus–Mars practice | Connects desire, reciprocity, and consent without moralizing. |
| Venus in Capricorn | Slow opening, reliability, and warmth are understandable relational experiences. |
| Mars in Cancer | Links protective motivation to indirect anger and clearer expression. |
| Venus 6th | Explains how practical care can become conditional usefulness. |
| Virgo 7th | Makes the distinction between support and constant evaluation concrete. |
| Assumption audit | Clear action, bounded scope, and an obvious relationship to perception/communication. |
| Capacity inventory / one-variable experiment | Practical, reversible, and psychologically proportionate. |

The most useful benchmark is: **name the symbolic interaction, translate it into a recognizable mechanism, and derive the suggestion from that mechanism.**

## Weakest Existing Content

| Example | Why it fails |
|---|---|
| All natal pair-aspect readings | Planet identities do not affect interpretation at all. |
| Pluto 8th | Repeats transformation/intensity/depth, asserts house rulership, and provides little behavioral specificity. |
| Saturn 12th | Hidden fears and spiritual strength are weighty claims without enough ordinary-life explanation. |
| Neptune in Pisces | Shared placement presented as an individual spiritual profile. |
| Pisces 12th | Natural-house conflation and nearly interchangeable intuition/boundaries/healing copy. |
| Saturn in Aquarius | Too little Saturn-specific mechanism; easily moved into Uranus/Aquarius material. |
| Daily same-planet conjunction summaries | Describes a planet’s synonyms contacting its own synonyms. |
| Weekly repeated square themes | Repeats generic pressure and topic lists instead of explaining different conflicts. |
| Venus in Pisces short | “Without boundaries” is an overconfident and potentially unhelpful relationship identity statement. |
| House-sign generic fallback | Offers sign adjectives attached to a definition while visually resembling a bespoke reading. |

## P0 Findings

P0 means incorrect or misleading astrology/context.

**P0-1 — Unqualified natural-house rulership assertions.**

Eight planet-house entries explicitly state that the planet “rules this house”:

- Moon 4.
- Mercury 3.
- Venus 7.
- Jupiter 9.
- Saturn 10.
- Uranus 11.
- Neptune 12.
- Pluto 8.

Nine house-sign entries make the equivalent assertion for Cancer 4 through Pisces 12.

Natural-house analogies exist in some modern teaching traditions. They are not a substitute for the ruler of the actual sign occupying a Whole Sign house. The text does not explain that distinction and sometimes assigns rulership to a sign itself. This is especially misleading for beginners viewing a calculated personal chart. [House-ruler distinction](https://www.astro.com/astrowiki/en/House_Ruler).

**P0-2 — Fourth/tenth Whole Sign houses equated with IC/MC.**

The generic house descriptions explicitly identify these houses with the angles. The app calculates Whole Sign boundaries, not those angles as house boundaries. The prose teaches a relationship the calculation does not establish.

The first/seventh Ascendant/Descendant shorthand also needs clarification, though the MC/IC conflation is the clearest error.

## P1 Findings

P1 means a major interpretive weakness affecting core usefulness.

1. **No natal pair-specific aspect interpretation.** Entire central content family absent.
2. **Planet/sign/house combinations are concatenated, not synthesized.** Contrasting tendencies are left unexplained.
3. **Planet-house and house-sign families rely on pervasive semantic templates.** Authored completeness overstates meaningful differentiation.
4. **Sky Now collapses five aspect experiences into two for 44 pairs.** Conjunction inherits the favorable branch.
5. **Daily guidance does not interpret the interaction between the two planets.** Operators and topic lists dominate.
6. **Weekly output does not form a coherent weekly reading.** Three themes, seven daily fragments, and five metadata highlights remain separate.
7. **Outer-planet sign content overpersonalizes shared placements.**
8. **House personalization is largely decorative in guidance.** It does not shape the advice or selection.
9. **Daily prompt/practice selection accepts weak partial matches without relevance ranking or coordination.**
10. **Several natal entries replace lived interpretation with spiritual-development abstractions or assumed biography.**

## P2 Findings

P2 means a noticeable quality, repetition, genericity, or contextual limitation.

1. Generic sign prose is unused; standalone planet education is missing.
2. All 384 combination entries use the same two-paragraph structure.
3. “Growth comes through…” appears in 258/264 house-related combination entries.
4. Five house-only prompts are excluded from normal primary-transit selection.
5. Three practices never win representative weekly selection with a top transit.
6. Daily “Mood” blends collective atmosphere with personal framing.
7. Daily ranking uses tightest absolute orb without duration or natal-target relevance.
8. Weekly ranking has no natal luminary/personal-planet target weighting.
9. Two-line previews often prioritize technical or generic setup over meaning.
10. House placement and sign meaning frequently collapse into natural-zodiac equivalents.
11. Prompt/practice provenance is broader than the active astrological evidence.
12. Journal handoff loses follow-up and transit context; reopening loses the original guidance presentation.
13. Repeated “Deeper layer” copy frames every reflection around discomfort/avoidance.
14. Venus interpretations are too narrowly romantic.
15. Generic house 12 introduces “karmic patterns” without definition or qualification.
16. Future weekly guidance includes retrospective wording.
17. No explicit confidence or birth-time-uncertainty treatment.
18. Default Sun focus is presented as the chart headline without an interpretive prioritization process.
19. The dormant conjunction long text assumes a shared sign, although the aspect calculation can detect cross-sign conjunctions.

## P3 Findings

P3 means polish or minor consistency.

1. “House 1,” “1st House,” “on House,” “on the cusp,” and “in House” vary without a consistent explanatory convention.
2. “Conjoins,” “conjunct,” “trines,” and “forms a sextile to” produce uneven sentence cadence.
3. Practice duration metadata exists for all 24 practices but is not displayed.
4. All practices are headed “Grounding practice,” including creativity, gratitude, and relationship exercises.
5. Sky planet-selection language implies interpretation that the selected-planet branch does not supply.
6. Repeated position/title/summary text consumes attention before new meaning appears.
7. Sentence-by-sentence modal text elements can make prose feel more segmented than authored.
8. Comments describing tables as gradually incomplete no longer match current full key coverage.
9. Historical documentation contains superseded counts and behavior; it should not serve as the current content inventory.

## Structural / Architectural Findings

**The existing architecture has three different content models.**

- Natal: `{short,long}` blobs.
- Sky: pair theme + favorable/difficult branch + operator + limited overrides.
- Guidance: typed primitives and separately selected exercises.

Each contains useful material. None supplies a shared, explicit model of a complete interpretation.

The natal shape cannot represent:

- Symbol explanation.
- Interaction mechanism.
- Internal experience.
- Observable behavior.
- Constructive and difficult expressions.
- Context/confidence.
- Reflection or practice.
- Editorial provenance or revision status.

Guidance has richer metadata, but several fields do not influence behavior:

- House constructive/watch-for/inquiry: **36 prose fields unused**.
- Aspect `actionMode`: authored but not used to perform a semantic transformation.
- Primitive intensity: not combined into calibrated personalized intensity.
- Practice duration: unused by the visible cards.
- Extra weekly prompt/practice arrays: returned, but the card renders representative fields only.

**Tests establish plumbing, not interpretive completeness.**

The Sky coverage test checks that five serialized objects differ. Five different dynamic paragraphs satisfy that even when the meanings and practices repeat. A separate Moon–Saturn test checks field-level differentiation, which is closer to the editorial requirement.

Guidance tests verify key coverage, determinism, source resolution, expected phrases, and UI ordering. They do not establish that a reader can understand the lived meaning.

Source: [Sky coverage tests](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/lexicon/aspects/__tests__/currentSky.test.ts:10).

**Architecture options**

| Option | Quality ceiling | Maintenance | Repetition risk | Testability | Suitability |
|---|---|---|---|---|---|
| A. Fully bespoke combinations | High when each entry is carefully reviewed | High; repeated concepts and context variants can drift | Low within entries, but duplication across the corpus remains | Coverage easy; consistency requires editorial review | Useful for difficult/high-value configurations; expensive as the sole strategy |
| B. Compositional primitives | Moderate unless primitives describe interactions rather than isolated nouns | Lower entry count; substantial grammar/selection work | High under current concatenation model | Mechanically easy; semantic failures need contrast checks | Insufficient alone for Naksha’s intended depth |
| C. Hybrid | High if the interaction layer is authored and aspect-sensitive | Moderate; shared foundations with controlled exceptions | Manageable with field-level review | Good provenance and targeted differentiation checks | Best fit for Naksha |

The recommended hybrid should include:

1. A strong planetary-pair or directional transit-target relationship.
2. An aspect operator that changes the mechanism, not merely the introductory sentence.
3. Lived internal and behavioral expressions.
4. Constructive and difficult possibilities.
5. Context-specific framing: natal, collective sky, transit-to-natal.
6. Advice derived from the interpreted mechanism.
7. Bespoke overrides where generic composition fails.
8. A separate synthesis layer for chart and week-level coherence.

**Sky’s existing hybrid is only a partial implementation of this idea.** A pair paragraph plus generic operator is not sufficient when five aspects still resolve to two experiences.

For transit-to-natal content, direction must remain meaningful. Transiting Saturn to natal Moon is not interchangeable with transiting Moon to natal Saturn. Their timescale and role differ even when their symbolic vocabulary overlaps.

No runtime generative AI is required for this architecture.

## Rewrite Scope Estimate

These are planning estimates, not final entry-by-entry editorial assignments.

| Family | Keep nearly unchanged | Light edit | Substantial rewrite/new content | Architecture |
|---|---:|---:|---:|---|
| Generic signs: 12 | 0–2 | 6–8 | 2–6 | Decide whether/how to surface |
| Generic natal planets | Existing primitives reusable as inputs | — | **10 clear archetype explanations** | Shared explanatory model |
| Planet-sign: 120 | ~18 | ~42 | ~60, including all 36 outer-sign entries for context review | Structured context/claim calibration |
| Generic houses: 12 | 0 | ~7 | ~5 | Separate houses from angles |
| House-sign: 144 | 0 | ~24 | ~120 | Distinguish style, topic, ruler, and biography |
| Planet-house: 120 | 0 | ~24 | ~96 | Distinguish planetary function from life setting |
| Generic aspects: 5 | Preserve core concepts | ~5 | Pair interpretation cannot be solved by these alone | Introductory role only |
| Natal aspects | None exists | — | New pair/aspect layer for reachable configurations | Required |
| Sky pair themes: 45 | ~15 | ~20 | ~10 | Aspect-sensitive lived expressions for 44 pairs |
| Moon–Saturn overrides: 5 | ~3 | ~2 | Minimal | Benchmark |
| Guidance primitives: 46 | ~15 | ~21 | ~10 | Interaction-aware composition |
| Reflection prompts: 34 | ~18 | ~12 | ~4 | Relevance and house selection |
| Practices: 24 | ~16 | ~8 | Limited new content initially | Selection and prompt/practice coordination |
| Daily composition | — | — | Rework all major section templates | Required |
| Weekly composition | — | — | Rework synthesis and transitions | Required |
| Rendering | Preserve navigation/accessibility foundations | Labels and previews | Reading hierarchy and explanatory connections | Required |

For the four main authored placement/house families—396 records—this implies approximately **281 substantial revisions, 97 light edits, and 18 retained entries**. That estimate reflects the scale of family-wide problems; it is not a claim that every proposed allocation has already been individually signed off.

Content to remove, retire, or stop duplicating:

- Unqualified natural-house rulership assertions.
- Incorrect IC/MC equivalences.
- Redundant overridden Moon–Saturn base fields, unless deliberately retained as documented source material.
- Repeated boilerplate where it adds no meaning.
- Unsupported destiny or guaranteed-healing language.
- Dormant fallback content that lacks an intentional future role.

Do not discard stable prompt IDs casually: existing journal records reference them.

## Recommended Rewrite Order

1. **Correct the interpretive framework.** Resolve house/angle distinctions, rulership doctrine, outer-planet context, and claim strength.
2. **Define the content contract and editorial standard.** Establish what every interpretation must explain and how contexts differ.
3. **Build the natal aspect interpretation layer.** This is the largest missing core capability.
4. **Develop contrasting benchmark sets.** Use the same pair across all five aspects and natal/sky/transit contexts; preserve meaningful directionality.
5. **Rework daily composition and relevance selection.** Interpret the interaction, integrate the life area, and connect advice to the actual mechanism.
6. **Rework weekly synthesis.** Establish a leading theme, supporting/contrasting influences, temporal qualification, and a coherent close.
7. **Rewrite planet-house and house-sign families.** Break the natural-zodiac substitution pattern and replace formulaic growth endings.
8. **Revise outer-planet sign content, then weaker personal-planet entries.**
9. **Refine prompts/practices and their journal continuity.**
10. **Review complete rendered readings.** Include collapsed states, mixed placements, repeated themes, missing houses, and no-aspect backgrounds.

The final review unit should be the **reading a user encounters**, not merely an individual dictionary entry.

## Questions / Uncertainties for the Independent Astrology Editor

1. Which Western interpretive tradition governs rulership, dignity, house topics, and modern outer-planet associations?
2. Will natural-house analogies be retained explicitly as analogies, or removed from interpretation?
3. What is the minimum acceptable explanation of a planet, sign, house, and aspect for a beginner?
4. How should outer-planet sign symbolism be separated from individually evidenced natal expression?
5. What distinguishes square from opposition, and trine from sextile, in each planetary pair’s lived experience?
6. How should conjunctions accommodate compatibility, conflict, concentration, and ambiguity without defaulting to favorable meaning?
7. Which claims about childhood, family history, hidden fears, or inherited patterns are acceptable from a single placement?
8. How should natal target importance, transit duration, and repeated contacts influence daily and weekly emphasis?
9. Should guidance remain explicitly limited to five daily and seven weekly transiting planets?
10. How should houses affect the interpretation beyond naming a life area?
11. Which practices are genuinely derived from a configuration, and which are general reflective support?
12. How much uncertainty should the product communicate when birth time is precise-looking but not known to be reliable?
13. Should weekly guidance distinguish an upcoming week from reflection on an elapsed week?
14. What material must persist with a journal entry for the original reflection to remain understandable?
15. Can the Moon–Saturn Sky set, selected personal-planet passages, and strongest practices serve as agreed benchmarks—without importing their language mechanically into every family?

**Audit conclusion:** Naksha’s main deficit is not missing strings. It is missing relationships between symbols, insufficient differentiation between configurations, and composition that leaves too much interpretive work to the user.