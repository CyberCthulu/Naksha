import type { AspectType, PlanetKey } from "./lexicon";

export const CANONICAL_ASTROLOGICAL_BODIES = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
] as const satisfies readonly PlanetKey[];

export const CANONICAL_ASPECT_TYPES = [
  "conj",
  "opp",
  "trine",
  "square",
  "sextile",
] as const satisfies readonly AspectType[];

export const DAILY_TRANSITING_BODIES = [
  "Moon",
  "Sun",
  "Mercury",
  "Venus",
  "Mars",
] as const satisfies readonly PlanetKey[];

export const WEEKLY_TRANSITING_BODIES = [
  "Moon",
  "Sun",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
] as const satisfies readonly PlanetKey[];

export type PhysicalReachability = "reachable" | "impossible";
export type SurfaceSupport = "supported" | "productExcluded" | "notApplicable";
export type ContentProvenance =
  | "bespoke"
  | "partialBespoke"
  | "structuredComposition"
  | "genericDefinition"
  | "none";
export type Presentation =
  | "presentedAsSpecific"
  | "labeledAsGeneric"
  | "notRendered"
  | "notApplicable";
export type EditorialAcceptance =
  | "accepted"
  | "belowStandard"
  | "notReviewed"
  | "notApplicable";

/** Qualitative temporal scale only; this does not promise a recurrence interval. */
export type CycleClass =
  | "ordinaryCycle"
  | "slowPersonalTransit"
  | "cohortSameMoment"
  | "generationalSameMoment"
  | "notApplicable";

export type CoverageDimensions = {
  physicalReachability: PhysicalReachability;
  surfaceSupport: SurfaceSupport;
  contentProvenance: ContentProvenance;
  presentation: Presentation;
  editorialAcceptance: EditorialAcceptance;
  cycleClass: CycleClass;
  resolverId: string | null;
};

export type SameMomentCoverageCell = CoverageDimensions & {
  id: string;
  pair: readonly [PlanetKey, PlanetKey];
  aspect: AspectType;
};

export type DirectionalCoverageCell = CoverageDimensions & {
  id: string;
  transitingBody: PlanetKey;
  natalTarget: PlanetKey;
  aspect: AspectType;
};

export const PRODUCT_EPOCH_POLICY = {
  status: "undecided",
  inputValidationEnvelope: {
    minimumCivilYear: 1,
    maximumCivilYear: 9999,
  },
  interpretation:
    "The input-validation envelope is not the supported astrology epoch.",
} as const;

export const ASPECT_ORB_POLICY = {
  base: {
    conj: { angle: 0, orb: 6 },
    opp: { angle: 180, orb: 6 },
    trine: { angle: 120, orb: 5 },
    square: { angle: 90, orb: 5 },
    sextile: { angle: 60, orb: 4 },
  },
  weeklyFastBody: {
    conj: 3,
    opp: 3,
    trine: 2.5,
    square: 2.5,
    sextile: 2,
  },
  weeklyJupiterSaturn: {
    conj: 1.5,
    opp: 1.5,
    trine: 1.25,
    square: 1.25,
    sextile: 1,
  },
  calculationBasis: "minimumEclipticLongitudeSeparation",
  boundaryRule: "inclusive",
  knownConformanceGap:
    "Weekly tight-orb filters currently receive two-decimal rounded orbs. Daily ranking also uses rounded orbs. Selection and filtering should eventually retain full precision and round only for display.",
} as const;

/**
 * Conservative contract bounds, not ephemeris calculations. They guard the
 * geometric assumptions behind the current impossible-cell set.
 */
export const SAME_MOMENT_REACHABILITY_GUARD_BOUNDS = {
  maximumGeocentricLongitudeSeparationDegrees: {
    "Sun:Mercury": 28,
    "Sun:Venus": 48,
    "Mercury:Venus": 76,
  },
  interpretation:
    "Each impossible aspect window must begin above its pair's conservative maximum separation bound.",
} as const;

const BODY_INDEX = new Map<PlanetKey, number>(
  CANONICAL_ASTROLOGICAL_BODIES.map((body, index) => [body, index]),
);

function requireBodyIndex(body: PlanetKey): number {
  const index = BODY_INDEX.get(body);
  if (index == null) throw new Error(`Unknown canonical body: ${body}`);
  return index;
}

export function canonicalUnorderedPair(
  first: PlanetKey,
  second: PlanetKey,
): readonly [PlanetKey, PlanetKey] {
  if (first === second) throw new Error("A pair requires two different bodies");
  return requireBodyIndex(first) < requireBodyIndex(second)
    ? [first, second]
    : [second, first];
}

export function unorderedAspectIdentity(
  first: PlanetKey,
  second: PlanetKey,
  aspect: AspectType,
): string {
  const pair = canonicalUnorderedPair(first, second);
  return `${pair[0]}:${pair[1]}:${aspect}`;
}

export function directionalAspectIdentity(
  transitingBody: PlanetKey,
  natalTarget: PlanetKey,
  aspect: AspectType,
): string {
  return `transit:${transitingBody}->natal:${natalTarget}:${aspect}`;
}

const SAME_MOMENT_PAIRS: readonly (readonly [PlanetKey, PlanetKey])[] =
  CANONICAL_ASTROLOGICAL_BODIES.flatMap((first, firstIndex) =>
    CANONICAL_ASTROLOGICAL_BODIES.slice(firstIndex + 1).map(
      (second) => [first, second] as const,
    ),
  );

/**
 * Geometric restrictions verified for the calculation model. These are
 * impossible cells, not missing content or product exclusions.
 */
export const IMPOSSIBLE_SAME_MOMENT_CELLS = [
  ["Sun", "Mercury", "opp"],
  ["Sun", "Mercury", "trine"],
  ["Sun", "Mercury", "square"],
  ["Sun", "Mercury", "sextile"],
  ["Sun", "Venus", "opp"],
  ["Sun", "Venus", "trine"],
  ["Sun", "Venus", "square"],
  ["Sun", "Venus", "sextile"],
  ["Mercury", "Venus", "opp"],
  ["Mercury", "Venus", "trine"],
  ["Mercury", "Venus", "square"],
] as const satisfies readonly (readonly [PlanetKey, PlanetKey, AspectType])[];

const IMPOSSIBLE_SAME_MOMENT_IDS = new Set<string>(
  IMPOSSIBLE_SAME_MOMENT_CELLS.map(([first, second, aspect]) =>
    unorderedAspectIdentity(first, second, aspect),
  ),
);

function sameMomentCycleClass(first: PlanetKey, second: PlanetKey): CycleClass {
  const bothSlow =
    requireBodyIndex(first) >= requireBodyIndex("Jupiter") &&
    requireBodyIndex(second) >= requireBodyIndex("Jupiter");
  if (!bothSlow) return "ordinaryCycle";

  return requireBodyIndex(first) >= requireBodyIndex("Uranus") ||
    requireBodyIndex(second) >= requireBodyIndex("Uranus")
    ? "generationalSameMoment"
    : "cohortSameMoment";
}

function impossibleDimensions(): CoverageDimensions {
  return {
    physicalReachability: "impossible",
    surfaceSupport: "notApplicable",
    contentProvenance: "none",
    presentation: "notApplicable",
    editorialAcceptance: "notApplicable",
    cycleClass: "notApplicable",
    resolverId: null,
  };
}

export const NATAL_ASPECT_CELLS: readonly SameMomentCoverageCell[] =
  SAME_MOMENT_PAIRS.flatMap(([first, second]) =>
    CANONICAL_ASPECT_TYPES.map((aspect) => {
      const id = unorderedAspectIdentity(first, second, aspect);
      const cycleClass = sameMomentCycleClass(first, second);
      return IMPOSSIBLE_SAME_MOMENT_IDS.has(id)
        ? {
            id,
            pair: [first, second],
            aspect,
            ...impossibleDimensions(),
          }
        : {
            id,
            pair: [first, second],
            aspect,
            physicalReachability: "reachable" as const,
            surfaceSupport: "supported" as const,
            contentProvenance: "genericDefinition" as const,
            presentation: "presentedAsSpecific" as const,
            editorialAcceptance: "belowStandard" as const,
            cycleClass,
            resolverId: "lexicon.aspect.generic-definition",
          };
    }),
  );

export const SKY_NOW_ASPECT_CELLS: readonly SameMomentCoverageCell[] =
  SAME_MOMENT_PAIRS.flatMap(([first, second]) =>
    CANONICAL_ASPECT_TYPES.map((aspect) => {
      const id = unorderedAspectIdentity(first, second, aspect);
      const cycleClass = sameMomentCycleClass(first, second);
      if (IMPOSSIBLE_SAME_MOMENT_IDS.has(id)) {
        return {
          id,
          pair: [first, second],
          aspect,
          ...impossibleDimensions(),
        };
      }
      const moonSaturn = first === "Moon" && second === "Saturn";
      return {
        id,
        pair: [first, second],
        aspect,
        physicalReachability: "reachable",
        surfaceSupport: "supported",
        contentProvenance: moonSaturn
          ? "partialBespoke"
          : "structuredComposition",
        presentation: "presentedAsSpecific",
        editorialAcceptance: moonSaturn ? "notReviewed" : "belowStandard",
        cycleClass,
        resolverId: moonSaturn
          ? "sky.pair-theme+aspect-dynamic+moon-saturn-meaning-practice-override"
          : "sky.pair-theme+generic-aspect-dynamic+binary-branch",
      } satisfies SameMomentCoverageCell;
    }),
  );

function directionalCycleClass(transitingBody: PlanetKey): CycleClass {
  return transitingBody === "Jupiter" || transitingBody === "Saturn"
    ? "slowPersonalTransit"
    : "ordinaryCycle";
}

function buildDirectionalCells(
  transitingBodies: readonly PlanetKey[],
  resolverId: string,
): readonly DirectionalCoverageCell[] {
  return transitingBodies.flatMap((transitingBody) =>
    CANONICAL_ASTROLOGICAL_BODIES.flatMap((natalTarget) =>
      CANONICAL_ASPECT_TYPES.map((aspect) => ({
        id: directionalAspectIdentity(transitingBody, natalTarget, aspect),
        transitingBody,
        natalTarget,
        aspect,
        physicalReachability: "reachable" as const,
        surfaceSupport: "supported" as const,
        contentProvenance: "structuredComposition" as const,
        presentation: "presentedAsSpecific" as const,
        editorialAcceptance: "belowStandard" as const,
        cycleClass: directionalCycleClass(transitingBody),
        resolverId,
      })),
    ),
  );
}

export const DAILY_TRANSIT_CELLS = buildDirectionalCells(
  DAILY_TRANSITING_BODIES,
  "guidance.daily.transit+target+aspect+sign+optional-house",
);

export const WEEKLY_HIGHLIGHT_CELLS = buildDirectionalCells(
  WEEKLY_TRANSITING_BODIES,
  "guidance.weekly.transit+target+aspect+persistence",
);

function transitingBodySupport(
  supported: readonly PlanetKey[],
): Record<PlanetKey, SurfaceSupport> {
  const included = new Set<PlanetKey>(supported);
  return Object.fromEntries(
    CANONICAL_ASTROLOGICAL_BODIES.map((body) => [
      body,
      included.has(body) ? "supported" : "productExcluded",
    ]),
  ) as Record<PlanetKey, SurfaceSupport>;
}

export const TRANSITING_BODY_SUPPORT = {
  daily: transitingBodySupport(DAILY_TRANSITING_BODIES),
  weeklyHighlights: transitingBodySupport(WEEKLY_TRANSITING_BODIES),
} as const;

export const SURFACE_SELECTION_POLICIES = {
  daily: {
    calculatedContacts: "allEligible",
    renderedPrimaryLimit: 1,
    order: ["orbAscending", "transitPriority", "natalName", "aspectKey"],
    lowerRankedContacts: "runtimeSelectionOmission",
    orbPrecisionConformance: "currentlyRanksRoundedTwoDecimalOrbs",
  },
  weeklyDailyRhythm: {
    snapshots: 7,
    snapshotTime: "localNoon",
    coverageContract: "daily",
  },
  weeklyHighlights: {
    snapshots: 7,
    snapshotTime: "localNoon",
    deduplicationIdentity: "transitingBody+aspect+natalTarget",
    maxHighlights: 5,
    maxMoonHighlights: 1,
    maxOtherHighlightsPerTransitingBody: 2,
    maxThemes: 3,
    significanceRanking: {
      planetRelevance: {
        Moon: 0,
        Sun: 16,
        Mercury: 14,
        Venus: 18,
        Mars: 22,
        Jupiter: 30,
        Saturn: 32,
      },
      aspectRelevance: {
        conj: 10,
        opp: 9,
        square: 9,
        trine: 7,
        sextile: 5,
      },
      orbClosenessWeight: 20,
      activeDayCap: 3,
      activeDayWeight: 2,
      scoreDecimalPlaces: 2,
      ordering: [
        "significanceScoreDescending",
        "planetRelevanceDescending",
        "orbAscending",
        "directionalIdentityAscending",
        "dateAscending",
      ],
    },
    lowerRankedContacts: "runtimeSelectionOmission",
    orbPrecisionConformance: "currentlyFiltersRoundedTwoDecimalOrbs",
  },
} as const;

export const HOUSE_ONLY_PROMPT_IDS = [
  "guidance.prompt.resource-stewardship",
  "guidance.prompt.inner-foundation",
  "guidance.prompt.create-without-performance",
  "guidance.prompt.shared-future",
  "guidance.prompt.gentle-release",
] as const;

export const DAILY_BACKGROUND_ONLY_PRACTICE_IDS = [
  "guidance.practice.tidy-one-area",
  "guidance.practice.rest-window",
] as const;

export const PROMPT_PRACTICE_REACHABILITY = {
  prompts: {
    total: 34,
    sourceCandidatesThroughPrimaryTransitMechanism: 29,
    sourceCandidatesThroughBackgroundSignContextOnly: 0,
    houseOnlyDisconnectedFromDailyPrimarySource: HOUSE_ONLY_PROMPT_IDS,
    tagFallbackPool: 34,
    fullLibraryFallbackPool: 34,
    allStructurallyReachableThroughBroaderPaths: true,
    dead: 0,
  },
  practices: {
    total: 24,
    sourceCandidatesThroughPrimaryTransitMechanism: 22,
    sourceCandidatesThroughBackgroundSignContextOnly: 2,
    backgroundSignContextOnlyIds: DAILY_BACKGROUND_ONLY_PRACTICE_IDS,
    tagFallbackPool: 24,
    fullLibraryFallbackPool: 24,
    allStructurallyReachableThroughBroaderPaths: true,
    dead: 0,
  },
  dailySelection: {
    tiers: ["sourceMatch", "tagMatch", "fullLibraryFallback"],
    sourceMatchOrigins: [
      "transitingPlanet",
      "natalTarget",
      "aspectDynamic",
      "transitingSunSignBackground",
      "transitingMoonSignBackground",
    ],
    headlineTransitMechanismOrigins: [
      "transitingPlanet",
      "natalTarget",
      "aspectDynamic",
    ],
    backgroundContextOrigins: [
      "transitingSunSignBackground",
      "transitingMoonSignBackground",
    ],
    renderedProvenanceDistinction: "none",
    fullLibraryOrdinarilyReachableWithValidCurrentRecords: false,
  },
  weeklySelection: {
    model: "weightedScore",
    sourceMatchWeight: 100,
    tagMatchWeight: 10,
    toneMatchWeight: 1,
  },
} as const;

export type FallbackState =
  | "supportedOrdinary"
  | "defensive"
  | "dormant"
  | "unsupported";

export type FallbackContractEntry = {
  id: string;
  surface: string;
  trigger: string;
  state: FallbackState;
  provenance: ContentProvenance | "runtimeFallback";
  presentationRisk: string;
};

export const FALLBACK_CONTRACT: readonly FallbackContractEntry[] = [
  {
    id: "planet-sign.missing",
    surface: "natal placement",
    trigger: "No keyed planet-sign interpretation resolves.",
    state: "defensive",
    provenance: "none",
    presentationRisk:
      "The missing block is omitted; a summary may use the other available component.",
  },
  {
    id: "planet-house.missing",
    surface: "natal life-area placement",
    trigger: "No keyed planet-house interpretation resolves.",
    state: "defensive",
    provenance: "none",
    presentationRisk:
      "The missing block is omitted; a summary may use the other available component.",
  },
  {
    id: "chart.no-houses",
    surface: "natal chart",
    trigger: "No house data is available.",
    state: "defensive",
    provenance: "none",
    presentationRisk:
      "House-specific interpretation is omitted without invented context.",
  },
  {
    id: "house-sign.missing",
    surface: "house style",
    trigger: "No keyed house-sign interpretation resolves.",
    state: "dormant",
    provenance: "runtimeFallback",
    presentationRisk:
      "All 144 canonical entries currently exist; if one is removed, generic composition can appear specific.",
  },
  {
    id: "house.generic-missing",
    surface: "generic house",
    trigger: "No generic house meaning resolves.",
    state: "defensive",
    provenance: "none",
    presentationRisk: "No interpretation is available.",
  },
  {
    id: "natal.no-aspects",
    surface: "natal aspects",
    trigger: "No supported natal aspects are present.",
    state: "supportedOrdinary",
    provenance: "none",
    presentationRisk: "An empty-state message is rendered.",
  },
  {
    id: "natal.generic-aspect-definition",
    surface: "natal aspects",
    trigger: "Any recognized reachable natal aspect is rendered.",
    state: "supportedOrdinary",
    provenance: "genericDefinition",
    presentationRisk:
      "Generic aspect prose appears under a specific planet-pair label.",
  },
  {
    id: "sky.unsupported-pair-or-type",
    surface: "Sky Now",
    trigger: "The pair, body, or aspect type is outside the Sky contract.",
    state: "unsupported",
    provenance: "none",
    presentationRisk: "No invented interpretation is returned.",
  },
  {
    id: "sky.calculation-failure",
    surface: "Sky Now",
    trigger: "Current-position or aspect calculation fails.",
    state: "defensive",
    provenance: "none",
    presentationRisk: "The surface renders its unavailable state.",
  },
  {
    id: "daily.no-primary-transit",
    surface: "Today",
    trigger: "No eligible tight transit is selected as primary.",
    state: "supportedOrdinary",
    provenance: "structuredComposition",
    presentationRisk:
      "Sun/Moon background guidance replaces a personal transit reading.",
  },
  {
    id: "daily.missing-house",
    surface: "Today",
    trigger: "A primary transit exists but house context is unavailable.",
    state: "defensive",
    provenance: "structuredComposition",
    presentationRisk: "The reading degrades without house specificity.",
  },
  {
    id: "daily.prompt-source",
    surface: "Today prompt/practice",
    trigger: "At least one library record references an active source ID.",
    state: "supportedOrdinary",
    provenance: "structuredComposition",
    presentationRisk: "Selection strength is not labeled in the UI.",
  },
  {
    id: "daily.prompt-tag",
    surface: "Today prompt/practice",
    trigger: "No source match exists but a guidance tag matches.",
    state: "supportedOrdinary",
    provenance: "structuredComposition",
    presentationRisk: "Selection strength is not labeled in the UI.",
  },
  {
    id: "daily.prompt-library",
    surface: "Today prompt/practice",
    trigger: "Neither source nor tag candidates exist.",
    state: "dormant",
    provenance: "structuredComposition",
    presentationRisk: "A full-library choice would render like a source match.",
  },
  {
    id: "weekly.no-highlight",
    surface: "Weekly Forecast",
    trigger: "No eligible highlight survives filtering and ranking.",
    state: "supportedOrdinary",
    provenance: "structuredComposition",
    presentationRisk: "A background-rhythm theme is rendered.",
  },
  {
    id: "weekly.theme-unavailable",
    surface: "Weekly Forecast",
    trigger: "A ranked highlight cannot resolve its required primitives.",
    state: "dormant",
    provenance: "none",
    presentationRisk: "Current canonical guards make this branch unreachable.",
  },
];

export const SAVED_CHART_BODY_CONTRACT = {
  supportedBodies: CANONICAL_ASTROLOGICAL_BODIES,
  permissiveLegacyHydrationExpandsContract: false,
  eventualRule:
    "Noncanonical identities must not receive Naksha interpretation content merely because their aspect type is recognized.",
  knownGap:
    "Persisted aspect data can contain noncanonical planet names and currently render generic aspect prose as if supported.",
  relatedDailyGap:
    "A highest-ranked transit with a noncanonical natal target can be dropped after selection, causing a false no-primary fallback instead of considering a later canonical contact.",
} as const;

export const KNOWN_CONFORMANCE_FOLLOW_UPS = [
  "weekly-orb-rounding",
  "daily-rounded-orb-ranking",
  "house-only-prompt-eligibility",
  "product-epoch-undecided",
  "future-birth-date-policy",
  "noncanonical-saved-identities",
  "daily-noncanonical-primary-selection",
  "rising-sign-doctrine-test-pattern-narrowing",
  "benchmark-meta-commentary-cleanup",
  "dignity-language-cleanup",
  "outer-planet-calibration",
] as const;

export type EditorialAcceptanceEvidence = {
  cellId: string;
  reviewReference: string;
};

/** A cell may be marked accepted only when its deliberate review is recorded here. */
export const EDITORIAL_ACCEPTANCE_EVIDENCE: readonly EditorialAcceptanceEvidence[] =
  [];

export function summarizeCoverage(
  cells: readonly (SameMomentCoverageCell | DirectionalCoverageCell)[],
) {
  const count = <K extends keyof CoverageDimensions>(
    key: K,
    value: CoverageDimensions[K],
  ) => cells.filter((cell) => cell[key] === value).length;

  return {
    theoretical: cells.length,
    reachable: count("physicalReachability", "reachable"),
    impossible: count("physicalReachability", "impossible"),
    supported: count("surfaceSupport", "supported"),
    productExcluded: count("surfaceSupport", "productExcluded"),
    bespoke: count("contentProvenance", "bespoke"),
    partialBespoke: count("contentProvenance", "partialBespoke"),
    structuredComposition: count("contentProvenance", "structuredComposition"),
    genericDefinition: count("contentProvenance", "genericDefinition"),
    none: count("contentProvenance", "none"),
    presentedAsSpecific: count("presentation", "presentedAsSpecific"),
    labeledAsGeneric: count("presentation", "labeledAsGeneric"),
    notRendered: count("presentation", "notRendered"),
    presentationNotApplicable: count("presentation", "notApplicable"),
    accepted: count("editorialAcceptance", "accepted"),
    belowStandard: count("editorialAcceptance", "belowStandard"),
    notReviewed: count("editorialAcceptance", "notReviewed"),
    editorialNotApplicable: count("editorialAcceptance", "notApplicable"),
  };
}

export const INTERPRETATION_COVERAGE_MANIFEST = {
  schemaVersion: 1,
  canonicalBodies: CANONICAL_ASTROLOGICAL_BODIES,
  canonicalAspects: CANONICAL_ASPECT_TYPES,
  productEpoch: PRODUCT_EPOCH_POLICY,
  orbPolicy: ASPECT_ORB_POLICY,
  reachabilityGuardBounds: SAME_MOMENT_REACHABILITY_GUARD_BOUNDS,
  sameMomentImpossibleCells: IMPOSSIBLE_SAME_MOMENT_CELLS,
  surfaces: {
    natal: NATAL_ASPECT_CELLS,
    skyNow: SKY_NOW_ASPECT_CELLS,
    daily: DAILY_TRANSIT_CELLS,
    weeklyDailyRhythm: DAILY_TRANSIT_CELLS,
    weeklyHighlights: WEEKLY_HIGHLIGHT_CELLS,
  },
  transitingBodySupport: TRANSITING_BODY_SUPPORT,
  selectionPolicies: SURFACE_SELECTION_POLICIES,
  promptPractice: PROMPT_PRACTICE_REACHABILITY,
  fallbacks: FALLBACK_CONTRACT,
  savedChartBodies: SAVED_CHART_BODY_CONTRACT,
  editorialAcceptanceEvidence: EDITORIAL_ACCEPTANCE_EVIDENCE,
  knownFollowUps: KNOWN_CONFORMANCE_FOLLOW_UPS,
} as const;
