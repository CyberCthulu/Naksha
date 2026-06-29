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

export type BuildWeeklyForecastInput = {
  natalPlanets: PlanetPos[]
  evaluatedAt: Date
  timeZone: string
  orbMode?: AspectOrbMode
}

export type WeeklyDayTheme = {
  date: string
  evaluatedAt: string
  tone: GuidanceTone
  title: string
  summary: string
  primaryTransit: DailyGuidanceTransit | null
  reflectionPrompt: ReflectionPrompt
  suggestedPractice: SuggestedPractice
  sourceIds: string[]
}

export type WeeklyTransitHighlight = DailyGuidanceTransit & {
  date: string
}

export type WeeklyTheme = DailyGuidanceSection & {
  tone: GuidanceTone
}

export type WeeklyForecast = {
  schemaVersion: 1
  source: 'deterministic'
  startDate: string
  endDate: string
  timeZone: string
  evaluatedAt: string
  dailyThemes: WeeklyDayTheme[]
  strongestTransits: WeeklyTransitHighlight[]
  weeklyThemes: WeeklyTheme[]
  suggestions: SuggestedPractice[]
  journalPrompts: ReflectionPrompt[]
  sourceIds: string[]
}
