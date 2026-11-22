# Naksha C1 interpretation-system status

Verified **12 October 2026 (Pacific)** on branch `ui/v2-redesign` through commit `073b5b5fb0d48abb7b480836fe72b451b9807a8d` (`C1.3D`).

This document is the concise status and handoff for C1. The governing editorial doctrine remains [naksha-interpretation-standard.md](naksha-interpretation-standard.md). The canonical machine-readable coverage source is `client/lib/interpretationCoverageManifest.ts`; counts in this document summarize that contract rather than replace it.

## C1 purpose and current verdict

C1 establishes the correctness boundary beneath Naksha's deterministic interpretation system:

`calculation → structured astrology data → curated interpretation → deterministic composition → UI`

The completed work through C1.3D makes supported identities, physical reachability, content provenance, selection precision, fallback behavior, legacy-data boundaries, and Daily prompt relevance explicit and testable. It preserves the supported V1 astrology surfaces while removing false interpretive claims and selection errors.

**Verdict:** the interpretation foundation is materially stronger and ready for the remaining narrow C1 exit work. C1 is not yet closed, and C2's broad prose rewrite should not start until the exit work listed below and the final capability-preservation audit pass.

## Completed foundation

### Interpretation doctrine

Naksha now has one governing standard for Tropical/Western astrology, Whole Sign houses, the five supported major aspects, contextual personalness, deterministic composition, rendering honesty, and editorial acceptance.

The standard distinguishes:

- planet × sign: how a planetary function operates;
- planet × house: where and through which life areas it operates;
- house × sign: the style and conditions of a life area, with lighter weight than an occupying planet;
- natal aspect: the interaction between two planetary functions;
- Sky Now: collective same-moment symbolism;
- transit-to-natal: a directional current influence acting on a natal function;
- Daily: one selected personal theme from supported transit evidence;
- Weekly: a week-level deterministic synthesis built from Daily rhythm and ranked highlights.

Transit direction is part of identity. `transiting Saturn → natal Moon` is not interchangeable with `transiting Moon → natal Saturn`.

### Whole Sign correctness

C1 removed prose that treated house numbers as literal angles. The first, fourth, seventh, and tenth Whole Sign houses are not automatically identical to the Ascendant, IC, Descendant, and MC. Natural-zodiac teaching correspondences are no longer presented as literal rulership of a calculated house.

These were prose and doctrine corrections. No new angle, ruler, dignity, or house-calculation engine was introduced.

### Calculation-derived reachability

The canonical same-moment body set contains ten bodies and 45 unordered pairs. Five aspects produce 225 theoretical pair-aspect cells.

Eleven Sun–Mercury, Sun–Venus, and Mercury–Venus cells are physically impossible under the verified calculation model. Natal and Sky Now therefore each have **214 physically reachable cells**.

The directional transit surfaces are:

- Daily: 5 eligible transiting bodies × 10 natal targets × 5 aspects = **250 cells**;
- Weekly highlights: 7 eligible transiting bodies × 10 natal targets × 5 aspects = **350 cells**;
- Weekly Daily Rhythm: reuses the Daily 250-cell contract.

Cross-sign aspects remain valid because aspect calculation uses longitude separation, aspect target, and orb rather than sign relationship.

### Machine-readable coverage and provenance

The coverage manifest independently records:

- physical reachability;
- surface support;
- content provenance;
- presentation;
- editorial acceptance;
- cycle class;
- resolver identity;
- surface selection policies;
- prompt/practice reachability;
- fallback state and presentation risk;
- legacy saved-chart interpretation boundaries;
- known conformance follow-ups.

Structural resolution does not imply editorial acceptance. Current broad classifications remain deliberately conservative:

- natal: 214/214 reachable cells use generic aspect definitions; 0/214 are pair-specific;
- Sky Now: 5 Moon–Saturn cells are partially bespoke; 209 use pair-theme plus generic/binary aspect composition;
- Daily: 250/250 use structured composition and remain below the interpretation standard;
- Weekly highlights: 350/350 use structured composition and remain below the interpretation standard.

Generic natal aspect prose still appears beneath specific pair labels. That is an explicitly recorded presentation risk for later content/rendering work, not evidence of bespoke interpretation.

### Cycle and personalness classification

Same-moment Uranus–Neptune–Pluto pairs are classified as generational. Other same-moment pairs where both bodies are Jupiter-or-slower are cohort or long-cycle configurations. Directional Jupiter or Saturn contacts to a natal body remain slow personal transits.

Outer-planet sign placements remain substantially generational. House placement and supported aspects may locate a shared signature more personally. The prose calibration needed to express that distinction consistently remains C1 exit work.

### Full-precision transit selection

Daily and Weekly now preserve full-precision orbs for filtering, selection, best-day choice, significance inputs, and orb tie-breaking. Public values remain rounded for display and persistence compatibility.

Weekly's final significance score is rounded to the configured decimal precision after using the full-precision orb input. The score policy itself was not redesigned.

This prevents display rounding from changing threshold eligibility or creating artificial orb ties.

### Canonical identities and legacy data

The supported V1 interpretation bodies are exactly Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto.

Legacy chart hydration remains tolerant of unknown nonempty endpoint names where safely possible. Interpretation eligibility is stricter:

- noncanonical identities receive no Naksha natal-aspect prose;
- identical endpoints such as `Moon square Moon` receive no natal-aspect prose;
- an unsupported aspect key remains unsupported;
- generated canonical charts continue using the canonical ten-body calculation contract.

Daily excludes unsupported natal identities before ranking candidates. A malformed tight contact can no longer suppress a later valid canonical contact and incorrectly force the no-primary fallback.

### Daily prompt hierarchy

Daily prompt selection now uses the active transit house without allowing house context to erase stronger configuration evidence.

The house-aware hierarchy is:

1. multi-source transit-mechanism match;
2. complete exact natal-target match;
3. exact active Whole Sign house;
4. other single-source transit-mechanism match;
5. Sun/Moon sign background;
6. tag fallback;
7. full-library fallback.

Across the 250 Daily directional cells, the strongest available mechanism class is:

- 80 multi-source mechanism cells;
- 60 complete exact-target cells;
- 110 other single-source mechanism cells.

The five prompts sourced exclusively by houses are now connected to their declared active-house context. They were not dead content before C1.3C: broader tag and library paths could select them. The defect was that their declared house source could not make them relevant during an ordinary primary-transit path.

Current prompt/practice reachability is:

- 34 prompts total;
- 29 primary-mechanism source candidates;
- 3 complete exact-target prompts;
- 6 prompts declaring house sources;
- 5 exclusively house-sourced prompts;
- 0 disconnected house prompts and 0 dead prompts;
- 24 practices total;
- 22 primary-mechanism source candidates;
- 2 background-sign-only candidates;
- 6 practices declaring house sources, all reachable through another declared mechanism or sign source.

Practice selection and Weekly's separate weighted representative-prompt scorer were not redesigned.

## Preserved V1 interpretation capacity

C1 preserves these supported structural surfaces:

- 120 planet-in-sign combinations;
- 120 planet-in-house combinations;
- 144 house-in-sign combinations;
- 214 reachable natal aspect configurations;
- 214 reachable Sky Now configurations;
- 250 Daily directional cells;
- 350 Weekly highlight cells;
- 34 reflection prompts;
- 24 practices.

Generated charts, canonical saved charts, guest-chart interpretation, and tolerant legacy hydration remain in the architecture. No database migration was required for the C1 interpretation behavior changes.

## User-facing effect

C1 improves which existing interpretation is selected and how honestly Naksha frames its support. Users should receive:

- the truly closest transit rather than one favored by rounded orbs;
- house-aware reflection when a house source is genuinely active;
- exact natal-target reflection when it is more specific than a house-only prompt;
- fewer generic fallbacks caused by malformed saved identities;
- no generic natal-aspect prose for unsupported or self-paired identities;
- clearer separation between personal, cohort, and generational symbolism.

C1 does not make the existing prose interpretively complete. It makes the boundary around that prose accurate enough for C2 and C3 to improve it safely.

## Current editorial limitations

The major audit conclusions still hold:

- natal aspects lack planet-pair-specific interpretation;
- most Sky Now pairs lack five-way aspect differentiation;
- planet-in-house and house-in-sign prose is structurally complete but formulaic;
- placement summaries concatenate components rather than synthesizing them;
- Daily composition still combines broad primitives rather than fully explaining many transit relationships;
- Weekly ranks and groups evidence but does not yet form a consistently coherent week-level narrative;
- outer-planet sign prose needs generational calibration;
- prompts and practices can still render without a visible provenance-strength distinction.

The next phases should add interpretation, not padding. Longer prose is warranted only when it contributes a distinct mechanism, lived expression, constructive range, difficult range, contextual limitation, or useful reflection.

## Remaining C1 exit work

C1 should close only after these narrow tasks are complete:

1. **Dignity-language cleanup.** Remove selective shorthand that implies a complete dignity system Naksha does not implement.
2. **Outer-planet sign calibration.** Frame Uranus, Neptune, and Pluto sign placements as shared/generational and locate personal expression through supported house/aspect evidence.
3. **Rising-sign doctrine-test cleanup.** Narrow the known overbroad test pattern before rising-sign content work.
4. **Benchmark cleanup.** Remove reviewer/meta commentary from authoring benchmarks while retaining the doctrine they establish.
5. **Final capability-preservation audit.** Exhaustively verify planet-sign, planet-house, house-sign, natal, Sky Now, Daily, Weekly, prompts, practices, generated charts, and canonical saved charts against the committed contract.

The product-supported astrology epoch and future-birth-date policy also remain explicit product/conformance decisions. They should not be inferred from the civil-year parser envelope.

The final audit should also resolve or explicitly retain the independent nonblocking contract-maintenance notes around conservative inner-planet separation guard bounds, exhaustive fallback-count assertions, and selection-order/comparator observability. These notes do not currently change a supported interpretation result, but they should not disappear from the C1 closure record.

## C2 entry standard

C2 should deepen interpretation rather than merely lengthen it. A successful entry should make the configuration recognizable with its label hidden by explaining:

- which symbolic functions are involved;
- how the sign, house, or aspect changes their relationship;
- what the mechanism can feel like internally;
- how it may appear in behavior, relationships, decisions, habits, work, or perception;
- constructive and difficult expressions of the same pattern;
- what distinguishes it from neighboring configurations;
- what the user can observe or work with;
- which contextual limits prevent overpersonalization or prophecy.

The immediate C2 priority remains pair-specific natal aspect interpretation, followed by the other high-severity families identified in the independent editorial audits.

## Verification baseline

The committed C1.3D checkpoint passes:

- **78 Jest suites / 989 tests**;
- TypeScript;
- ESLint;
- `git diff --check`.

This proves structural and behavioral integrity. It does not prove editorial acceptance. The manifest currently contains no accepted-cell evidence; later human review must move content to `accepted` deliberately.
