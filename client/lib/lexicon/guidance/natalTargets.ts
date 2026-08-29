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
    activation: 'purpose, self-definition, visibility, and conscious direction',
    constructive:
      'Choose the direction because it fits who you intend to be, not because it guarantees recognition.',
    watchFor:
      'Feedback may feel like a judgment of the whole self instead of information about one choice.',
  },
  Moon: {
    id: 'guidance.target.moon',
    category: 'natal-target',
    planet: 'Moon',
    tone: 'integrative',
    intensity: 'high',
    tags: ['emotions', 'security', 'home', 'rest', 'awareness'],
    activation: 'emotional memory, belonging, regulation, and familiar responses',
    constructive:
      'Support the present need without assuming an old protective habit is still required.',
    watchFor:
      'Familiarity may be mistaken for safety even when the current situation asks for something different.',
  },
  Mercury: {
    id: 'guidance.target.mercury',
    category: 'natal-target',
    planet: 'Mercury',
    tone: 'integrative',
    intensity: 'medium',
    tags: ['communication', 'decisions', 'learning', 'focus'],
    activation: 'mental framing, language, learning, and decision-making',
    constructive:
      'Revise the interpretation when new information appears, then communicate the updated view clearly.',
    watchFor:
      'A clever explanation may become more persuasive than the evidence supporting it.',
  },
  Venus: {
    id: 'guidance.target.venus',
    category: 'natal-target',
    planet: 'Venus',
    tone: 'integrative',
    intensity: 'medium',
    tags: ['relationships', 'values', 'resources', 'self-worth', 'gratitude'],
    activation: 'standards of worth, attraction, reciprocity, receiving, and material preferences',
    constructive:
      'Let choices show what you value while leaving room for mutual preference and consent.',
    watchFor:
      'Comparison or fear of disappointing someone may distort what feels fair or worthwhile.',
  },
  Mars: {
    id: 'guidance.target.mars',
    category: 'natal-target',
    planet: 'Mars',
    tone: 'intensifying',
    intensity: 'high',
    tags: ['action', 'boundaries', 'confidence', 'power', 'focus'],
    activation: 'assertion, anger, desire, stamina, and defensive responses',
    constructive:
      'State the aim or limit directly, then spend effort on the part you can actually influence.',
    watchFor:
      'A challenge may be treated as a contest, even when coordination would serve the aim better.',
  },
  Jupiter: {
    id: 'guidance.target.jupiter',
    category: 'natal-target',
    planet: 'Jupiter',
    tone: 'supportive',
    intensity: 'medium',
    tags: ['growth', 'beliefs', 'learning', 'perspective'],
    activation: 'beliefs, judgment, trust, risk appetite, and the search for meaning',
    constructive:
      'Use a wider perspective to test what is possible without confusing possibility with certainty.',
    watchFor:
      'A strong belief may dismiss contrary evidence or make a promise larger than your capacity.',
  },
  Saturn: {
    id: 'guidance.target.saturn',
    category: 'natal-target',
    planet: 'Saturn',
    tone: 'challenging',
    intensity: 'high',
    tags: ['responsibility', 'structure', 'boundaries', 'work'],
    activation: 'duty, authority, time, standards, and earned competence',
    constructive:
      'Distinguish the real obligation from inherited pressure, then build a standard you can maintain.',
    watchFor:
      'Fear of falling short may turn preparation into delay or standards into punishment.',
  },
  Uranus: {
    id: 'guidance.target.uranus',
    category: 'natal-target',
    planet: 'Uranus',
    tone: 'intensifying',
    intensity: 'high',
    tags: ['change', 'awareness', 'freedom', 'perspective'],
    activation: 'autonomy, experimentation, disruption, and your relationship to change',
    constructive:
      'Test one unconventional option while preserving what still serves a useful purpose.',
    watchFor:
      'Restlessness may reject continuity simply because novelty feels more alive.',
  },
  Neptune: {
    id: 'guidance.target.neptune',
    category: 'natal-target',
    planet: 'Neptune',
    tone: 'integrative',
    intensity: 'medium',
    tags: ['imagination', 'compassion', 'creativity', 'grounding'],
    activation: 'imagination, empathy, ideals, ambiguity, and perceptual boundaries',
    constructive:
      'Give the impression or ideal a concrete form that can be observed, discussed, or revised.',
    watchFor:
      'Hope or projection may supply missing details and make a preference feel like a fact.',
  },
  Pluto: {
    id: 'guidance.target.pluto',
    category: 'natal-target',
    planet: 'Pluto',
    tone: 'intensifying',
    intensity: 'high',
    tags: ['power', 'transformation', 'boundaries', 'awareness'],
    activation: 'control, trust, compulsion, disclosure, and release',
    constructive:
      'Name what cannot be controlled, then use your influence deliberately and proportionately.',
    watchFor:
      'Pressure may turn privacy into secrecy or influence into a contest for total control.',
  },
}

export function getNatalTargetGuidance(
  planet: PlanetKey
): NatalTargetGuidance {
  return NATAL_TARGET_GUIDANCE[planet]
}
