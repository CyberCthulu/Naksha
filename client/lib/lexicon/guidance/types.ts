import type {
  AspectType,
  HouseNumber,
  PlanetKey,
  ZodiacName,
} from '../types'

export const GUIDANCE_TRANSIT_PLANETS = [
  'Moon',
  'Sun',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
] as const

export type GuidanceTransitPlanet =
  (typeof GUIDANCE_TRANSIT_PLANETS)[number]

export const GUIDANCE_TONES = [
  'supportive',
  'challenging',
  'intensifying',
  'integrative',
] as const

export type GuidanceTone = (typeof GUIDANCE_TONES)[number]

export const GUIDANCE_INTENSITIES = ['low', 'medium', 'high'] as const

export type GuidanceIntensity = (typeof GUIDANCE_INTENSITIES)[number]

export const GUIDANCE_TAGS = [
  'action',
  'awareness',
  'beliefs',
  'boundaries',
  'change',
  'communication',
  'community',
  'compassion',
  'confidence',
  'creativity',
  'decisions',
  'emotions',
  'focus',
  'freedom',
  'gratitude',
  'grounding',
  'growth',
  'home',
  'identity',
  'imagination',
  'integration',
  'learning',
  'perspective',
  'power',
  'relationships',
  'resources',
  'responsibility',
  'rest',
  'routines',
  'security',
  'self-worth',
  'structure',
  'transformation',
  'values',
  'work',
] as const

export type GuidanceTag = (typeof GUIDANCE_TAGS)[number]

export type GuidanceContentCategory =
  | 'transit-planet'
  | 'natal-target'
  | 'aspect-dynamic'
  | 'sign'
  | 'house'
  | 'reflection-prompt'
  | 'practice'

export type GuidanceContentRecord = {
  id: string
  category: GuidanceContentCategory
  tone: GuidanceTone
  intensity: GuidanceIntensity
  tags: readonly GuidanceTag[]
}

export type TransitPlanetGuidance = GuidanceContentRecord & {
  category: 'transit-planet'
  planet: GuidanceTransitPlanet
  focus: string
  constructive: string
  watchFor: string
}

export type NatalTargetGuidance = GuidanceContentRecord & {
  category: 'natal-target'
  planet: PlanetKey
  activation: string
  constructive: string
  watchFor: string
}

export type AspectActionMode =
  | 'blend'
  | 'balance'
  | 'adjust'
  | 'flow'
  | 'engage'

export type AspectDynamicGuidance = GuidanceContentRecord & {
  category: 'aspect-dynamic'
  aspect: AspectType
  actionMode: AspectActionMode
  summary: string
  warningModifier: string
  opportunityModifier: string
}

export type SignGuidance = GuidanceContentRecord & {
  category: 'sign'
  sign: ZodiacName
  atmosphere: string
  constructive: string
  watchFor: string
  opportunity: string
}

export type HouseGuidance = GuidanceContentRecord & {
  category: 'house'
  house: HouseNumber
  focus: string
  constructive: string
  watchFor: string
  inquiry: string
}

export const REFLECTION_PROMPT_CATEGORIES = [
  'awareness',
  'integration',
  'boundaries',
  'action',
  'values',
] as const

export type ReflectionPromptCategory =
  (typeof REFLECTION_PROMPT_CATEGORIES)[number]

export type ReflectionPrompt = GuidanceContentRecord & {
  category: 'reflection-prompt'
  promptCategory: ReflectionPromptCategory
  title: string
  prompt: string
  followUp?: string
  sourceIds: readonly string[]
}

export const PRACTICE_CATEGORIES = [
  'grounding',
  'journaling',
  'movement',
  'focus',
  'relationships',
  'creativity',
  'gratitude',
] as const

export type PracticeCategory = (typeof PRACTICE_CATEGORIES)[number]

export type SuggestedPractice = GuidanceContentRecord & {
  category: 'practice'
  practiceCategory: PracticeCategory
  title: string
  summary: string
  steps: readonly string[]
  durationMinutes?: number
  sourceIds: readonly string[]
}

export type GuidancePrimitive =
  | TransitPlanetGuidance
  | NatalTargetGuidance
  | AspectDynamicGuidance
  | SignGuidance
  | HouseGuidance

export function hasAnyGuidanceTag(
  recordTags: readonly GuidanceTag[],
  requestedTags: readonly GuidanceTag[]
): boolean {
  return requestedTags.some((tag) => recordTags.includes(tag))
}
