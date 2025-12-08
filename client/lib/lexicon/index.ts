// lib/lexicon/index.ts
//
// Barrel file for the lexicon system.
// Other parts of the app should import from here instead of reaching
// into subfolders directly, e.g.:
//
//   import { getPlanetSignMeaning, zodiacNameFromLongitude } from '../lib/lexicon'
//

// Core shared types & constants
export * from './types'

// Planet-in-sign meanings
export {
  PLANET_SIGN_MEANINGS,
  getPlanetSignMeaning,
} from './planets'

// House meanings
export {
  HOUSE_MEANINGS,
  getHouseMeaning,
} from './houses'

// Aspect meanings
export {
  ASPECT_MEANINGS,
  getAspectMeaning,
} from './aspects'

// Helpers to map longitudes to sign labels
export {
  zodiacNameFromLongitude,
  signIndexFromLongitude,
} from './signs'
