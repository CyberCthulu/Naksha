import type {
  GuidanceTransitPlanet,
  TransitPlanetGuidance,
} from './types'

export const TRANSIT_PLANET_GUIDANCE: Record<
  GuidanceTransitPlanet,
  TransitPlanetGuidance
> = {
  Moon: {
    id: 'guidance.transit.moon',
    category: 'transit-planet',
    planet: 'Moon',
    tone: 'intensifying',
    intensity: 'medium',
    tags: ['emotions', 'awareness', 'security', 'rest', 'grounding'],
    focus: 'immediate feelings, instinctive reactions, comfort, and belonging',
    constructive:
      'Identify the immediate need, then choose a response you can still support after the mood shifts.',
    watchFor:
      'A temporary feeling may make habitual defenses seem more necessary than they are.',
  },
  Sun: {
    id: 'guidance.transit.sun',
    category: 'transit-planet',
    planet: 'Sun',
    tone: 'supportive',
    intensity: 'medium',
    tags: ['identity', 'confidence', 'focus', 'creativity', 'awareness'],
    focus: 'purpose, vitality, visibility, and conscious priorities',
    constructive:
      'Put steady attention behind the priority that best expresses your intended direction.',
    watchFor:
      'Visibility may turn into performance or defensiveness when recognition becomes the measure.',
  },
  Mercury: {
    id: 'guidance.transit.mercury',
    category: 'transit-planet',
    planet: 'Mercury',
    tone: 'integrative',
    intensity: 'medium',
    tags: ['communication', 'decisions', 'learning', 'focus', 'awareness'],
    focus: 'interpretation, language, decisions, and information exchange',
    constructive:
      'Separate facts from assumptions, clarify the question, and say the essential point simply.',
    watchFor:
      'Speed, repetition, or too many inputs may create certainty without enough understanding.',
  },
  Venus: {
    id: 'guidance.transit.venus',
    category: 'transit-planet',
    planet: 'Venus',
    tone: 'supportive',
    intensity: 'medium',
    tags: ['relationships', 'values', 'resources', 'gratitude', 'creativity'],
    focus: 'values, attraction, reciprocity, enjoyment, and receptivity',
    constructive:
      'Notice what feels mutual and worthwhile, then let preference become an honest choice.',
    watchFor:
      'Politeness, approval, or immediate comfort may replace a needed preference or limit.',
  },
  Mars: {
    id: 'guidance.transit.mars',
    category: 'transit-planet',
    planet: 'Mars',
    tone: 'intensifying',
    intensity: 'high',
    tags: ['action', 'boundaries', 'confidence', 'focus', 'power'],
    focus: 'initiative, effort, assertion, desire, and conflict',
    constructive:
      'Direct available effort toward one proportionate move that respects real limits.',
    watchFor:
      'Urgency may narrow the options until force looks simpler than timing or cooperation.',
  },
  Jupiter: {
    id: 'guidance.transit.jupiter',
    category: 'transit-planet',
    planet: 'Jupiter',
    tone: 'supportive',
    intensity: 'medium',
    tags: ['growth', 'learning', 'perspective', 'confidence', 'values'],
    focus: 'perspective, confidence, opportunity, appetite, and wider possibilities',
    constructive:
      'Test the larger possibility against your capacity, evidence, and actual priorities.',
    watchFor:
      'Confidence or appetite may outrun the details that make an opportunity sustainable.',
  },
  Saturn: {
    id: 'guidance.transit.saturn',
    category: 'transit-planet',
    planet: 'Saturn',
    tone: 'challenging',
    intensity: 'high',
    tags: ['responsibility', 'structure', 'boundaries', 'work', 'integration'],
    focus: 'limits, responsibility, standards, time, and durability',
    constructive:
      'Define the responsibility, the boundary, and the repeatable step that can hold over time.',
    watchFor:
      'Constraint may be treated as a verdict, leading to rigidity, delay, or carrying too much alone.',
  },
}

export function getTransitPlanetGuidance(
  planet: GuidanceTransitPlanet
): TransitPlanetGuidance {
  return TRANSIT_PLANET_GUIDANCE[planet]
}
