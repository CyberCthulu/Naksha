//lib/lexicon/planets/index.ts

import { Interpretation, PlanetKey, ZodiacName } from '../types'

// For now, export an empty structure you will fill later
export const PLANET_SIGN_MEANINGS: Partial<
  Record<PlanetKey, Partial<Record<ZodiacName, Interpretation>>>
> = {}

export function getPlanetSignMeaning(
  planet: PlanetKey,
  sign: ZodiacName
): Interpretation | null {
  return PLANET_SIGN_MEANINGS[planet]?.[sign] ?? null
}
