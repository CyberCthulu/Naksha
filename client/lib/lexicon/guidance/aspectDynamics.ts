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
    summary: 'Two functions converge, increasing concentration without deciding how that concentration will be used.',
    warningModifier:
      'Watch for overidentifying with the combined theme or letting it crowd out the wider context.',
    opportunityModifier:
      'Coordinate the two functions deliberately and give the added concentration a specific purpose.',
  },
  opp: {
    id: 'guidance.aspect.opp',
    category: 'aspect-dynamic',
    aspect: 'opp',
    tone: 'integrative',
    intensity: 'high',
    tags: ['relationships', 'boundaries', 'perspective', 'integration'],
    actionMode: 'balance',
    summary: 'Contrast makes competing needs visible and asks for negotiation between them.',
    warningModifier:
      'Watch for assigning one side entirely to someone else or swinging between opposite positions.',
    opportunityModifier:
      'Let the contrast show what boundary, perspective, or workable balance the situation calls for.',
  },
  trine: {
    id: 'guidance.aspect.trine',
    category: 'aspect-dynamic',
    aspect: 'trine',
    tone: 'supportive',
    intensity: 'medium',
    tags: ['growth', 'confidence', 'creativity', 'integration'],
    actionMode: 'flow',
    summary: 'Low resistance lets two functions cooperate, making an existing capacity easier to use.',
    warningModifier:
      'Watch for relying on familiarity or talent without directing it toward a meaningful result.',
    opportunityModifier:
      'Apply the available ease to reinforce a skill, relationship, or useful piece of work.',
  },
  square: {
    id: 'guidance.aspect.square',
    category: 'aspect-dynamic',
    aspect: 'square',
    tone: 'challenging',
    intensity: 'high',
    tags: ['action', 'change', 'boundaries', 'growth'],
    actionMode: 'adjust',
    summary: 'Two demands interfere with each other, creating pressure for an adjustment or new skill.',
    warningModifier:
      'Watch for repeating the same forceful response when the underlying conflict requires a different method.',
    opportunityModifier:
      'Let the friction reveal the blocked function, then make one practical change in approach.',
  },
  sextile: {
    id: 'guidance.aspect.sextile',
    category: 'aspect-dynamic',
    aspect: 'sextile',
    tone: 'supportive',
    intensity: 'low',
    tags: ['growth', 'learning', 'communication', 'awareness'],
    actionMode: 'engage',
    summary: 'Two functions can assist each other, but the opening becomes useful through participation.',
    warningModifier:
      'Watch for overlooking the option because it arrives as an invitation rather than pressure.',
    opportunityModifier:
      'Make a modest, timely move that connects the available resources and tests the possibility.',
  },
}

export function getAspectDynamicGuidance(
  aspect: AspectType
): AspectDynamicGuidance {
  return ASPECT_DYNAMIC_GUIDANCE[aspect]
}
