import type { AspectOrbMode, PlanetPos } from '../astro'
import type { DailyTransitPlanetName } from '../dailyTransits'
import type { AspectType, PlanetKey, ZodiacName } from '../lexicon'
import type {
  GuidanceIntensity,
  GuidanceTone,
  ReflectionPrompt,
  SuggestedPractice,
} from '../lexicon/guidance'

export type BuildDailyGuidanceInput = {
  natalPlanets: PlanetPos[]
  evaluatedAt: Date
  orbMode?: AspectOrbMode
}

export type DailyGuidanceSection = {
  title: string
  body: string
  sourceIds: string[]
}

export type DailyGuidanceTransit = {
  transitPlanet: DailyTransitPlanetName
  natalPlanet: PlanetKey
  aspect: AspectType
  orb: number
  tone: GuidanceTone
  intensity: GuidanceIntensity
  sourceIds: string[]
}

export type DailyGuidance = {
  schemaVersion: 1
  source: 'deterministic'
  date: string
  evaluatedAt: string
  transitSunSign: ZodiacName | null
  transitMoonSign: ZodiacName | null
  primaryTransit: DailyGuidanceTransit | null
  tone: GuidanceTone
  mood: DailyGuidanceSection
  warning: DailyGuidanceSection
  opportunity: DailyGuidanceSection
  transitSummary: DailyGuidanceSection
  reflectionPrompt: ReflectionPrompt
  suggestedPractice: SuggestedPractice
  sourceIds: string[]
}
