// lib/lexicon/types.ts

/**
 * Shared types & constants for the lexicon modules.
 * Keep this file small and type-only so other modules can import it
 * without circular dependencies.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * Zodiac / Houses / Aspects
 * ────────────────────────────────────────────────────────────────────────── */

export const ZODIAC_FULL = [
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

export type ZodiacName = (typeof ZODIAC_FULL)[number]

export type HouseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export type AspectType = 'conj' | 'opp' | 'square' | 'trine' | 'sextile'

/* ────────────────────────────────────────────────────────────────────────────
 * Planets
 * ────────────────────────────────────────────────────────────────────────── */

export const CANONICAL_PLANET_KEYS = [
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

export type PlanetKey = (typeof CANONICAL_PLANET_KEYS)[number]

const CANONICAL_PLANET_KEY_SET = new Set<string>(CANONICAL_PLANET_KEYS)

export function isPlanetKey(name: string): name is PlanetKey {
  return CANONICAL_PLANET_KEY_SET.has(name)
}

/* ────────────────────────────────────────────────────────────────────────────
 * Interpretation blocks
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * A single interpretation block.
 * - `short`: 1–2 sentences, good for inline / quick view.
 * - `long`:  a fuller paragraph, good for “expand” / modal / detail screen.
 */
export type Interpretation = {
  short: string
  long: string
}

/**
 * Utility: safe lookup that returns `null` if we’re missing data.
 */
export function maybe<T>(value: T | undefined | null): T | null {
  return value == null ? null : value
}
