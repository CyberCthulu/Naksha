// lib/lexicon.ts

/**
 * Central place for all interpretive text:
 * - Planet in sign (Sun in Aries, Moon in Taurus, etc.)
 * - Houses
 * - Aspects
 *
 * The astro engine already tells us WHERE things are.
 * This file is just human-language meanings for those placements.
 */

/* ──────────────────────────────────────────────────────────────────────────────
 * Shared types & constants
 * ─────────────────────────────────────────────────────────────────────────── */

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
function maybe<T>(value: T | undefined | null): T | null {
  return value == null ? null : value
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Planet-in-sign meanings
 * ─────────────────────────────────────────────────────────────────────────── */

export type PlanetKey =
  | 'Sun'
  | 'Moon'
  | 'Mercury'
  | 'Venus'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn'
  | 'Uranus'
  | 'Neptune'
  | 'Pluto'

/**
 * Map of planet → (sign → interpretation).
 * Start with Sun & Moon and expand over time.
 */
export type PlanetSignLexicon = {
  [P in PlanetKey]?: Partial<Record<ZodiacName, Interpretation>>
}

/**
 * Boilerplate content – fill these out over time.
 * Example: “Sun in Aries” has a real-ish entry, the rest are TODO placeholders.
 */
export const PLANET_SIGN_MEANINGS: PlanetSignLexicon = {
  Sun: {
    Aries: {
      short: 'Your core self is bold, direct, and driven by initiative.',
      long: `With your Sun in Aries, you radiate pioneer energy. You’re here to start things, not wait for permission. 
You tend to act quickly on your impulses and feel most alive when you’re moving toward a challenge or a new beginning. 
Learning to balance courage with patience helps you channel this fire into lasting achievements.`,
    },
    Taurus: {
      short: 'TODO: Sun in Taurus short meaning.',
      long: 'TODO: Sun in Taurus long meaning.',
    },
    Gemini: {
      short: 'TODO: Sun in Gemini short meaning.',
      long: 'TODO: Sun in Gemini long meaning.',
    },
    Cancer: {
      short: 'TODO: Sun in Cancer short meaning.',
      long: 'TODO: Sun in Cancer long meaning.',
    },
    Leo: {
      short: 'TODO: Sun in Leo short meaning.',
      long: 'TODO: Sun in Leo long meaning.',
    },
    Virgo: {
      short: 'TODO: Sun in Virgo short meaning.',
      long: 'TODO: Sun in Virgo long meaning.',
    },
    Libra: {
      short: 'TODO: Sun in Libra short meaning.',
      long: 'TODO: Sun in Libra long meaning.',
    },
    Scorpio: {
      short: 'TODO: Sun in Scorpio short meaning.',
      long: 'TODO: Sun in Scorpio long meaning.',
    },
    Sagittarius: {
      short: 'TODO: Sun in Sagittarius short meaning.',
      long: 'TODO: Sun in Sagittarius long meaning.',
    },
    Capricorn: {
      short: 'TODO: Sun in Capricorn short meaning.',
      long: 'TODO: Sun in Capricorn long meaning.',
    },
    Aquarius: {
      short: 'TODO: Sun in Aquarius short meaning.',
      long: 'TODO: Sun in Aquarius long meaning.',
    },
    Pisces: {
      short: 'TODO: Sun in Pisces short meaning.',
      long: 'TODO: Sun in Pisces long meaning.',
    },
  },

  Moon: {
    Aries: {
      short: 'TODO: Moon in Aries short meaning.',
      long: 'TODO: Moon in Aries long meaning.',
    },
    Taurus: {
      short: 'TODO: Moon in Taurus short meaning.',
      long: 'TODO: Moon in Taurus long meaning.',
    },
    // ...fill out as you go
  },

  // Mercury, Venus, etc – you can add these later with the same structure.
}

/**
 * Helper: get interpretation for a specific planet + sign,
 * or `null` if we don’t have anything yet.
 */
export function getPlanetSignMeaning(
  planet: PlanetKey,
  sign: ZodiacName
): Interpretation | null {
  const planetBlock = PLANET_SIGN_MEANINGS[planet]
  if (!planetBlock) return null
  return maybe(planetBlock[sign])
}

/* ──────────────────────────────────────────────────────────────────────────────
 * House meanings (by house number)
 * ─────────────────────────────────────────────────────────────────────────── */

export const HOUSE_MEANINGS: Record<HouseNumber, Interpretation> = {
  1: {
    short: 'TODO: 1st house short meaning.',
    long: 'TODO: 1st house long meaning.',
  },
  2: {
    short: 'TODO: 2nd house short meaning.',
    long: 'TODO: 2nd house long meaning.',
  },
  3: {
    short: 'TODO: 3rd house short meaning.',
    long: 'TODO: 3rd house long meaning.',
  },
  4: {
    short: 'TODO: 4th house short meaning.',
    long: 'TODO: 4th house long meaning.',
  },
  5: {
    short: 'TODO: 5th house short meaning.',
    long: 'TODO: 5th house long meaning.',
  },
  6: {
    short: 'TODO: 6th house short meaning.',
    long: 'TODO: 6th house long meaning.',
  },
  7: {
    short: 'TODO: 7th house short meaning.',
    long: 'TODO: 7th house long meaning.',
  },
  8: {
    short: 'TODO: 8th house short meaning.',
    long: 'TODO: 8th house long meaning.',
  },
  9: {
    short: 'TODO: 9th house short meaning.',
    long: 'TODO: 9th house long meaning.',
  },
  10: {
    short: 'TODO: 10th house short meaning.',
    long: 'TODO: 10th house long meaning.',
  },
  11: {
    short: 'TODO: 11th house short meaning.',
    long: 'TODO: 11th house long meaning.',
  },
  12: {
    short: 'TODO: 12th house short meaning.',
    long: 'TODO: 12th house long meaning.',
  },
}

export function getHouseMeaning(house: HouseNumber): Interpretation | null {
  return maybe(HOUSE_MEANINGS[house])
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Aspect meanings
 * ─────────────────────────────────────────────────────────────────────────── */

export const ASPECT_MEANINGS: Record<AspectType, Interpretation> = {
  conj: {
    short: 'Two energies fused together, amplifying each other.',
    long: `A conjunction blends two planets so closely that they act as one. 
This can be powerful and intense, but also sometimes overwhelming. 
How it feels depends a lot on the planets involved and the sign they share.`,
  },
  opp: {
    short: 'A polarity that asks for balance and integration.',
    long: `Oppositions set two planets across from each other, like a seesaw. 
They highlight tension between two parts of life and invite you to find a middle path, 
rather than choosing one side at the expense of the other.`,
  },
  square: {
    short: 'Friction that pushes you toward growth and action.',
    long: `Squares represent inner or outer conflict that won’t stay quiet. 
They can feel frustrating, but they’re also catalysts for growth, 
motivating you to change patterns and build new skills.`,
  },
  trine: {
    short: 'A natural flow of energy and ease between planets.',
    long: `Trines describe talents, ease, and “things that just work.” 
They show areas where energy flows smoothly, often without much conscious effort. 
The invitation is to actively use, not sleepwalk through, these blessings.`,
  },
  sextile: {
    short: 'Light opportunities that respond well to gentle effort.',
    long: `Sextiles are softer supportive aspects. 
They highlight opportunities and helpful connections that respond when you show up and participate, 
even if they don’t demand your attention as loudly as squares or oppositions.`,
  },
}

export function getAspectMeaning(type: AspectType): Interpretation | null {
  return maybe(ASPECT_MEANINGS[type])
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Helpers for mapping from longitude to sign label
 * ─────────────────────────────────────────────────────────────────────────── */

/**
 * Given a 0..360 longitude, return index 0..11.
 * This mirrors what you have in ChartScreen.
 */
export function signIndexFromLongitude(lon: number): number {
  const normalized = ((lon % 360) + 360) % 360
  return Math.floor(normalized / 30)
}

export function zodiacNameFromLongitude(lon: number): ZodiacName {
  const idx = signIndexFromLongitude(lon)
  return ZODIAC_FULL[idx]
}
