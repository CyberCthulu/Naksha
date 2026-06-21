import type { PlanetKey } from '../types'
import type { NatalTargetGuidance } from './types'

export const NATAL_TARGET_GUIDANCE: Record<PlanetKey, NatalTargetGuidance> = {
  Sun: {
    id: 'guidance.target.sun',
    category: 'natal-target',
    planet: 'Sun',
    tone: 'integrative',
    intensity: 'high',
    tags: ['identity', 'confidence', 'focus', 'creativity'],
    activation: 'identity, confidence, visibility, and sense of direction',
    constructive:
      'Act from a clear sense of purpose without requiring immediate recognition.',
    watchFor:
      'A need to prove yourself may make the moment feel more personal than necessary.',
  },
  Moon: {
    id: 'guidance.target.moon',
    category: 'natal-target',
    planet: 'Moon',
    tone: 'integrative',
    intensity: 'high',
    tags: ['emotions', 'security', 'home', 'rest', 'awareness'],
    activation: 'feelings, security, habits, belonging, and familiar responses',
    constructive:
      'Name the underlying need and choose a response that supports emotional steadiness.',
    watchFor:
      'Old habits may feel safer than a response that better fits the present.',
  },
  Mercury: {
    id: 'guidance.target.mercury',
    category: 'natal-target',
    planet: 'Mercury',
    tone: 'integrative',
    intensity: 'medium',
    tags: ['communication', 'decisions', 'learning', 'focus'],
    activation: 'thoughts, communication style, decisions, and interpretation',
    constructive:
      'Separate what you know from what you assume before communicating or deciding.',
    watchFor:
      'Overthinking or reacting to incomplete information may obscure the useful point.',
  },
  Venus: {
    id: 'guidance.target.venus',
    category: 'natal-target',
    planet: 'Venus',
    tone: 'integrative',
    intensity: 'medium',
    tags: ['relationships', 'values', 'resources', 'self-worth', 'gratitude'],
    activation: 'relationships, values, pleasure, self-worth, and resources',
    constructive:
      'Choose what reflects mutual respect and the values you want to live by.',
    watchFor:
      'Approval, comfort, or comparison may temporarily blur what matters to you.',
  },
  Mars: {
    id: 'guidance.target.mars',
    category: 'natal-target',
    planet: 'Mars',
    tone: 'intensifying',
    intensity: 'high',
    tags: ['action', 'boundaries', 'confidence', 'power', 'focus'],
    activation: 'drive, courage, anger, desire, and personal boundaries',
    constructive:
      'Use direct energy for a clear action rather than letting it scatter into conflict.',
    watchFor:
      'Defensiveness or urgency may make cooperation feel harder than it is.',
  },
  Jupiter: {
    id: 'guidance.target.jupiter',
    category: 'natal-target',
    planet: 'Jupiter',
    tone: 'supportive',
    intensity: 'medium',
    tags: ['growth', 'beliefs', 'learning', 'perspective'],
    activation: 'growth, belief, opportunity, meaning, and confidence',
    constructive:
      'Let curiosity widen your options while keeping promises proportionate.',
    watchFor:
      'Optimism may skip over useful limits, details, or another point of view.',
  },
  Saturn: {
    id: 'guidance.target.saturn',
    category: 'natal-target',
    planet: 'Saturn',
    tone: 'challenging',
    intensity: 'high',
    tags: ['responsibility', 'structure', 'boundaries', 'work'],
    activation: 'responsibility, limits, discipline, patience, and mastery',
    constructive:
      'Turn pressure into a realistic structure with one clear next step.',
    watchFor:
      'Fear of falling short may become avoidance, rigidity, or excessive self-judgment.',
  },
  Uranus: {
    id: 'guidance.target.uranus',
    category: 'natal-target',
    planet: 'Uranus',
    tone: 'intensifying',
    intensity: 'high',
    tags: ['change', 'awareness', 'freedom', 'perspective'],
    activation: 'freedom, disruption, originality, and readiness for change',
    constructive:
      'Experiment with one flexible change instead of overturning everything at once.',
    watchFor:
      'Restlessness may treat every limit as a problem rather than useful information.',
  },
  Neptune: {
    id: 'guidance.target.neptune',
    category: 'natal-target',
    planet: 'Neptune',
    tone: 'integrative',
    intensity: 'medium',
    tags: ['imagination', 'compassion', 'creativity', 'grounding'],
    activation: 'imagination, compassion, ideals, sensitivity, and ambiguity',
    constructive:
      'Give inspiration a simple form and verify assumptions before acting on them.',
    watchFor:
      'Hope, projection, or porous boundaries may make the situation harder to read.',
  },
  Pluto: {
    id: 'guidance.target.pluto',
    category: 'natal-target',
    planet: 'Pluto',
    tone: 'intensifying',
    intensity: 'high',
    tags: ['power', 'transformation', 'boundaries', 'awareness'],
    activation: 'power, control, depth, release, and transformation',
    constructive:
      'Focus on the choice you can make now instead of forcing complete control.',
    watchFor:
      'Intensity may encourage all-or-nothing thinking or a struggle over control.',
  },
}

export function getNatalTargetGuidance(
  planet: PlanetKey
): NatalTargetGuidance {
  return NATAL_TARGET_GUIDANCE[planet]
}
