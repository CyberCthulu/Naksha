import { HouseNumber, Interpretation, PlanetKey, maybe } from '../types'

export type PlanetHouseLexicon = Partial<
  Record<PlanetKey, Partial<Record<HouseNumber, Interpretation>>>
>

export const PLANET_HOUSE_MEANINGS: PlanetHouseLexicon = {
  Sun: {
    1: {
      short: 'Your identity is highly visible and central to how you move through life.',
      long: `With the Sun in the 1st House, your core identity tends to be visible, strong, and personally defining. You often feel called to live as yourself directly and openly, and others may notice your presence quickly.

This placement can bring confidence, vitality, and a strong need to develop an authentic sense of self. The growth edge is making sure self-focus becomes self-awareness rather than self-absorption.`,
    },
    10: {
      short: 'Your identity is strongly tied to purpose, achievement, and public contribution.',
      long: `With the Sun in the 10th House, your sense of self often grows through achievement, direction, and the desire to make a meaningful mark on the world. You may feel called toward visibility, leadership, or a strong public role.

There is often a deep need to build something lasting and to be recognized for your efforts. Growth comes through balancing outer success with inner alignment, so achievement reflects who you truly are.`,
    },
  },

  Moon: {
    4: {
      short: 'Your emotional life is deeply tied to home, roots, and inner security.',
      long: `With the Moon in the 4th House, emotional safety, home, and belonging tend to be central themes in your life. Your inner world is rich, and your roots may strongly shape your emotional patterns.

You often need privacy, familiarity, and true emotional grounding in order to feel well. Growth comes through nurturing yourself as intentionally as you nurture others.`,
    },
  },

  Venus: {
    7: {
      short: 'Love, harmony, and relationship are major themes in your life path.',
      long: `With Venus in the 7th House, partnership, affection, and mutuality tend to play a major role in your life. You often value connection deeply and may be drawn to beauty, cooperation, and balance in close relationships.

This can be a lovely placement for attraction, diplomacy, and relational intelligence. Growth comes through maintaining your own center while building meaningful bonds.`,
    },
  },

  Mars: {
    1: {
      short: 'Your drive, will, and assertiveness are strong parts of your outward presence.',
      long: `With Mars in the 1st House, your energy tends to be direct, visible, and action-oriented. Others may experience you as bold, strong-willed, or intense, and you often prefer to meet life head-on.

This placement can bring courage and initiative, but also impatience or reactivity. Growth comes through channeling your drive with intention, so your strength becomes focused and constructive.`,
    },
  },
}

export function getPlanetHouseMeaning(
  planet: PlanetKey,
  house: HouseNumber
): Interpretation | null {
  return maybe(PLANET_HOUSE_MEANINGS[planet]?.[house])
}