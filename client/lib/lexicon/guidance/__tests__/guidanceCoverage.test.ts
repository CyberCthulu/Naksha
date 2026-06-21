import type { AspectType, HouseNumber, PlanetKey } from '../../types'
import { ZODIAC_FULL } from '../../types'
import {
  ASPECT_DYNAMIC_GUIDANCE,
  findReflectionPromptsByTags,
  findSuggestedPracticesByTags,
  getAspectDynamicGuidance,
  getHouseGuidance,
  getNatalTargetGuidance,
  getReflectionPrompt,
  getSignGuidance,
  getSuggestedPractice,
  getTransitPlanetGuidance,
  GUIDANCE_INTENSITIES,
  GUIDANCE_TAGS,
  GUIDANCE_TONES,
  GUIDANCE_TRANSIT_PLANETS,
  hasAnyGuidanceTag,
  HOUSE_GUIDANCE,
  NATAL_TARGET_GUIDANCE,
  PRACTICE_CATEGORIES,
  REFLECTION_PROMPT_CATEGORIES,
  REFLECTION_PROMPTS,
  SIGN_GUIDANCE,
  SUGGESTED_PRACTICES,
  TRANSIT_PLANET_GUIDANCE,
  type GuidanceContentRecord,
  type GuidancePrimitive,
} from '../index'

const REQUIRED_NATAL_PLANETS: PlanetKey[] = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
]

const REQUIRED_ASPECTS: AspectType[] = [
  'conj',
  'opp',
  'trine',
  'square',
  'sextile',
]

const REQUIRED_HOUSES: HouseNumber[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
]

const primitives: GuidancePrimitive[] = [
  ...Object.values(TRANSIT_PLANET_GUIDANCE),
  ...Object.values(NATAL_TARGET_GUIDANCE),
  ...Object.values(ASPECT_DYNAMIC_GUIDANCE),
  ...Object.values(SIGN_GUIDANCE),
  ...Object.values(HOUSE_GUIDANCE),
]

const allRecords: GuidanceContentRecord[] = [
  ...primitives,
  ...REFLECTION_PROMPTS,
  ...SUGGESTED_PRACTICES,
]

const expectNonEmpty = (value: string) => {
  expect(value.trim()).not.toBe('')
}

describe('guidance primitive coverage', () => {
  it('covers all required planets, aspects, signs, and houses', () => {
    expect(Object.keys(TRANSIT_PLANET_GUIDANCE)).toEqual(
      expect.arrayContaining([...GUIDANCE_TRANSIT_PLANETS])
    )
    expect(Object.keys(TRANSIT_PLANET_GUIDANCE)).toHaveLength(
      GUIDANCE_TRANSIT_PLANETS.length
    )

    expect(Object.keys(NATAL_TARGET_GUIDANCE)).toEqual(
      expect.arrayContaining(REQUIRED_NATAL_PLANETS)
    )
    expect(Object.keys(NATAL_TARGET_GUIDANCE)).toHaveLength(
      REQUIRED_NATAL_PLANETS.length
    )

    expect(Object.keys(ASPECT_DYNAMIC_GUIDANCE)).toEqual(
      expect.arrayContaining(REQUIRED_ASPECTS)
    )
    expect(Object.keys(ASPECT_DYNAMIC_GUIDANCE)).toHaveLength(
      REQUIRED_ASPECTS.length
    )

    expect(Object.keys(SIGN_GUIDANCE)).toEqual(
      expect.arrayContaining([...ZODIAC_FULL])
    )
    expect(Object.keys(SIGN_GUIDANCE)).toHaveLength(ZODIAC_FULL.length)

    expect(Object.keys(HOUSE_GUIDANCE).map(Number)).toEqual(
      expect.arrayContaining(REQUIRED_HOUSES)
    )
    expect(Object.keys(HOUSE_GUIDANCE)).toHaveLength(REQUIRED_HOUSES.length)
  })

  it('uses unique, non-empty stable IDs across the library', () => {
    const ids = allRecords.map((record) => record.id)

    ids.forEach(expectNonEmpty)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps required prose fields non-empty', () => {
    Object.values(TRANSIT_PLANET_GUIDANCE).forEach((record) => {
      expectNonEmpty(record.focus)
      expectNonEmpty(record.constructive)
      expectNonEmpty(record.watchFor)
    })

    Object.values(NATAL_TARGET_GUIDANCE).forEach((record) => {
      expectNonEmpty(record.activation)
      expectNonEmpty(record.constructive)
      expectNonEmpty(record.watchFor)
    })

    Object.values(ASPECT_DYNAMIC_GUIDANCE).forEach((record) => {
      expectNonEmpty(record.summary)
      expectNonEmpty(record.warningModifier)
      expectNonEmpty(record.opportunityModifier)
    })

    Object.values(SIGN_GUIDANCE).forEach((record) => {
      expectNonEmpty(record.atmosphere)
      expectNonEmpty(record.constructive)
      expectNonEmpty(record.watchFor)
      expectNonEmpty(record.opportunity)
    })

    Object.values(HOUSE_GUIDANCE).forEach((record) => {
      expectNonEmpty(record.focus)
      expectNonEmpty(record.constructive)
      expectNonEmpty(record.watchFor)
      expectNonEmpty(record.inquiry)
    })

    REFLECTION_PROMPTS.forEach((prompt) => {
      expectNonEmpty(prompt.title)
      expectNonEmpty(prompt.prompt)
      if ('followUp' in prompt) expectNonEmpty(prompt.followUp)
    })

    SUGGESTED_PRACTICES.forEach((practice) => {
      expectNonEmpty(practice.title)
      expectNonEmpty(practice.summary)
      expect(practice.steps.length).toBeGreaterThan(0)
      practice.steps.forEach(expectNonEmpty)
      if (practice.durationMinutes != null) {
        expect(practice.durationMinutes).toBeGreaterThan(0)
      }
    })
  })

  it('uses only declared tags, tones, intensities, and content categories', () => {
    const validTags = new Set<string>(GUIDANCE_TAGS)
    const validTones = new Set<string>(GUIDANCE_TONES)
    const validIntensities = new Set<string>(GUIDANCE_INTENSITIES)
    const validPromptCategories = new Set<string>(
      REFLECTION_PROMPT_CATEGORIES
    )
    const validPracticeCategories = new Set<string>(PRACTICE_CATEGORIES)

    allRecords.forEach((record) => {
      expect(record.tags.length).toBeGreaterThan(0)
      record.tags.forEach((tag) => expect(validTags.has(tag)).toBe(true))
      expect(validTones.has(record.tone)).toBe(true)
      expect(validIntensities.has(record.intensity)).toBe(true)
    })

    REFLECTION_PROMPTS.forEach((prompt) => {
      expect(validPromptCategories.has(prompt.promptCategory)).toBe(true)
    })
    SUGGESTED_PRACTICES.forEach((practice) => {
      expect(validPracticeCategories.has(practice.practiceCategory)).toBe(true)
    })
  })

  it('keeps prompt and practice source references resolvable', () => {
    const primitiveIds = new Set(primitives.map((record) => record.id))

    ;[...REFLECTION_PROMPTS, ...SUGGESTED_PRACTICES].forEach((record) => {
      expect(record.sourceIds.length).toBeGreaterThan(0)
      record.sourceIds.forEach((sourceId) => {
        expect(primitiveIds.has(sourceId)).toBe(true)
      })
    })
  })

  it('exports accessors and deterministic tag filters from the barrel', () => {
    expect(getTransitPlanetGuidance('Moon')).toBe(
      TRANSIT_PLANET_GUIDANCE.Moon
    )
    expect(getNatalTargetGuidance('Pluto')).toBe(
      NATAL_TARGET_GUIDANCE.Pluto
    )
    expect(getAspectDynamicGuidance('square')).toBe(
      ASPECT_DYNAMIC_GUIDANCE.square
    )
    expect(getSignGuidance('Pisces')).toBe(SIGN_GUIDANCE.Pisces)
    expect(getHouseGuidance(12)).toBe(HOUSE_GUIDANCE[12])
    expect(getReflectionPrompt('guidance.prompt.emotional-need')).toBe(
      REFLECTION_PROMPTS[0]
    )
    expect(getSuggestedPractice('guidance.practice.sensory-grounding')).toBe(
      SUGGESTED_PRACTICES[0]
    )
    expect(getReflectionPrompt('missing')).toBeNull()
    expect(getSuggestedPractice('missing')).toBeNull()

    const prompts = findReflectionPromptsByTags(['boundaries'])
    const practices = findSuggestedPracticesByTags(['grounding'])
    expect(prompts.length).toBeGreaterThan(0)
    expect(practices.length).toBeGreaterThan(0)
    expect(prompts.every((prompt) => prompt.tags.includes('boundaries'))).toBe(
      true
    )
    expect(
      practices.every((practice) => practice.tags.includes('grounding'))
    ).toBe(true)
    expect(hasAnyGuidanceTag(['focus'], ['focus', 'rest'])).toBe(true)
    expect(hasAnyGuidanceTag(['focus'], ['rest'])).toBe(false)
  })
})
