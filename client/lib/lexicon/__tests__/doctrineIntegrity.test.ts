import { HOUSE_MEANINGS } from '../houses/meanings'
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
