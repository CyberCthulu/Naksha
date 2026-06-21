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
    focus: 'emotional weather, instinctive responses, and immediate needs',
    constructive:
      'Notice what your feelings are asking for before deciding how to respond.',
    watchFor:
      'A passing mood may feel more permanent or urgent than it really is.',
  },
  Sun: {
    id: 'guidance.transit.sun',
    category: 'transit-planet',
    planet: 'Sun',
    tone: 'supportive',
    intensity: 'medium',
    tags: ['identity', 'confidence', 'focus', 'creativity', 'awareness'],
    focus: 'attention, vitality, visibility, and conscious direction',
    constructive:
      'Choose one meaningful priority and give it clear, steady attention.',
    watchFor:
      'The desire to be certain or recognized may crowd out useful feedback.',
  },
  Mercury: {
    id: 'guidance.transit.mercury',
    category: 'transit-planet',
    planet: 'Mercury',
    tone: 'integrative',
    intensity: 'medium',
    tags: ['communication', 'decisions', 'learning', 'focus', 'awareness'],
    focus: 'thinking, communication, choices, and information exchange',
    constructive:
      'Clarify the question, check the details, and say what you mean simply.',
    watchFor:
      'Fast conclusions or scattered attention may make a simple issue feel noisy.',
  },
  Venus: {
    id: 'guidance.transit.venus',
    category: 'transit-planet',
    planet: 'Venus',
    tone: 'supportive',
    intensity: 'medium',
    tags: ['relationships', 'values', 'resources', 'gratitude', 'creativity'],
    focus: 'relationships, values, pleasure, receptivity, and shared ease',
    constructive:
      'Make room for what feels reciprocal, nourishing, and aligned with your values.',
    watchFor:
      'Keeping the peace or seeking comfort may delay an honest choice.',
  },
  Mars: {
    id: 'guidance.transit.mars',
    category: 'transit-planet',
    planet: 'Mars',
    tone: 'intensifying',
    intensity: 'high',
    tags: ['action', 'boundaries', 'confidence', 'focus', 'power'],
    focus: 'drive, assertion, courage, boundaries, and direct action',
    constructive:
      'Channel urgency into one deliberate action that respects your limits and others.',
    watchFor:
      'Impatience may turn a useful boundary or disagreement into unnecessary friction.',
  },
  Jupiter: {
    id: 'guidance.transit.jupiter',
    category: 'transit-planet',
    planet: 'Jupiter',
    tone: 'supportive',
    intensity: 'medium',
    tags: ['growth', 'learning', 'perspective', 'confidence', 'values'],
    focus: 'growth, belief, opportunity, perspective, and meaningful expansion',
    constructive:
      'Explore the larger possibility while staying honest about time and resources.',
    watchFor:
      'Enthusiasm may become overcommitment when practical limits are ignored.',
  },
  Saturn: {
    id: 'guidance.transit.saturn',
    category: 'transit-planet',
    planet: 'Saturn',
    tone: 'challenging',
    intensity: 'high',
    tags: ['responsibility', 'structure', 'boundaries', 'work', 'integration'],
    focus: 'responsibility, limits, structure, patience, and durable progress',
    constructive:
      'Choose the next sustainable step and let consistency carry more weight than speed.',
    watchFor:
      'Pressure may become self-criticism or rigidity instead of useful structure.',
  },
}

export function getTransitPlanetGuidance(
  planet: GuidanceTransitPlanet
): TransitPlanetGuidance {
  return TRANSIT_PLANET_GUIDANCE[planet]
}
