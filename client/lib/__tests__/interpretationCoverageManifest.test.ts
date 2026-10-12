import { computeNatalPlanets } from "../astro";
import { ASPECT_RULES, calculateAspects } from "../aspects";
import { DAILY_TRANSIT_PLANET_NAMES } from "../dailyTransits";
import {
  DAYS_PER_WEEK,
  MAX_WEEKLY_THEMES,
  WEEKLY_PROMPT_SELECTION_WEIGHTS,
} from "../guidance/weeklyForecast";
import {
  FAST_WEEKLY_ORB_LIMIT,
  MAX_HIGHLIGHTS_PER_PLANET,
  MAX_WEEKLY_HIGHLIGHTS,
  MAX_WEEKLY_MOON_HIGHLIGHTS,
  SLOW_WEEKLY_ORB_LIMIT,
  WEEKLY_ASPECT_RELEVANCE,
  WEEKLY_PLANET_RELEVANCE,
  WEEKLY_SIGNIFICANCE_RANKING_POLICY,
  calculateWeeklySignificanceScore,
  compareWeeklyHighlights,
} from "../guidance/weeklyTransitEvents";
import {
  ASPECT_ORB_POLICY,
  CANONICAL_ASPECT_TYPES,
  CANONICAL_ASTROLOGICAL_BODIES,
  DAILY_BACKGROUND_ONLY_PRACTICE_IDS,
  DAILY_TRANSITING_BODIES,
  DAILY_TRANSIT_CELLS,
  EDITORIAL_ACCEPTANCE_EVIDENCE,
  FALLBACK_CONTRACT,
  HOUSE_ONLY_PROMPT_IDS,
  IMPOSSIBLE_SAME_MOMENT_CELLS,
  KNOWN_CONFORMANCE_FOLLOW_UPS,
  NATAL_ASPECT_CELLS,
  PRODUCT_EPOCH_POLICY,
  PROMPT_PRACTICE_REACHABILITY,
  SAVED_CHART_BODY_CONTRACT,
  SAME_MOMENT_REACHABILITY_GUARD_BOUNDS,
  SKY_NOW_ASPECT_CELLS,
  SURFACE_SELECTION_POLICIES,
  TRANSITING_BODY_SUPPORT,
  WEEKLY_HIGHLIGHT_CELLS,
  WEEKLY_TRANSITING_BODIES,
  canonicalUnorderedPair,
  directionalAspectIdentity,
  summarizeCoverage,
  unorderedAspectIdentity,
  type DirectionalCoverageCell,
  type SameMomentCoverageCell,
} from "../interpretationCoverageManifest";
import { ASPECT_MEANINGS } from "../lexicon";
import {
  MOON_SATURN_ASPECT_OVERRIDES,
  SKY_ASPECT_DYNAMICS,
  SKY_PAIR_ASPECT_OVERRIDES,
  SKY_PAIR_THEMES,
  SKY_PLANETS,
  getSkyAspectMeaning,
} from "../lexicon/aspects/currentSky";
import {
  ASPECT_DYNAMIC_GUIDANCE,
  GUIDANCE_TRANSIT_PLANETS,
  HOUSE_GUIDANCE,
  NATAL_TARGET_GUIDANCE,
  REFLECTION_PROMPTS,
  SIGN_GUIDANCE,
  SUGGESTED_PRACTICES,
  TRANSIT_PLANET_GUIDANCE,
} from "../lexicon/guidance";
import type { WeeklyTransitHighlight } from "../guidance/types";
import { isValidCivilDate } from "../time";

const ALL_CELLS = [
  ...NATAL_ASPECT_CELLS,
  ...SKY_NOW_ASPECT_CELLS,
  ...DAILY_TRANSIT_CELLS,
  ...WEEKLY_HIGHLIGHT_CELLS,
];

const impossibleIds = IMPOSSIBLE_SAME_MOMENT_CELLS.map(
  ([first, second, aspect]) => unorderedAspectIdentity(first, second, aspect),
);

function expectCoverageInvariants(
  cells: readonly (SameMomentCoverageCell | DirectionalCoverageCell)[],
) {
  for (const cell of cells) {
    if (cell.physicalReachability === "impossible") {
      expect(cell).toEqual(
        expect.objectContaining({
          surfaceSupport: "notApplicable",
          contentProvenance: "none",
          presentation: "notApplicable",
          editorialAcceptance: "notApplicable",
          cycleClass: "notApplicable",
          resolverId: null,
        }),
      );
    }

    if (cell.surfaceSupport === "supported") {
      expect(cell.contentProvenance).not.toBe("none");
      expect(cell.resolverId).not.toBeNull();
    }
  }
}

function requireSkyMeaning(
  pairKey: string,
  aspect: (typeof CANONICAL_ASPECT_TYPES)[number],
) {
  const [first, second] = pairKey.split(":");
  const meaning = getSkyAspectMeaning(first, second, aspect);
  expect(meaning).not.toBeNull();
  if (!meaning) throw new Error(`Missing Sky meaning for ${pairKey}:${aspect}`);
  return meaning;
}

function weeklyHighlight(
  overrides: Partial<WeeklyTransitHighlight> = {},
): WeeklyTransitHighlight {
  return {
    transitPlanet: "Mars",
    natalPlanet: "Moon",
    aspect: "conj",
    orb: 1,
    tone: "intensifying",
    intensity: "high",
    sourceIds: [],
    date: "2026-01-01",
    activeDays: 1,
    significanceScore: 50,
    ...overrides,
  };
}

describe("interpretation coverage contract", () => {
  it("matches the canonical bodies produced by the live ephemeris wrapper", () => {
    const calculatedBodies = computeNatalPlanets(
      new Date("2000-01-01T12:00:00.000Z"),
    ).map(({ name }) => name);

    expect(calculatedBodies).toEqual(CANONICAL_ASTROLOGICAL_BODIES);
    expect(SKY_PLANETS).toEqual(CANONICAL_ASTROLOGICAL_BODIES);
    expect(Object.keys(NATAL_TARGET_GUIDANCE)).toEqual(
      CANONICAL_ASTROLOGICAL_BODIES,
    );
  });

  it("keeps every surface body set synchronized with its live calculation filter", () => {
    expect(DAILY_TRANSIT_PLANET_NAMES).toEqual(DAILY_TRANSITING_BODIES);
    expect(GUIDANCE_TRANSIT_PLANETS).toEqual(WEEKLY_TRANSITING_BODIES);
    expect(TRANSITING_BODY_SUPPORT.daily).toEqual({
      Sun: "supported",
      Moon: "supported",
      Mercury: "supported",
      Venus: "supported",
      Mars: "supported",
      Jupiter: "productExcluded",
      Saturn: "productExcluded",
      Uranus: "productExcluded",
      Neptune: "productExcluded",
      Pluto: "productExcluded",
    });
    expect(TRANSITING_BODY_SUPPORT.weeklyHighlights).toEqual({
      Sun: "supported",
      Moon: "supported",
      Mercury: "supported",
      Venus: "supported",
      Mars: "supported",
      Jupiter: "supported",
      Saturn: "supported",
      Uranus: "productExcluded",
      Neptune: "productExcluded",
      Pluto: "productExcluded",
    });
  });

  it("keeps aspect keys, targets, and base orbs synchronized with calculation", () => {
    expect(ASPECT_RULES.map(({ type }) => type)).toEqual(
      CANONICAL_ASPECT_TYPES,
    );
    expect(
      Object.fromEntries(
        ASPECT_RULES.map(({ type, angle, orb }) => [type, { angle, orb }]),
      ),
    ).toEqual(ASPECT_ORB_POLICY.base);
    expect(Object.keys(ASPECT_MEANINGS)).toEqual(
      expect.arrayContaining([...CANONICAL_ASPECT_TYPES]),
    );
    expect(Object.keys(ASPECT_DYNAMIC_GUIDANCE)).toEqual(
      expect.arrayContaining([...CANONICAL_ASPECT_TYPES]),
    );
  });

  it("keeps Weekly tighter orbs synchronized with runtime filters", () => {
    expect(FAST_WEEKLY_ORB_LIMIT).toEqual(ASPECT_ORB_POLICY.weeklyFastBody);
    expect(SLOW_WEEKLY_ORB_LIMIT).toEqual(
      ASPECT_ORB_POLICY.weeklyJupiterSaturn,
    );
  });

  it("protects cross-sign geometry without requiring sign agreement", () => {
    expect(
      calculateAspects([
        { name: "A", lon: 29.5 },
        { name: "B", lon: 30.5 },
      ]),
    ).toEqual([{ a: "A", b: "B", type: "conj", orb: 1 }]);
  });

  it("records an undecided product epoch separately from parser limits", () => {
    expect(PRODUCT_EPOCH_POLICY).toEqual({
      status: "undecided",
      inputValidationEnvelope: {
        minimumCivilYear: 1,
        maximumCivilYear: 9999,
      },
      interpretation:
        "The input-validation envelope is not the supported astrology epoch.",
    });
    expect(isValidCivilDate({ year: 9999, month: 12, day: 31 })).toBe(true);
    expect(isValidCivilDate({ year: 0, month: 1, day: 1 })).toBe(false);
    expect(isValidCivilDate({ year: 10000, month: 1, day: 1 })).toBe(false);
  });
});

describe("same-moment physical reachability", () => {
  it("encodes all 225 theoretical cells and the exact eleven impossibilities", () => {
    expect(NATAL_ASPECT_CELLS).toHaveLength(45 * 5);
    expect(SKY_NOW_ASPECT_CELLS).toHaveLength(45 * 5);
    expect(new Set(impossibleIds).size).toBe(11);
    expect(impossibleIds).toEqual([
      "Sun:Mercury:opp",
      "Sun:Mercury:trine",
      "Sun:Mercury:square",
      "Sun:Mercury:sextile",
      "Sun:Venus:opp",
      "Sun:Venus:trine",
      "Sun:Venus:square",
      "Sun:Venus:sextile",
      "Mercury:Venus:opp",
      "Mercury:Venus:trine",
      "Mercury:Venus:square",
    ]);

    for (const cells of [NATAL_ASPECT_CELLS, SKY_NOW_ASPECT_CELLS]) {
      expect(
        cells
          .filter(
            ({ physicalReachability }) => physicalReachability === "impossible",
          )
          .map(({ id }) => id),
      ).toEqual(impossibleIds);
    }
  });

  it("keeps every impossible aspect window above its conservative pair bound", () => {
    const maximumSeparations: Record<string, number> =
      SAME_MOMENT_REACHABILITY_GUARD_BOUNDS.maximumGeocentricLongitudeSeparationDegrees;
    const restrictedPairs = [
      ...new Set(
        IMPOSSIBLE_SAME_MOMENT_CELLS.map(
          ([first, second]) => `${first}:${second}`,
        ),
      ),
    ];

    expect(Object.keys(maximumSeparations)).toEqual(restrictedPairs);

    for (const [first, second, aspect] of IMPOSSIBLE_SAME_MOMENT_CELLS) {
      const rule = ASPECT_RULES.find(({ type }) => type === aspect);
      expect(rule).toBeDefined();
      const windowLowerBound = (rule?.angle ?? 0) - (rule?.orb ?? 0);
      expect(windowLowerBound).toBeGreaterThan(
        maximumSeparations[`${first}:${second}`],
      );
    }

    expect(
      ASPECT_ORB_POLICY.base.sextile.angle - ASPECT_ORB_POLICY.base.sextile.orb,
    ).toBe(56);
    expect(
      ASPECT_ORB_POLICY.base.square.angle - ASPECT_ORB_POLICY.base.square.orb,
    ).toBe(85);
  });

  it("canonicalizes every unordered pair and does not duplicate reverse order", () => {
    const pairIds = new Set<string>();

    for (
      let first = 0;
      first < CANONICAL_ASTROLOGICAL_BODIES.length;
      first += 1
    ) {
      for (
        let second = first + 1;
        second < CANONICAL_ASTROLOGICAL_BODIES.length;
        second += 1
      ) {
        const a = CANONICAL_ASTROLOGICAL_BODIES[first];
        const b = CANONICAL_ASTROLOGICAL_BODIES[second];
        expect(canonicalUnorderedPair(a, b)).toEqual(
          canonicalUnorderedPair(b, a),
        );
        for (const aspect of CANONICAL_ASPECT_TYPES) {
          const id = unorderedAspectIdentity(a, b, aspect);
          expect(id).toBe(unorderedAspectIdentity(b, a, aspect));
          pairIds.add(id);
        }
      }
    }

    expect(pairIds.size).toBe(225);
  });

  it("keeps Sky lookup symmetric for every reachable identity", () => {
    for (const cell of SKY_NOW_ASPECT_CELLS) {
      if (cell.physicalReachability === "impossible") continue;
      const [first, second] = cell.pair;
      expect(getSkyAspectMeaning(first, second, cell.aspect)).toEqual(
        getSkyAspectMeaning(second, first, cell.aspect),
      );
    }
  });

  it("keeps all 44 ordinary Sky pairs on the binary meaning and shared-practice structure", () => {
    const ordinaryPairKeys = Object.keys(SKY_PAIR_THEMES).filter(
      (key) => key !== "Moon:Saturn",
    );
    expect(ordinaryPairKeys).toHaveLength(44);
    expect(Object.keys(SKY_PAIR_ASPECT_OVERRIDES)).toEqual(["Moon:Saturn"]);

    for (const pairKey of ordinaryPairKeys) {
      const byAspect = Object.fromEntries(
        CANONICAL_ASPECT_TYPES.map((aspect) => [
          aspect,
          requireSkyMeaning(pairKey, aspect),
        ]),
      ) as Record<
        (typeof CANONICAL_ASPECT_TYPES)[number],
        ReturnType<typeof requireSkyMeaning>
      >;

      expect(
        new Set(
          ["conj", "trine", "sextile"].map(
            (aspect) => byAspect[aspect as "conj"].meaning,
          ),
        ).size,
      ).toBe(1);
      expect(
        new Set(
          ["opp", "square"].map((aspect) => byAspect[aspect as "opp"].meaning),
        ).size,
      ).toBe(1);
      expect(
        new Set(Object.values(byAspect).map(({ practice }) => practice)).size,
      ).toBe(1);
      expect(
        new Set(Object.values(byAspect).map(({ reflection }) => reflection))
          .size,
      ).toBe(1);
    }
  });

  it("keeps Moon-Saturn as exactly five meaning/practice overrides with shared reflection", () => {
    expect(SKY_PAIR_ASPECT_OVERRIDES["Moon:Saturn"]).toBe(
      MOON_SATURN_ASPECT_OVERRIDES,
    );
    expect(Object.keys(MOON_SATURN_ASPECT_OVERRIDES).sort()).toEqual(
      [...CANONICAL_ASPECT_TYPES].sort(),
    );
    for (const override of Object.values(MOON_SATURN_ASPECT_OVERRIDES)) {
      expect(Object.keys(override).sort()).toEqual(["meaning", "practice"]);
    }

    const rendered = CANONICAL_ASPECT_TYPES.map((aspect) =>
      requireSkyMeaning("Moon:Saturn", aspect),
    );
    expect(new Set(rendered.map(({ meaning }) => meaning)).size).toBe(5);
    expect(new Set(rendered.map(({ practice }) => practice)).size).toBe(5);
    expect(new Set(rendered.map(({ reflection }) => reflection)).size).toBe(1);
  });
});

describe("coverage denominators and content provenance", () => {
  it("reports Natal as 214 generic definitions and zero pair-specific cells", () => {
    expect(summarizeCoverage(NATAL_ASPECT_CELLS)).toEqual({
      theoretical: 225,
      reachable: 214,
      impossible: 11,
      supported: 214,
      productExcluded: 0,
      bespoke: 0,
      partialBespoke: 0,
      structuredComposition: 0,
      genericDefinition: 214,
      none: 11,
      presentedAsSpecific: 214,
      labeledAsGeneric: 0,
      notRendered: 0,
      presentationNotApplicable: 11,
      accepted: 0,
      belowStandard: 214,
      notReviewed: 0,
      editorialNotApplicable: 11,
    });
    expect(
      NATAL_ASPECT_CELLS.filter(
        ({ physicalReachability }) => physicalReachability === "reachable",
      ).every(
        (cell) =>
          cell.presentation === "presentedAsSpecific" &&
          cell.editorialAcceptance === "belowStandard" &&
          cell.resolverId === "lexicon.aspect.generic-definition",
      ),
    ).toBe(true);
  });

  it("reports Sky Now as five partial overrides and 209 compositions", () => {
    expect(summarizeCoverage(SKY_NOW_ASPECT_CELLS)).toEqual({
      theoretical: 225,
      reachable: 214,
      impossible: 11,
      supported: 214,
      productExcluded: 0,
      bespoke: 0,
      partialBespoke: 5,
      structuredComposition: 209,
      genericDefinition: 0,
      none: 11,
      presentedAsSpecific: 214,
      labeledAsGeneric: 0,
      notRendered: 0,
      presentationNotApplicable: 11,
      accepted: 0,
      belowStandard: 209,
      notReviewed: 5,
      editorialNotApplicable: 11,
    });
    expect(Object.keys(SKY_PAIR_THEMES)).toHaveLength(45);
    expect(Object.keys(SKY_ASPECT_DYNAMICS)).toHaveLength(5);
    expect(Object.keys(MOON_SATURN_ASPECT_OVERRIDES)).toEqual(
      expect.arrayContaining([...CANONICAL_ASPECT_TYPES]),
    );
    expect(Object.keys(MOON_SATURN_ASPECT_OVERRIDES)).toHaveLength(5);

    const partialIds = SKY_NOW_ASPECT_CELLS.filter(
      ({ contentProvenance }) => contentProvenance === "partialBespoke",
    ).map(({ id, physicalReachability }) => ({ id, physicalReachability }));
    expect(partialIds).toEqual(
      CANONICAL_ASPECT_TYPES.map((aspect) => ({
        id: `Moon:Saturn:${aspect}`,
        physicalReachability: "reachable",
      })),
    );
  });

  it("reports all 250 Daily identities as directional composition", () => {
    expect(summarizeCoverage(DAILY_TRANSIT_CELLS)).toEqual({
      theoretical: 250,
      reachable: 250,
      impossible: 0,
      supported: 250,
      productExcluded: 0,
      bespoke: 0,
      partialBespoke: 0,
      structuredComposition: 250,
      genericDefinition: 0,
      none: 0,
      presentedAsSpecific: 250,
      labeledAsGeneric: 0,
      notRendered: 0,
      presentationNotApplicable: 0,
      accepted: 0,
      belowStandard: 250,
      notReviewed: 0,
      editorialNotApplicable: 0,
    });
  });

  it("reports all 350 Weekly highlight identities as directional composition", () => {
    expect(summarizeCoverage(WEEKLY_HIGHLIGHT_CELLS)).toEqual({
      theoretical: 350,
      reachable: 350,
      impossible: 0,
      supported: 350,
      productExcluded: 0,
      bespoke: 0,
      partialBespoke: 0,
      structuredComposition: 350,
      genericDefinition: 0,
      none: 0,
      presentedAsSpecific: 350,
      labeledAsGeneric: 0,
      notRendered: 0,
      presentationNotApplicable: 0,
      accepted: 0,
      belowStandard: 350,
      notReviewed: 0,
      editorialNotApplicable: 0,
    });
  });

  it("enforces impossible and supported cell invariants exhaustively", () => {
    expectCoverageInvariants(ALL_CELLS);
  });

  it("requires explicit review evidence for every accepted cell", () => {
    const acceptedIds = ALL_CELLS.filter(
      ({ editorialAcceptance }) => editorialAcceptance === "accepted",
    ).map(({ id }) => id);
    const evidenceIds = EDITORIAL_ACCEPTANCE_EVIDENCE.map(
      ({ cellId }) => cellId,
    );

    expect(acceptedIds).toEqual([]);
    expect(acceptedIds).toEqual(evidenceIds);
    expect(new Set(evidenceIds).size).toBe(evidenceIds.length);
    for (const evidence of EDITORIAL_ACCEPTANCE_EVIDENCE) {
      expect(evidence.reviewReference.trim()).not.toBe("");
      expect(ALL_CELLS.some(({ id }) => id === evidence.cellId)).toBe(true);
    }
  });

  it("uses distinct qualitative cycle classes for collective and personal scale", () => {
    for (const cells of [NATAL_ASPECT_CELLS, SKY_NOW_ASPECT_CELLS]) {
      expect(
        cells.filter(({ cycleClass }) => cycleClass === "ordinaryCycle"),
      ).toHaveLength(164);
      expect(
        cells.filter(({ cycleClass }) => cycleClass === "cohortSameMoment"),
      ).toHaveLength(35);
      expect(
        cells.filter(
          ({ cycleClass }) => cycleClass === "generationalSameMoment",
        ),
      ).toHaveLength(15);
      expect(
        cells.filter(({ cycleClass }) => cycleClass === "notApplicable"),
      ).toHaveLength(11);
    }

    expect(
      DAILY_TRANSIT_CELLS.filter(
        ({ cycleClass }) => cycleClass === "ordinaryCycle",
      ),
    ).toHaveLength(250);
    expect(
      WEEKLY_HIGHLIGHT_CELLS.filter(
        ({ cycleClass }) => cycleClass === "ordinaryCycle",
      ),
    ).toHaveLength(250);
    expect(
      WEEKLY_HIGHLIGHT_CELLS.filter(
        ({ cycleClass }) => cycleClass === "slowPersonalTransit",
      ),
    ).toHaveLength(100);
  });

  it.each([
    ["Jupiter", "Saturn"],
    ["Jupiter", "Uranus"],
    ["Jupiter", "Neptune"],
    ["Jupiter", "Pluto"],
    ["Saturn", "Uranus"],
    ["Saturn", "Neptune"],
    ["Saturn", "Pluto"],
  ] as const)(
    "classifies %s-%s as cohort rather than generational",
    (first, second) => {
      for (const cells of [NATAL_ASPECT_CELLS, SKY_NOW_ASPECT_CELLS]) {
        const pairCells = cells.filter(
          ({ pair }) => pair[0] === first && pair[1] === second,
        );
        expect(pairCells).toHaveLength(5);
        expect(
          pairCells.every(
            ({ cycleClass }) => cycleClass === "cohortSameMoment",
          ),
        ).toBe(true);
      }
    },
  );

  it.each([
    ["Uranus", "Neptune"],
    ["Uranus", "Pluto"],
    ["Neptune", "Pluto"],
  ] as const)("classifies %s-%s as generational", (first, second) => {
    for (const cells of [NATAL_ASPECT_CELLS, SKY_NOW_ASPECT_CELLS]) {
      const pairCells = cells.filter(
        ({ pair }) => pair[0] === first && pair[1] === second,
      );
      expect(pairCells).toHaveLength(5);
      expect(
        pairCells.every(
          ({ cycleClass }) => cycleClass === "generationalSameMoment",
        ),
      ).toBe(true);
    }
  });
});

describe("directional transit identity", () => {
  it("keeps Daily reverse roles distinct whenever both bodies can transit", () => {
    for (const first of DAILY_TRANSITING_BODIES) {
      for (const second of DAILY_TRANSITING_BODIES) {
        if (first === second) continue;
        for (const aspect of CANONICAL_ASPECT_TYPES) {
          expect(directionalAspectIdentity(first, second, aspect)).not.toBe(
            directionalAspectIdentity(second, first, aspect),
          );
        }
      }
    }
  });

  it("keeps Weekly reverse roles distinct whenever both bodies can transit", () => {
    for (const first of WEEKLY_TRANSITING_BODIES) {
      for (const second of WEEKLY_TRANSITING_BODIES) {
        if (first === second) continue;
        for (const aspect of CANONICAL_ASPECT_TYPES) {
          expect(directionalAspectIdentity(first, second, aspect)).not.toBe(
            directionalAspectIdentity(second, first, aspect),
          );
        }
      }
    }
  });

  it("contains each supported directional identity exactly once", () => {
    expect(new Set(DAILY_TRANSIT_CELLS.map(({ id }) => id)).size).toBe(250);
    expect(new Set(WEEKLY_HIGHLIGHT_CELLS.map(({ id }) => id)).size).toBe(350);
  });
});

describe("selection and prompt/practice contracts", () => {
  it("keeps selection limits synchronized with runtime constants", () => {
    expect(SURFACE_SELECTION_POLICIES.daily.renderedPrimaryLimit).toBe(1);
    expect(SURFACE_SELECTION_POLICIES.weeklyDailyRhythm.snapshots).toBe(
      DAYS_PER_WEEK,
    );
    expect(SURFACE_SELECTION_POLICIES.weeklyHighlights).toEqual(
      expect.objectContaining({
        snapshots: DAYS_PER_WEEK,
        maxHighlights: MAX_WEEKLY_HIGHLIGHTS,
        maxMoonHighlights: MAX_WEEKLY_MOON_HIGHLIGHTS,
        maxOtherHighlightsPerTransitingBody: MAX_HIGHLIGHTS_PER_PLANET,
        maxThemes: MAX_WEEKLY_THEMES,
      }),
    );
  });

  it("keeps Weekly significance ranking synchronized with runtime policy", () => {
    const contractRanking =
      SURFACE_SELECTION_POLICIES.weeklyHighlights.significanceRanking;
    expect(WEEKLY_PLANET_RELEVANCE).toEqual(contractRanking.planetRelevance);
    expect(WEEKLY_ASPECT_RELEVANCE).toEqual(contractRanking.aspectRelevance);
    expect(WEEKLY_SIGNIFICANCE_RANKING_POLICY).toEqual({
      orbClosenessWeight: contractRanking.orbClosenessWeight,
      activeDayCap: contractRanking.activeDayCap,
      activeDayWeight: contractRanking.activeDayWeight,
      scoreDecimalPlaces: contractRanking.scoreDecimalPlaces,
      orbInputPrecision: contractRanking.orbInputPrecision,
      ordering: contractRanking.ordering,
    });
    expect(
      calculateWeeklySignificanceScore(
        { transitPlanet: "Saturn", aspect: "conj", orb: 0 },
        3,
      ),
    ).toBe(68);
    expect(
      calculateWeeklySignificanceScore(
        { transitPlanet: "Saturn", aspect: "conj", orb: 0 },
        30,
      ),
    ).toBe(68);

    expect(
      compareWeeklyHighlights(
        weeklyHighlight({ significanceScore: 51 }),
        weeklyHighlight({ significanceScore: 50 }),
      ),
    ).toBeLessThan(0);
    expect(
      compareWeeklyHighlights(
        weeklyHighlight({ transitPlanet: "Saturn" }),
        weeklyHighlight({ transitPlanet: "Moon" }),
      ),
    ).toBeLessThan(0);
    expect(
      compareWeeklyHighlights(
        weeklyHighlight({ orb: 0.5 }),
        weeklyHighlight({ orb: 1 }),
      ),
    ).toBeLessThan(0);
    expect(
      compareWeeklyHighlights(
        weeklyHighlight({ aspect: "conj" }),
        weeklyHighlight({ aspect: "square" }),
      ),
    ).toBeLessThan(0);
    expect(
      compareWeeklyHighlights(
        weeklyHighlight({ date: "2026-01-01" }),
        weeklyHighlight({ date: "2026-01-02" }),
      ),
    ).toBeLessThan(0);
  });

  it("records full-precision transit selection without changing boundary rounding", () => {
    expect(ASPECT_ORB_POLICY).toEqual(
      expect.objectContaining({
        transitSelectionPrecision: "fullPrecision",
        transitResultOrbPrecision: "twoDecimalPresentationValue",
        persistedNatalOrbPrecision: "twoDecimalCompatibilityValue",
      }),
    );
    expect(SURFACE_SELECTION_POLICIES.daily.orbPrecisionConformance).toBe(
      "fullPrecisionSelectionWithRoundedPresentationValue",
    );
    expect(
      SURFACE_SELECTION_POLICIES.weeklyHighlights.orbPrecisionConformance,
    ).toBe(
      "fullPrecisionFilteringRankingAndTieBreakWithRoundedPresentationValue",
    );
    expect(
      SURFACE_SELECTION_POLICIES.weeklyHighlights.significanceRanking
        .orbInputPrecision,
    ).toBe("fullPrecision");
    expect(KNOWN_CONFORMANCE_FOLLOW_UPS).not.toContain(
      "weekly-orb-rounding",
    );
    expect(KNOWN_CONFORMANCE_FOLLOW_UPS).not.toContain(
      "daily-rounded-orb-ranking",
    );
  });

  it("separates legacy hydration from canonical interpretation eligibility", () => {
    expect(SAVED_CHART_BODY_CONTRACT).toEqual(
      expect.objectContaining({
        supportedBodies: CANONICAL_ASTROLOGICAL_BODIES,
        permissiveLegacyHydrationExpandsContract: false,
        interpretationEligibility:
          "Noncanonical identities must not receive Naksha interpretation content merely because their aspect type is recognized.",
        dailyPrimarySelection:
          "Unsupported natal identities are excluded before ranking; the highest-ranked supported canonical contact becomes primary.",
      }),
    );
    expect(KNOWN_CONFORMANCE_FOLLOW_UPS).not.toContain(
      "noncanonical-saved-identities",
    );
    expect(KNOWN_CONFORMANCE_FOLLOW_UPS).not.toContain(
      "daily-noncanonical-primary-selection",
    );
  });

  it("keeps Weekly prompt scoring synchronized with runtime weights", () => {
    expect(WEEKLY_PROMPT_SELECTION_WEIGHTS).toEqual({
      sourceMatch:
        PROMPT_PRACTICE_REACHABILITY.weeklySelection.sourceMatchWeight,
      tagMatch: PROMPT_PRACTICE_REACHABILITY.weeklySelection.tagMatchWeight,
      toneMatch: PROMPT_PRACTICE_REACHABILITY.weeklySelection.toneMatchWeight,
    });
  });

  it("separates primary-mechanism and background-only source candidates", () => {
    const primaryMechanismSourceIds = new Set([
      ...DAILY_TRANSITING_BODIES.map(
        (body) => TRANSIT_PLANET_GUIDANCE[body].id,
      ),
      ...Object.values(NATAL_TARGET_GUIDANCE).map(({ id }) => id),
      ...Object.values(ASPECT_DYNAMIC_GUIDANCE).map(({ id }) => id),
    ]);
    const backgroundSignSourceIds = new Set(
      Object.values(SIGN_GUIDANCE).map(({ id }) => id),
    );
    const sourceCandidateIds = (
      records: readonly { id: string; sourceIds: readonly string[] }[],
      sourceIds: ReadonlySet<string>,
    ) =>
      records
        .filter((record) =>
          record.sourceIds.some((sourceId) => sourceIds.has(sourceId)),
        )
        .map((record) => record.id);
    const primaryPromptIds = sourceCandidateIds(
      REFLECTION_PROMPTS,
      primaryMechanismSourceIds,
    );
    const primaryPracticeIds = sourceCandidateIds(
      SUGGESTED_PRACTICES,
      primaryMechanismSourceIds,
    );
    const backgroundOnlyPracticeIds = sourceCandidateIds(
      SUGGESTED_PRACTICES.filter(({ id }) => !primaryPracticeIds.includes(id)),
      backgroundSignSourceIds,
    );
    const backgroundOnlyPromptIds = sourceCandidateIds(
      REFLECTION_PROMPTS.filter(({ id }) => !primaryPromptIds.includes(id)),
      backgroundSignSourceIds,
    );

    expect(REFLECTION_PROMPTS).toHaveLength(
      PROMPT_PRACTICE_REACHABILITY.prompts.total,
    );
    expect(SUGGESTED_PRACTICES).toHaveLength(
      PROMPT_PRACTICE_REACHABILITY.practices.total,
    );
    expect(primaryPromptIds).toHaveLength(
      PROMPT_PRACTICE_REACHABILITY.prompts
        .sourceCandidatesThroughPrimaryTransitMechanism,
    );
    expect(primaryPracticeIds).toHaveLength(
      PROMPT_PRACTICE_REACHABILITY.practices
        .sourceCandidatesThroughPrimaryTransitMechanism,
    );
    expect(backgroundOnlyPracticeIds.sort()).toEqual(
      [...DAILY_BACKGROUND_ONLY_PRACTICE_IDS].sort(),
    );
    expect(backgroundOnlyPracticeIds).toHaveLength(
      PROMPT_PRACTICE_REACHABILITY.practices
        .sourceCandidatesThroughBackgroundSignContextOnly,
    );
    expect(backgroundOnlyPromptIds).toHaveLength(
      PROMPT_PRACTICE_REACHABILITY.prompts
        .sourceCandidatesThroughBackgroundSignContextOnly,
    );
    expect(PROMPT_PRACTICE_REACHABILITY.prompts.tagFallbackPool).toBe(
      REFLECTION_PROMPTS.length,
    );
    expect(PROMPT_PRACTICE_REACHABILITY.practices.tagFallbackPool).toBe(
      SUGGESTED_PRACTICES.length,
    );
    expect(
      PROMPT_PRACTICE_REACHABILITY.dailySelection.sourceMatchOrigins,
    ).toEqual([
      "transitingPlanet",
      "natalTarget",
      "aspectDynamic",
      "transitingSunSignBackground",
      "transitingMoonSignBackground",
    ]);
  });

  it("names the five house-only prompts without classifying them as dead", () => {
    const byId = new Map(
      REFLECTION_PROMPTS.map((prompt) => [prompt.id, prompt]),
    );
    expect(HOUSE_ONLY_PROMPT_IDS).toHaveLength(5);

    for (const id of HOUSE_ONLY_PROMPT_IDS) {
      const prompt = byId.get(id);
      expect(prompt).toBeDefined();
      expect(prompt?.sourceIds).toHaveLength(1);
      expect(prompt?.sourceIds[0]).toMatch(/^guidance\.house\./);
    }
    expect(PROMPT_PRACTICE_REACHABILITY.prompts.dead).toBe(0);
  });

  it("keeps every prompt and practice source ID valid", () => {
    const validSourceIds = new Set([
      ...Object.values(TRANSIT_PLANET_GUIDANCE).map(({ id }) => id),
      ...Object.values(NATAL_TARGET_GUIDANCE).map(({ id }) => id),
      ...Object.values(ASPECT_DYNAMIC_GUIDANCE).map(({ id }) => id),
      ...Object.values(SIGN_GUIDANCE).map(({ id }) => id),
      ...Object.values(HOUSE_GUIDANCE).map(({ id }) => id),
    ]);

    for (const record of [...REFLECTION_PROMPTS, ...SUGGESTED_PRACTICES]) {
      for (const sourceId of record.sourceIds) {
        expect(validSourceIds).toContain(sourceId);
      }
    }
  });
});

describe("fallback contract", () => {
  it("uses unique IDs and retains every required fallback classification", () => {
    const ids = FALLBACK_CONTRACT.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(
      expect.arrayContaining([
        "planet-sign.missing",
        "planet-house.missing",
        "chart.no-houses",
        "house-sign.missing",
        "house.generic-missing",
        "natal.no-aspects",
        "natal.generic-aspect-definition",
        "sky.unsupported-pair-or-type",
        "sky.calculation-failure",
        "daily.no-primary-transit",
        "daily.missing-house",
        "daily.prompt-source",
        "daily.prompt-tag",
        "daily.prompt-library",
        "weekly.no-highlight",
        "weekly.theme-unavailable",
      ]),
    );
  });

  it("does not describe the generic natal aspect path as safe or specific content", () => {
    const genericNatal = FALLBACK_CONTRACT.find(
      ({ id }) => id === "natal.generic-aspect-definition",
    );
    expect(genericNatal).toEqual(
      expect.objectContaining({
        provenance: "genericDefinition",
        state: "supportedOrdinary",
      }),
    );
    expect(genericNatal?.presentationRisk).toContain(
      "appears under a specific planet-pair label",
    );
  });

  it("describes missing placement blocks and dormant house-sign fallback accurately", () => {
    for (const id of ["planet-sign.missing", "planet-house.missing"]) {
      expect(FALLBACK_CONTRACT.find((entry) => entry.id === id)).toEqual(
        expect.objectContaining({
          state: "defensive",
          provenance: "none",
          presentationRisk:
            "The missing block is omitted; a summary may use the other available component.",
        }),
      );
    }

    expect(
      FALLBACK_CONTRACT.find(({ id }) => id === "house-sign.missing"),
    ).toEqual(
      expect.objectContaining({
        state: "dormant",
        provenance: "runtimeFallback",
        presentationRisk: expect.stringContaining(
          "All 144 canonical entries currently exist",
        ),
      }),
    );
  });
});
