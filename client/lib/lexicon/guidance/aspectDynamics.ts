import type { AspectType } from '../types'
import type { AspectDynamicGuidance } from './types'

export const ASPECT_DYNAMIC_GUIDANCE: Record<
  AspectType,
  AspectDynamicGuidance
> = {
  conj: {
    id: 'guidance.aspect.conj',
    category: 'aspect-dynamic',
    aspect: 'conj',
    tone: 'intensifying',
    intensity: 'high',
    tags: ['focus', 'integration', 'awareness'],
    actionMode: 'blend',
    summary: 'Two themes are amplified and ask to be handled together.',
    warningModifier:
      'Watch for one theme crowding out the other or becoming more urgent than needed.',
    opportunityModifier:
      'Use the added concentration to make one aligned choice with clear intention.',
  },
  opp: {
    id: 'guidance.aspect.opp',
    category: 'aspect-dynamic',
    aspect: 'opp',
    tone: 'integrative',
    intensity: 'high',
    tags: ['relationships', 'boundaries', 'perspective', 'integration'],
    actionMode: 'balance',
    summary: 'A polarity is visible and benefits from balance rather than either extreme.',
    warningModifier:
      'Watch for projecting one side of the tension onto another person or situation.',
    opportunityModifier:
      'Hold both needs in view and look for a response that respects the full picture.',
  },
  trine: {
    id: 'guidance.aspect.trine',
    category: 'aspect-dynamic',
    aspect: 'trine',
    tone: 'supportive',
    intensity: 'medium',
    tags: ['growth', 'confidence', 'creativity', 'integration'],
    actionMode: 'flow',
    summary: 'Energy moves with relative ease and can support natural strengths.',
    warningModifier:
      'Watch for assuming ease will create progress without your participation.',
    opportunityModifier:
      'Use what is already flowing to take a constructive step or reinforce a skill.',
  },
  square: {
    id: 'guidance.aspect.square',
    category: 'aspect-dynamic',
    aspect: 'square',
    tone: 'challenging',
    intensity: 'high',
    tags: ['action', 'change', 'boundaries', 'growth'],
    actionMode: 'adjust',
    summary: 'Friction highlights where an adjustment or new skill may be useful.',
    warningModifier:
      'Watch for forcing movement before the real source of tension is understood.',
    opportunityModifier:
      'Turn discomfort into one practical adjustment rather than treating it as failure.',
  },
  sextile: {
    id: 'guidance.aspect.sextile',
    category: 'aspect-dynamic',
    aspect: 'sextile',
    tone: 'supportive',
    intensity: 'low',
    tags: ['growth', 'learning', 'communication', 'awareness'],
    actionMode: 'engage',
    summary: 'A useful opening is available and responds to modest effort.',
    warningModifier:
      'Watch for overlooking a quiet option because it does not demand attention.',
    opportunityModifier:
      'Engage the opening with a small, timely action and let momentum build.',
  },
}

export function getAspectDynamicGuidance(
  aspect: AspectType
): AspectDynamicGuidance {
  return ASPECT_DYNAMIC_GUIDANCE[aspect]
}
