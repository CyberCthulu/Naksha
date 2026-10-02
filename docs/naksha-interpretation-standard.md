# Naksha Interpretation Standard

**Status:** Proposed governing specification for C1–C4

**Baseline:** `ui/v2-redesign` at `6f1a163655962f5d5db328aefd4da798b111c879`

**Verified:** 2026-10-02

**Scope:** Natal interpretation, Sky Now, transit guidance, weekly synthesis, reflection, practice, fallback, and rendering

## 1. Purpose and authority

This document defines the V1 astrological doctrine, interpretation contract, context rules, voice, composition rules, and editorial acceptance standard for Naksha. It governs C1–C4.

Live astronomical calculations remain authoritative for positions, houses, aspects, orbs, and transit identity. Interpretation code consumes that structured data. It must not alter, infer, or replace the calculation.

The canonical pipeline is:

> calculation → structured astrology data → curated interpretation system → deterministic composition → UI

Naksha does not generate interpretations with runtime AI. A complete lookup is not sufficient evidence of a complete interpretation. The final standard is whether the rendered reading explains the actual configuration clearly, specifically, and in the right context.

This specification is normative. Current content that conflicts with it is existing implementation debt, not an exception to the standard.

## 2. Current-HEAD verification

The current implementation remains materially consistent with the two independent editorial audits now stored in `docs/`. Since their source baseline, the only changed files are the two audit reports themselves. No interpretation, calculation, composition, or rendering source has drifted.

The following conclusions remain true at current HEAD:

| Area | Current state |
|---|---|
| Natal aspects | The UI labels the planet pair but resolves interpretation through one of five generic aspect-type records. There is no planet-pair-specific natal aspect interpretation. |
| Sky Now | All 45 unordered planet pairs have authored pair themes. For 44 pairs, conjunction/trine/sextile share one `potential` meaning and opposition/square share one `friction` meaning; the practice and reflection are also shared across all five aspects. Moon–Saturn alone has five aspect-specific meaning/practice overrides. |
| Planet × sign | 120 of 120 keys resolve to authored entries, but content quality and personalness vary, especially for Uranus, Neptune, and Pluto signs. |
| Planet × house | 120 of 120 keys resolve, but all 120 long entries use the same “Growth comes through…” closing structure. |
| House × sign | 144 of 144 keys resolve. The current source uses “Growth comes through…” in 134 of 144 long entries. |
| Planet summaries | `buildPlanetSummary` joins a planet-sign short meaning to a planet-house short meaning with a fixed bridge. The detail view then presents the two long meanings as separate blocks. It does not synthesize the placement. |
| House summaries | The detail view presents the generic house meaning followed by the house-sign meaning. It does not synthesize them. |
| Daily guidance | A selected transit is composed from transiting-planet, natal-target, and generic aspect primitives. The text names contact between two functions but usually does not interpret their specific relationship. House context contributes only a separate life-area focus in the rendered card. |
| Weekly guidance | The code samples seven daily readings, ranks and deduplicates transit patterns, and shows up to three themes. Each theme remains a formatted transit fragment rather than a week-level narrative with development or sequence. |
| Prompts and practices | Selection is deterministic and structurally traceable, but tag/source matching can choose an item with only broad thematic relevance. House-specific constructive, caution, and inquiry fields do not participate in ordinary prompt/practice selection. |
| Tests | Existing tests strongly protect finite coverage, IDs, nonblank fields, deterministic selection, calculation rules, and rendering reachability. They do not establish interpretive quality. The Sky Now distinctness test can pass when only the generic dynamic sentence changes. |

The current source also contains objective Whole Sign doctrine conflicts: four house definitions equate house numbers with angles, eight planet-house entries say a planet “rules this house,” and nine house-sign entries say a sign “rules this house.” These are listed in section 17.

## 3. V1 astrological doctrine

### 3.1 Zodiac, houses, bodies, and aspects

V1 uses:

- the Tropical Western zodiac;
- Whole Sign houses;
- the Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto;
- conjunction, opposition, square, trine, and sextile;
- the calculation and orb policy implemented by the verified calculation layer.

Interpretation content must not create a placement or aspect. It must not describe a near miss as an aspect, silently change an orb, or present a content gap as an astronomical absence.

### 3.2 Houses and angles

Houses are life areas. Angles are exact chart points. They are related but not interchangeable.

Under Naksha’s Whole Sign calculation, the sign containing the Ascendant becomes the entire first house and each following sign becomes the next house. The Ascendant remains an exact degree within the first house. The Descendant is the exact opposite point. The MC and IC are also exact points and may fall outside the tenth and fourth Whole Sign houses.

Therefore:

- the first house must not be labeled “the Ascendant”;
- the seventh house must not be labeled “the Descendant”;
- the fourth house must not be labeled “the IC”;
- the tenth house must not be labeled “the MC”;
- natural-zodiac correspondences must not be stated as literal house rulership facts;
- a planet or sign is not “naturally in” a house because a modern teaching analogy associates them.

The current chart engine uses the Ascendant sign to construct Whole Sign houses. It does not provide a separate V1 angle-interpretation system. Content must omit unsupported angle claims rather than substitute house meanings for them.

### 3.3 Rulers

V1 does not use house rulers, chart rulers, dispositors, or rulership chains in interpretation or composition. The current calculation and content architecture do not support that layer consistently.

No runtime interpretation may claim that a planet or sign rules a numbered house. If future educational copy mentions rulership, it must distinguish traditional rulership from modern association explicitly and must not turn either into a natural-house identity. Adding an interpretive rulership system requires a separate doctrine decision and calculation/content design.

### 3.4 Dignities

V1 does not calculate, score, rank, or interpret essential dignity. Terms such as domicile, exaltation, detriment, and fall must not be used to imply that a placement is good, bad, stronger, weaker, or more evolved.

Existing “at home” phrasing is not a supported interpretive mechanism. It should be removed or confined later to clearly labeled educational reference copy only after an explicit dignity decision. No C1–C4 rewrite should infer dignity effects from sign placement.

### 3.5 Outer planets

Uranus, Neptune, and Pluto remain part of V1. Their functions can be personally relevant through chart-specific evidence, especially house placement and aspects to personal planets or angles when those factors are actually supported.

Their sign placements span cohorts and must first be framed as shared or generational symbolism. An outer-planet sign alone must not be presented as a unique personality, private history, mission, or destiny. Aspects solely between slow outer planets also require collective and generational calibration.

### 3.6 Techniques outside V1

The following are outside V1 unless later C1–C3 work proves a narrow dependency and that dependency receives explicit approval:

- runtime AI interpretation;
- synastry, composite charts, or relationship matching;
- Vedic astrology;
- Chinese astrology;
- additional house systems;
- progressions;
- solar returns;
- a large retrograde or station engine;
- aspect-pattern or T-square detection;
- a large ingress or eclipse expansion;
- full chart-ruler, house-ruler, dispositor, or rulership-chain synthesis;
- professional-astrologer workstation features;
- unrelated UI redesign.

Also outside the current contract are minor aspects, asteroids, Chiron, lunar nodes, lots, profections, decans, bounds, sect, and dignity scoring. The objective is to interpret Naksha’s existing astrology well, not to add more techniques.

## 4. Personalness and context tiers

Every interpretation must know what evidence supports it and limit its claims accordingly.

| Tier | Context | Permitted language | Required calibration |
|---|---|---|---|
| 0 | Generic symbol or aspect definition | “The Moon symbolizes…”, “A square describes…” | Educational only. Do not address the reader as if a specific configuration has been interpreted. |
| 1 | Shared or collective context | “This shared sky may emphasize…”, “This generation encountered…” | Do not imply personal activation, personal events, or universal felt experience. Applies to Sky Now and outer-planet sign symbolism. |
| 2 | Natal chart evidence | “This placement can describe…”, “You may notice…” for the chart subject | Describe recurring tendencies and multiple possible expressions, not fixed identity or fate. |
| 3 | Transit-to-natal evidence | “This transit may bring current pressure or attention to…” | Personal because a current body is compared with a natal position, but still symbolic and nonpredictive. Preserve direction and time context. |

### 4.1 Natal personal placements

Sun, Moon, Mercury, Venus, and Mars placements may describe tendencies in the chart subject’s identity, needs, perception, relating, and action. They must use probabilistic language and offer more than one possible expression.

### 4.2 Jupiter and Saturn

Jupiter and Saturn may be personally meaningful, especially through houses and aspects, but their sign positions move more slowly and should not be used as totalizing personality claims. Their interpretation should distinguish an individual pattern from wider age-cohort conditions where relevant.

### 4.3 Uranus, Neptune, and Pluto signs

These are Tier 1 by sign alone. Personal expression requires additional chart-specific evidence that the product actually possesses. A house placement can locate the life area; an aspect to a personal planet can describe the interaction. Neither licenses claims about biography, trauma, vocation, or destiny.

### 4.4 Sky Now

Sky Now describes a current configuration shared by everyone. It may offer a collective symbolic atmosphere or a lens for observation. It must not say or imply that every user feels the aspect, that the aspect targets the user, or that an event will occur.

“Take what resonates” is not a substitute for correct collective framing in the interpretation itself.

### 4.5 Transit-to-natal

Transit-to-natal guidance is more personal because the current sky is compared with the chart subject’s natal position. It may describe a temporary emphasis, tension, opening, or repeated theme. It must not guarantee a mood, action, relationship outcome, or external event.

Direction is part of the meaning. Transiting Mars square natal Mercury is not interchangeable with transiting Mercury square natal Mars. The first describes current initiative or urgency pressing on an established mental and communicative function; the second describes current information or conversation engaging an established action and assertion pattern.

### 4.6 Guest charts

The app user is not necessarily the chart subject. Content and rendering must carry subject context. A saved or guest chart must not automatically say “you” unless the surface has established that the viewer is the subject. Neutral forms such as “this placement,” “the chart subject,” or subject-aware naming are required when ownership is uncertain.

### 4.7 Missing houses or uncertain context

When birth location, birth time, houses, subject identity, or another required input is missing, omit the unsupported layer and state the limitation plainly. Do not invent a life area, angle, degree, biography, or personal activation. A shorter accurate reading is preferable to false specificity.

## 5. The interpretation contract

A substantial interpretation must perform synthesis. It must answer the appropriate subset of these questions:

1. What symbolic functions are involved?
2. What is their specific relationship in this configuration?
3. What does that interaction tend to feel like internally?
4. How might it appear in ordinary behavior, decisions, relationships, work, habits, or perception?
5. What is a constructive expression?
6. What is a difficult, imbalanced, or less conscious expression?
7. What distinguishes this configuration from similar configurations?
8. What limits the confidence or personalness of the claim?
9. If the surface calls for one, what reflection or practice follows naturally from the mechanism?

The content does not need nine labeled paragraphs. It does need a coherent sequence from symbol to mechanism to lived expression. The reader must not have to combine independent definitions of the planet, sign, house, and aspect to discover the meaning.

### 5.1 Minimum contract by length

**Short interpretation:** Name the specific interaction and one recognizable lived mechanism. It must do more than state two keywords or define an aspect type.

**Long interpretation:** Explain the functions and relationship, give at least one ordinary expression, show a constructive and difficult range without moral judgment, and include any necessary context calibration.

**Guidance interpretation:** Explain why the current configuration supports the stated caution, opportunity, prompt, or practice. Advice must follow from the astrology rather than from generic wellness language.

### 5.2 Range, not verdict

Constructive and difficult expressions are ranges of the same symbolic pattern. Challenging does not mean defective. Supportive does not mean virtuous, easy in every circumstance, or guaranteed to be used well.

Interpretation must avoid false psychological certainty. It can identify a plausible mechanism without claiming diagnosis, cause, childhood history, or unconscious motive as fact.

## 6. Canonical aspect semantics

The aspect changes how two planetary functions interact. It is not a reusable introductory sentence placed before an unchanged pair paragraph.

| Aspect | Interaction mechanism | Lived distinction | Common error to avoid |
|---|---|---|---|
| Conjunction | Concentration, co-presence, and blending. The functions become hard to separate and may amplify, compete, or operate as one complex. | One function readily carries the other; the person or moment may have difficulty knowing which need is leading. | Treating every conjunction as cooperation, ease, or a positive merger. |
| Opposition | Polarization across two poles. The functions may alternate, be projected, appear through relationships, or demand conscious negotiation. | The tension often feels like a seesaw or a conflict between positions that each have legitimacy. | Calling it merely “balance,” assuming a middle path is always possible, or making it identical to a square. |
| Square | Friction, interference, and action pressure. The functions obstruct or provoke one another and require a changed method. | The conflict tends to be immediate: acting on one function complicates the other, producing frustration, effort, or adaptation. | Reducing it to generic “growth” or treating conflict as proof of defect. |
| Trine | Affinity and low resistance. The functions exchange support readily and may become habitual or underexamined. | Capacity can feel natural enough to be overlooked; ease can reinforce an unhelpful habit as well as a skill. | Treating it as a blessing, virtue, or guaranteed talent. |
| Sextile | Compatible opportunity that becomes useful through participation. The functions can coordinate, but the connection is more elective than automatic. | A conversation, choice, invitation, or small act can activate the potential. | Writing it as a weaker trine or assuming support without engagement. |

### 6.1 Required contrasts

- **Square versus opposition:** A square describes interference and pressure to alter an approach. An opposition describes polarized positions, alternation, projection, or negotiation across a divide.
- **Trine versus sextile:** A trine describes an already available channel with low resistance. A sextile describes an opening that becomes useful when someone engages it.
- **Conjunction versus cooperation:** A conjunction intensifies proximity. Whether that is fluent, conflicted, consuming, productive, or unstable depends on the planetary pair and context.

The same planetary pair must change meaningfully across these mechanisms. Changing only a tone word, generic lead sentence, or practice does not satisfy the contract.

### 6.2 Supported and reachable combinations

Editorial coverage must follow the calculation model and real astronomical reachability. Do not demand content for impossible natal combinations merely to fill a mathematical matrix.

For each surface, a supported-combination manifest should be derived from the bodies the calculation can produce, the five aspect rules, and any astronomical constraints relevant to those bodies. Transit-to-natal reachability must preserve the directional roles even when the same unordered pair exists in natal or Sky Now content. Unsupported combinations need an explicit state; they must not silently fall into copy that looks bespoke.

## 7. Context-specific interpretation architecture

### 7.1 Natal planet × sign

The planet supplies the function; the sign supplies the mode, priorities, and style through which that function operates. The interpretation must explain their interaction.

It must not turn sign adjectives into a personality verdict. For Uranus, Neptune, and Pluto, the sign layer begins with shared generational context and reserves individual claims for additional chart evidence.

### 7.2 Natal planet × house

The planet supplies the function; the house locates the life area where that function tends to seek expression or become especially noticeable. A house is not a second personality adjective.

The interpretation should connect the function to ordinary choices or attention in that area. It must not infer a specific career, family history, relationship outcome, or childhood event from the house alone.

### 7.3 House × sign

The house supplies stable life topics; the sign describes the style, conditions, or approach through which those topics are encountered. In Whole Sign houses, the sign occupies the whole house.

House-sign content must not say that the sign rules the house, reproduce the natural zodiac as fact, or collapse the sign into a second definition of the house. A useful interpretation shows how the same house topic is approached differently through different signs.

### 7.4 Natal planet pair × aspect

The required architecture is hybrid:

1. a strong pair core defining the two functions and their central tension or alliance;
2. an aspect-specific operator defining how that pair interacts;
3. a lived-expression layer;
4. constructive and difficult ranges;
5. a natal context frame;
6. bespoke overrides where the generic pair/operator composition cannot produce clear, accurate meaning.

The rendered result must read as one interpretation. The pair core and operator are editorial building blocks, not separate paragraphs that leave synthesis to the reader.

### 7.5 Sky Now

Sky Now may share planetary pair cores with natal aspects, but it requires a collective context frame and present-time duration awareness. It should describe what the current pair makes available for collective observation, not assign natal traits.

All five aspect variants require distinct interaction meanings. Slow-planet pairs should be framed as a longer background condition. Faster-planet contacts may describe a shorter shared emphasis. Practices and reflections should change when the aspect mechanism changes.

The current Moon–Saturn override is the closest existing structural benchmark: it changes meaning and practice for each aspect rather than swapping only the generic aspect sentence.

### 7.6 Transit-to-natal

Transit interpretation is directional:

> transiting function → natal function → aspect mechanism → life area, when known

The transiting planet describes the current agent, pressure, invitation, or timing layer. The natal target describes the established function receiving that contact. The aspect describes the interaction. A known transit house can locate where the current planet is moving, but it must be integrated into the meaning rather than appended as an unrelated label.

The identity key and content model must preserve transiting and natal roles. Reversing them produces a different interpretation record or deterministic composition path.

### 7.7 Daily guidance

A daily reading should lead with the strongest supported personal transit when one exists and clearly distinguish it from the Sun/Moon shared-sky background. It should explain the actual transiting-to-natal relationship before offering caution, opportunity, reflection, or practice.

A coherent daily sequence is:

1. the current theme and why it is active;
2. the lived mechanism;
3. the relevant life area when available;
4. a constructive use and a realistic caution;
5. one naturally connected reflection or practice.

Separate “Mood,” “Watch for,” and “Opportunity” fields are acceptable only when they develop one interpretation rather than assembling unrelated primitives.

### 7.8 Weekly forecast

A weekly forecast is a synthesis across time, not a ranked list with seven daily fragments attached.

It should identify a lead theme, show supporting or transitional patterns, locate relevant life areas when supported, distinguish persistent background from shorter peaks, and close with one reflection or practice that follows from the week’s actual pattern. Repeated daily instances of the same transit should be described as development or persistence, not mechanically repeated.

The target sequence is:

> strongest theme → supporting or transitional theme → relevant life area → tension and opportunity → reflective or practical close

## 8. Reflection and practice contract

Reflection and practice are optional consequences of an interpretation, not proof that interpretation has occurred.

A prompt or practice is acceptable when:

- its connection to the active mechanism is understandable without looking at internal tags;
- it does not imply trauma, diagnosis, or hidden history;
- it is proportionate to the evidence and intensity of the configuration;
- it offers a realistic action, observation, or question;
- it does not turn every placement into a self-improvement assignment.

Direct source matching is preferable to broad tag matching. A fallback selected only by shared tags must be treated as generic and must not visually masquerade as configuration-specific guidance. House-specific prompts should receive house context in the selection input when a valid house is available.

## 9. Voice

Naksha’s voice is:

- clear and intelligent;
- calm;
- symbolically rich without mystical filler;
- psychologically observant without diagnosing;
- nonfatalistic;
- specific;
- compassionate without therapeutic boilerplate;
- concise enough for mobile reading;
- useful to beginners without flattening the astrology.

Prefer recognizable mechanisms: delaying a reply until the facts are clear, taking responsibility without withholding a need, wanting closeness while preserving choice, or relying on a skill so easily that it goes unnoticed.

The strongest current Sky Now pair passages are stylistic starting points, especially Moon–Saturn, Mercury–Neptune, and Venus–Mars: they move from symbol to a recognizable mechanism, then to proportionate action or reflection. Their collective framing and aspect differentiation still need to meet the full context contract above.

Explain astrology terms when they first matter. Do not use technical language as a substitute for meaning. Vary sentence length, but keep each paragraph centered on one interpretive movement. Second person is appropriate only when subject context supports it.

## 10. Prohibited and default patterns

The following are prohibited as defaults and require specific evidence if they appear at all:

- “you’re wired to…” as a habitual identity shortcut;
- “you’re here to…” or other destiny claims;
- automatic self-improvement endings;
- “Growth comes through…” as a universal closing structure;
- unexplained transformation, healing, depth, shadow, awakening, or rebirth language;
- natural-house analogies presented as literal rulership;
- MC/IC equated with the tenth/fourth Whole Sign houses;
- Ascendant/Descendant equated with the first/seventh Whole Sign houses;
- unsupported claims about childhood, parents, ancestry, family history, or early deprivation;
- unsupported trauma, hidden-wound, or unconscious-cause claims;
- diagnosing the chart subject;
- guaranteeing events, feelings, actions, relationships, or outcomes;
- portraying challenging placements as defects;
- portraying supportive aspects as automatically virtuous;
- technical astronomy or computation language in user-facing prose unless it helps comprehension;
- three independent symbol definitions presented as synthesis;
- generic advice attached to astrology by a transition such as “therefore, practice self-care” without a derived mechanism;
- using “may,” “can,” or “take what resonates” to soften a claim that remains unsupported.

Repeated structures such as “the challenge is,” “at your best,” and “you may” are not banned individually. They become a quality failure when they make different configurations interchangeable.

## 11. Benchmark examples

These are standard-setting samples, not a replacement lexicon and not approved shipping copy. “Bad” examples illustrate failure modes. “Good” examples show the required reasoning movement.

### 11.1 Moon–Saturn across aspects

**Bad for every aspect:** “The Moon represents emotions and Saturn represents responsibility. This aspect asks you to balance feelings with discipline.”

**Conjunction — good:** “Emotional needs and the instinct to manage responsibility arrive together, so care may quickly become something to organize, contain, or earn. This can support dependable care, but it can also make a feeling seem like another task before it has been felt.”

**Opposition — good:** “The need for reassurance and the demand to stay composed can occupy opposite sides of a seesaw. A person may alternate between seeking care and taking on the role of the responsible one, or meet one side through another person. The work is to negotiate room for both without assuming that need cancels competence.”

**Square — good:** “A need for comfort can collide with an internal rule about what must be done first. The pressure may show up as self-criticism, withholding a request, or pushing through until the plan becomes unsustainable. Adjusting the expectation is part of the response, not a failure of responsibility.”

**Trine — good:** “Feeling and steadiness can cooperate with little friction. Reliable routines, calm boundaries, or practical care may come naturally. Because this pattern is easy to rely on, the person may not notice when composure has become the only acceptable emotional language.”

**Sextile — good:** “There is an opening to give a feeling practical support: make a request, set a kind boundary, or create a routine that holds what matters. The connection becomes useful through a deliberate act; it need not operate automatically.”

### 11.2 Mercury–Neptune hard aspect

**Bad:** “A hard aspect creates tension between communication and intuition. Growth comes through clarity.”

**Good, square:** “Mercury’s need to name, sort, and verify can be interrupted by Neptune’s images, impressions, and porous boundaries. An idea may feel convincing before its details hold together, or precise language may seem to flatten something subtle. The constructive move is to let imagination generate possibilities and then check facts in a separate pass.”

This differs from an opposition, which should emphasize polarized positions such as fact versus impression, alternating trust and doubt, or meeting the unclaimed pole through another person.

### 11.3 Venus–Mars relationship

**Bad:** “Venus is love and Mars is passion. Their opposition asks for balance.”

**Good, opposition:** “The wish for mutuality and the urge to pursue a desire can pull from opposite sides. A person may alternate between accommodating and pressing forward, or experience one role through a partner. Clear desire and genuine consent allow attraction and reciprocity to remain in the same conversation.”

### 11.4 Planet × sign

**Bad, Mercury in Pisces:** “You are intuitive, sensitive, and imaginative. The challenge is focus, and growth comes through boundaries.”

**Good:** “Mercury describes how the mind notices, connects, and communicates; Pisces works through image, mood, and association. Thoughts may arrive as a whole impression before they can be arranged into steps, which can support metaphor and emotional nuance while making exact instructions harder to hold. Separating the imaginative pass from the editing pass gives both abilities room.”

### 11.5 Planet × house

**Bad, Sun in the first house:** “Your identity shines in the house of self. You are confident and meant to lead.”

**Good:** “The Sun’s need for purposeful self-expression is placed in the part of the chart concerned with entering situations and establishing a presence. Initiative and visibility may feel central to how the person meets life. At times, being noticed can become confused with knowing what they want; a constructive expression is to choose direction before performing certainty.”

### 11.6 House × sign

**Bad, Capricorn tenth house:** “Capricorn naturally rules the tenth house, so career success comes through ambition and discipline.”

**Good:** “The tenth house concerns public responsibility, long-range contribution, and how a life becomes visible to others. Capricorn approaches those topics through structure, standards, and gradual proof. The person may prefer roles with clear accountability or build credibility over time, while needing to notice when achievement becomes the only measure of authority.”

This does not claim that Capricorn rules the tenth house or that the tenth house is the MC.

### 11.7 Transit-to-natal

**Bad, transiting Mars square natal Mercury:** “Mars is action, Mercury is communication, and a square creates friction. Watch for conflict and practice patience.”

**Good:** “Current pressure to act or answer quickly is pressing against the chart’s established way of thinking and communicating. The person may feel compelled to decide before all the information is in, speak more sharply than intended, or become productive by finally addressing a stalled conversation. A useful response is to identify the decision that actually needs action, then check one assumption before replying.”

This is temporary and directional. It does not predict an argument, and it is not interchangeable with transiting Mercury square natal Mars.

## 12. Rendering expectations

The final review unit is the complete reading a user encounters, including headings, summaries, expanded sections, prompts, practices, repeated cards, and disclaimers.

### 12.1 Specificity must be visible

A generic aspect definition must not appear under a specific pair title in a way that implies a Moon-square-Saturn interpretation has been supplied. Generic educational text should be labeled and positioned as reference, for example “About squares,” and should be subordinate to the specific interpretation.

The interpretation model should carry enough internal provenance for the UI to distinguish:

- context: natal, shared sky, or transit-to-natal;
- specificity: bespoke combination, composed combination, generic reference, or fallback;
- subject: self, guest/chart subject, collective, or unknown;
- source IDs and fallback reason.

The exact schema is an implementation decision, but the distinction is required behavior.

### 12.2 Each surface has one job

- **Hero:** one concise headline mechanism for the active configuration.
- **List row:** identification, essential metadata, and at most one short specific meaning.
- **Detail/modal:** development of the mechanism, lived range, and context. It should expand rather than repeat the hero verbatim.
- **Generic reference:** optional supporting education, clearly labeled.
- **Prompt/practice:** a consequence of the reading, not another paraphrase of it.

Avoid repeating the same meaning through hero → list summary → modal summary → first paragraph → second paragraph. De-duplicate ideas as well as exact strings.

### 12.3 Fallback behavior

Fallbacks must be honest about their specificity. If pair-specific content is unavailable, show a labeled generic aspect definition or a concise unavailable state. Do not assemble broad definitions and style them as a bespoke reading.

Missing house data removes the house layer. Missing subject context removes automatic second person. No calculated aspect produces no aspect interpretation. Unsupported techniques remain unsupported.

## 13. Composition acceptance

Deterministic composition must produce a reading with one interpretive center. The strongest supported theme leads. Supporting material should deepen, qualify, locate, or develop it.

A composed reading fails when:

- adjacent sentences restate the same abstraction;
- each sentence comes from a different primitive without a shared mechanism;
- the caution and opportunity could attach to any transit;
- the prompt or practice follows only from a broad tag;
- a technical label carries more specificity than the prose;
- the reading has no ordinary-life expression;
- the reader must perform the final synthesis.

Composition should be reviewed with actual end-to-end fixtures, including natal placement pages, specific natal aspects, Sky Now aspect detail, expanded Today’s Energy, and expanded Weekly Forecast.

## 14. Testing philosophy

### 14.1 Structural coverage tests

Automated tests should protect:

- every deliberately supported finite key;
- canonical IDs and identity normalization;
- no blank required fields;
- valid references and source IDs;
- explicit fallback kinds and reasons;
- directional transit identity;
- supported and unsupported boundaries;
- deterministic selection and ordering;
- rendering reachability and graceful missing-data states;
- the calculation layer’s aspect, orb, and Whole Sign invariants.

These tests answer: **Does every supported input resolve deliberately and render safely?**

### 14.2 Editorial and interpretive acceptance

Prose quality requires human review. Automated editorial checks may flag banned phrases, high template frequency, absent fields, duplicate strings, or suspiciously identical variants, but they cannot prove that an interpretation is true, useful, humane, or specific.

Editorial acceptance should use:

- intentionally contrasting pairs such as Sun–Saturn versus Mercury–Saturn;
- intentionally contrasting aspects such as Moon square Saturn versus Moon opposite Saturn;
- supportive contrasts such as Venus trine Saturn versus Venus sextile Saturn;
- all five aspect variants of the same pair reviewed side by side;
- directional transit reversals reviewed side by side;
- personal versus guest rendering;
- present versus missing house context;
- outer-planet sign text alone versus the same placement with house/aspect evidence;
- full rendered-reading review for repetition, hierarchy, and coherence.

These reviews answer: **Does the result explain this configuration meaningfully, and does the complete reading feel coherent?**

Test coverage must never be cited as evidence that prose meets the interpretation contract.

## 15. Editorial acceptance checklist

Before a content family is considered complete, an editor should be able to answer yes to the applicable questions:

- Does the reading identify the symbols without stopping at definitions?
- Does it explain the relationship or modification between them?
- Can a beginner recognize an internal or ordinary-life mechanism?
- Are constructive and difficult expressions derived from the same pattern?
- Is it distinguishable from neighboring configurations?
- Is its personalness justified by the available evidence?
- Are house and angle claims correct for Whole Sign houses?
- Are generational factors calibrated?
- Does any prompt or practice follow from the active configuration?
- Does the rendered surface avoid false specificity and repetition?
- Would the reading remain accurate if the user is viewing someone else’s chart?

## 16. Current architecture implications

This standard favors compositional primitives only when they preserve configuration-specific meaning. For complex aspect families, the expected model is a hybrid of strong pair cores, aspect-specific interaction, lived expression, range, context frame, and selective overrides.

Fully bespoke entries remain appropriate where composition becomes mechanical or loses a critical distinction. Generic primitives remain useful for educational definitions and explicit fallback. They are not substitutes for interpretation.

For placement families, a finite bespoke or editorially composed result must explain the combined placement. Concatenating complete planet-sign and planet-house paragraphs may remain useful as supporting detail, but it does not fulfill the synthesis contract by itself.

## 17. Objective doctrine conflicts at current HEAD

These entries conflict with the V1 doctrine above. They were not changed while drafting this standard.

### 17.1 House/angle conflation

`client/lib/lexicon/houses/meanings.ts`:

- House 1 long text labels the first house “(Ascendant)” at line 10.
- House 4 long text labels the fourth house “(IC)” at line 26.
- House 7 long text labels the seventh house “(Descendant)” at line 41.
- House 10 long text labels the tenth house “(MC)” at line 56.

### 17.2 Natural-house rulership assertions in planet × house

`client/lib/lexicon/planetHouses/meanings.ts`:

- Moon in house 4, line 105;
- Mercury in house 3, line 174;
- Venus in house 7, line 273;
- Jupiter in house 9, line 435;
- Saturn in house 10, line 516;
- Uranus in house 11, line 597;
- Neptune in house 12, line 678;
- Pluto in house 8, line 729.

Each calls the placement natural because the planet “rules this house.”

### 17.3 Natural-house rulership assertions in house × sign

`client/lib/lexicon/houses/signMeanings.ts`:

- Cancer on house 4, line 255;
- Leo on house 5, line 335;
- Virgo on house 6, line 415;
- Libra on house 7, line 495;
- Scorpio on house 8, line 575;
- Sagittarius on house 9, line 655;
- Capricorn on house 10, line 735;
- Aquarius on house 11, line 815;
- Pisces on house 12, line 895.

Each calls the combination natural because the sign “rules this house.”

### 17.4 Outer-planet sign personalness

`client/lib/lexicon/planets/index.ts` contains all 36 Uranus, Neptune, and Pluto sign entries. They are written primarily as individual second-person traits, challenges, or missions and do not establish their generational/shared basis. The blocks begin with Uranus at line 683, Neptune at line 774, and Pluto at line 865 in the current file.

Several also use unsupported rulership/dignity shorthand: Uranus in Aquarius at line 756, Neptune in Pisces at line 854, and Pluto in Scorpio at line 917 say the planet is “at home.” Other current “at home” entries appear for Moon in Cancer, Mercury in Gemini, Venus in Taurus, Jupiter in Sagittarius, and Saturn in Capricorn. V1 does not use those statements as an interpretive mechanism.

## 18. Required approval and next implementation boundary

Adopting this document settles the default doctrine. Three choices still need explicit product/editorial approval before their related implementation:

1. **Chart-subject voice:** approve subject-aware variants for self versus guest charts, or choose neutral chart-subject language for all natal content. The standard prohibits automatic second person when ownership is uncertain either way.
2. **Dignity reference copy:** confirm that dignity language is removed from interpretive prose entirely in V1, or retained only in a separately labeled educational glossary. Dignity must not influence interpretation or ranking under either choice.
3. **Reachability manifest:** approve the generated, calculation-backed list of supported natal and Sky Now pair/aspect combinations before authoring coverage targets. A theoretical 45 × 5 matrix must not override astronomical reachability.

The first implementation slice after approval should remain inside C1 and correct only objective doctrine conflicts:

1. remove the four house/angle equivalences in `houses/meanings.ts`;
2. remove the eight planet-to-natural-house rulership claims in `planetHouses/meanings.ts` without rewriting the rest of those entries;
3. remove the nine sign-to-natural-house rulership claims in `houses/signMeanings.ts` without rewriting the rest of those entries;
4. add narrow regression checks that these literal equivalences and rulership claims cannot return;
5. preserve calculation code, keys, lookup behavior, and UI structure.

Outer-planet sign calibration should be the following C1 editorial slice because it affects 36 full interpretations and requires an approved shared template plus bespoke review. Natal aspect architecture and the large lexicon rewrite begin only after the standard and objective-correction slice are accepted.

Likely files for the first slice:

- `client/lib/lexicon/houses/meanings.ts`
- `client/lib/lexicon/planetHouses/meanings.ts`
- `client/lib/lexicon/houses/signMeanings.ts`
- the nearest lexicon coverage/integrity test file, or a narrowly scoped doctrine-integrity test beside those lexicons

No calculation file should change for that slice.
