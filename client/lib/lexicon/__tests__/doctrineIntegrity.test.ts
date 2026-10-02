import { HOUSE_MEANINGS } from '../houses/meanings'
import { getHouseSignMeaning } from '../houses'
import { HOUSE_SIGN_MEANINGS } from '../houses/signMeanings'
import { PLANET_HOUSE_MEANINGS } from '../planetHouses/meanings'
import type {
  HouseNumber,
  PlanetKey,
  ZodiacName,
} from '../types'

const ANGLE_EQUIVALENCE_CASES = [
  [1, '1st', 'Ascendant'],
  [4, '4th', 'IC'],
  [7, '7th', 'Descendant'],
  [10, '10th', 'MC'],
] as const

const PLANET_HOUSE_CASES: readonly [PlanetKey, HouseNumber][] = [
  ['Moon', 4],
  ['Mercury', 3],
  ['Venus', 7],
  ['Jupiter', 9],
  ['Saturn', 10],
  ['Uranus', 11],
  ['Neptune', 12],
  ['Pluto', 8],
]

const SIGN_HOUSE_CASES: readonly [ZodiacName, HouseNumber][] = [
  ['Cancer', 4],
  ['Leo', 5],
  ['Virgo', 6],
  ['Libra', 7],
  ['Scorpio', 8],
  ['Sagittarius', 9],
  ['Capricorn', 10],
  ['Aquarius', 11],
  ['Pisces', 12],
]

const PLANET_NAMES = [
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
] as const

const SIGN_NAMES = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
] as const

const NUMBERED_HOUSE = String.raw`(?:[1-9]|1[0-2])(?:st|nd|rd|th)\s+House`
const ANGLE_NAME = String.raw`(?:Ascendant|Descendant|MC|IC)`
const HOUSE_REFERENCE = String.raw`(?:this|the\s+(?:[1-9]|1[0-2])(?:st|nd|rd|th))\s+house`

const HOUSE_ANGLE_EQUIVALENCE_PATTERNS = [
  new RegExp(
    String.raw`\b${NUMBERED_HOUSE}\s*(?:\(\s*${ANGLE_NAME}\s*\)|(?:is|equals|is\s+identical\s+to|is\s+the\s+same\s+as|is\s+also\s+called|,?\s+or)\s+(?:the\s+)?${ANGLE_NAME}\b)`,
    'i'
  ),
  new RegExp(
    String.raw`\b${ANGLE_NAME}\s+(?:is|equals|is\s+identical\s+to|is\s+the\s+same\s+as|is\s+also\s+called|,?\s+or)\s+(?:the\s+)?${NUMBERED_HOUSE}\b`,
    'i'
  ),
  /\b1st\s+House\s*(?:\(\s*(?:the\s+)?rising\s+sign\s*\)|(?:is|equals|is\s+identical\s+to|is\s+the\s+same\s+as|is\s+also\s+called|,?\s+or)\s+(?:the\s+)?rising\s+sign\b)/i,
  /\b(?:the\s+)?rising\s+sign\s+(?:is|equals|is\s+identical\s+to|is\s+the\s+same\s+as|is\s+also\s+called|,?\s+or)\s+(?:the\s+)?1st\s+House\b/i,
]

function combinedText(meaning: { short: string; long: string }): string {
  return `${meaning.short} ${meaning.long}`
}

function expectNoHouseAngleEquivalence(text: string) {
  HOUSE_ANGLE_EQUIVALENCE_PATTERNS.forEach((pattern) => {
    expect(text).not.toMatch(pattern)
  })
}

function expectNoNaturalZodiacRulership(
  text: string,
  subjects: readonly string[]
) {
  const subjectName = subjects.join('|')
  const subjectRulesHouse = new RegExp(
    String.raw`\b(?:the\s+)?(?:${subjectName})\s+(?:naturally\s+)?(?:rules|is\s+(?:the\s+)?ruler\s+of)\s+${HOUSE_REFERENCE}\b`,
    'i'
  )
  const houseRuledBySubject = new RegExp(
    String.raw`\b${HOUSE_REFERENCE}\s+(?:is|was)\s+(?:naturally\s+)?ruled\s+by\s+(?:the\s+)?(?:${subjectName})\b`,
    'i'
  )

  expect(text).not.toMatch(/\b(?:this is |considered )?a natural placement\b/i)
  expect(text).not.toMatch(subjectRulesHouse)
  expect(text).not.toMatch(houseRuledBySubject)
}

function expectNoLiteralHouseRulership(
  text: string,
  subject: PlanetKey | ZodiacName,
  house: HouseNumber
) {
  const subjectRulesHouse = new RegExp(
    `\\b(?:the\\s+)?${subject}\\s+(?:naturally\\s+)?(?:rules|is\\s+(?:the\\s+)?ruler\\s+of)\\s+(?:this|the\\s+${house}(?:st|nd|rd|th))\\s+house\\b`,
    'i'
  )

  expect(text).not.toMatch(/\b(?:this is )?a natural placement\b/i)
  expect(text).not.toMatch(subjectRulesHouse)
}

describe('Whole Sign interpretation doctrine', () => {
  it('scans every generic house meaning for house-angle equivalence', () => {
    Object.values(HOUSE_MEANINGS).forEach((meaning) => {
      expectNoHouseAngleEquivalence(combinedText(meaning))
    })
  })

  it('scans every planet-house meaning for house-angle equivalence and natural-zodiac rulership', () => {
    Object.values(PLANET_HOUSE_MEANINGS).forEach((houseMeanings) => {
      Object.values(houseMeanings ?? {}).forEach((meaning) => {
        expectNoHouseAngleEquivalence(combinedText(meaning))
        expectNoNaturalZodiacRulership(
          combinedText(meaning),
          PLANET_NAMES
        )
      })
    })
  })

  it('scans every house-sign meaning for house-angle equivalence and natural-zodiac rulership', () => {
    Object.values(HOUSE_SIGN_MEANINGS).forEach((signMeanings) => {
      Object.values(signMeanings ?? {}).forEach((meaning) => {
        expectNoHouseAngleEquivalence(combinedText(meaning))
        expectNoNaturalZodiacRulership(combinedText(meaning), SIGN_NAMES)
      })
    })
  })

  it('uses Whole Sign wording in the dormant house-sign fallback', () => {
    const resolverSource = getHouseSignMeaning.toString()

    expect(resolverSource).not.toMatch(/\bon the cusp of this house\b/i)
    expect(resolverSource).toMatch(/\boccupying this Whole Sign house\b/i)
  })

  it.each(ANGLE_EQUIVALENCE_CASES)(
    'does not present House %i (%s) as the %s',
    (house, ordinal, angle) => {
      const meaning = HOUSE_MEANINGS[house]
      const houseAsAngle = new RegExp(
        `\\b${ordinal}\\s+House\\s*(?:\\(\\s*${angle}\\s*\\)|(?:is|equals|is\\s+identical\\s+to|is\\s+the\\s+same\\s+as|is\\s+also\\s+called|,?\\s+or)\\s+(?:the\\s+)?${angle}\\b)`,
        'i'
      )

      expect(meaning.long).not.toMatch(houseAsAngle)
    }
  )

  it.each(PLANET_HOUSE_CASES)(
    'does not treat %s as the literal ruler of Whole Sign House %i',
    (planet, house) => {
      const meaning = PLANET_HOUSE_MEANINGS[planet]?.[house]

      expect(meaning).toBeDefined()
      expectNoLiteralHouseRulership(meaning!.long, planet, house)
    }
  )

  it.each(SIGN_HOUSE_CASES)(
    'does not treat %s as the literal ruler of Whole Sign House %i',
    (sign, house) => {
      const meaning = HOUSE_SIGN_MEANINGS[house]?.[sign]

      expect(meaning).toBeDefined()
      expectNoLiteralHouseRulership(meaning!.long, sign, house)
    }
  )
})
