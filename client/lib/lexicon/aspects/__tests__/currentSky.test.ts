import {
  getSkyAspectMeaning,
  SKY_PLANETS,
  SKY_PAIR_THEMES,
} from '../currentSky'
import type { AspectType } from '../../types'

const TYPES: AspectType[] = ['conj', 'opp', 'square', 'trine', 'sextile']

it('covers all 45 unordered pairs and all five aspect dynamics with symmetric readings', () => {
  expect(SKY_PLANETS).toHaveLength(10)
  expect(Object.keys(SKY_PAIR_THEMES)).toHaveLength(45)
  let count = 0
  for (let i = 0; i < SKY_PLANETS.length; i++) {
    for (let j = i + 1; j < SKY_PLANETS.length; j++) {
      const a = SKY_PLANETS[i]
      const b = SKY_PLANETS[j]
      const readings = TYPES.map((type) => {
        const meaning = getSkyAspectMeaning(a, b, type)
        expect(meaning).not.toBeNull()
        expect(meaning).toEqual(getSkyAspectMeaning(b, a, type))
        for (const value of Object.values(meaning!)) {
          expect(value.trim().length).toBeGreaterThan(10)
          expect(value).not.toMatch(/undefined|NaN|TODO/)
        }
        count++
        return JSON.stringify(meaning)
      })
      expect(new Set(readings).size).toBe(5)
    }
  }
  expect(count).toBe(225)
})

it('gives each Moon–Saturn aspect its own experience and practice', () => {
  const meanings = TYPES.map(
    (type) => getSkyAspectMeaning('Moon', 'Saturn', type)!
  )
  expect(new Set(meanings.map((meaning) => meaning.meaning)).size).toBe(5)
  expect(new Set(meanings.map((meaning) => meaning.practice)).size).toBe(5)
  expect(getSkyAspectMeaning('Moon', 'Saturn', 'opp')?.meaning).toContain(
    'wanting reassurance'
  )
  expect(getSkyAspectMeaning('Moon', 'Saturn', 'trine')?.meaning).toContain(
    'consistency'
  )
})

it('frames slower pairings as background themes rather than daily predictions', () => {
  for (const type of TYPES) {
    expect(getSkyAspectMeaning('Neptune', 'Saturn', type)?.meaning).toContain(
      'longer background theme'
    )
    expect(getSkyAspectMeaning('Saturn', 'Moon', type)?.meaning).not.toContain(
      'longer background theme'
    )
  }
})

it('returns no invented reading for unsupported or malformed pairs', () => {
  expect(getSkyAspectMeaning('Earth', 'Moon', 'opp')).toBeNull()
  expect(getSkyAspectMeaning('Moon', 'Moon', 'conj')).toBeNull()
  expect(
    getSkyAspectMeaning('Moon', 'Saturn', 'unknown' as AspectType)
  ).toBeNull()
  expect(
    getSkyAspectMeaning('Moon', 'Saturn', 'toString' as AspectType)
  ).toBeNull()
})
