// lib/lexicon/signs/index.ts
import { ZodiacName, ZODIAC_FULL, Interpretation, maybe } from '../types'

/**
 * General meanings for each zodiac sign.
 * These are NOT planet-specific — just core sign archetypes.
 */
export const SIGN_MEANINGS: Record<ZodiacName, Interpretation> = {
  Aries: {
    short: 'Direct, bold, impulsive, and fueled by initiative.',
    long: `Aries carries the archetype of the warrior and pioneer.
It thrives on action, independence, and the thrill of new beginnings.
At its best it is courageous and alive; at its worst, reactive or impatient.`,
  },
  Taurus: {
    short: 'Grounded, steady, sensual, and comfort-oriented.',
    long: `Taurus stabilizes. It values consistency, security, and physical pleasure.
Its gifts are patience, endurance, and material awareness. Its shadow can be stubbornness or resistance to change.`,
  },
  Gemini: {
    short: 'Curious, quick-witted, versatile, and communicative.',
    long: `Gemini explores connections — between ideas, people, and experiences.
It thinks fast, adapts easily, and hungers for mental stimulation.`,
  },
  Cancer: {
    short: 'Nurturing, protective, emotional, and intuitive.',
    long: `Cancer represents the inner home — feelings, memory, and belonging.
It is deeply empathetic but can become guarded or moody when overwhelmed.`,
  },
  Leo: {
    short: 'Creative, expressive, confident, and warm-hearted.',
    long: `Leo shines. It seeks authenticity, recognition, and the joy of self-expression.
Its radiance inspires others, though ego can become a challenge.`,
  },
  Virgo: {
    short: 'Analytical, practical, detail-oriented, and service-minded.',
    long: `Virgo refines. It strives for improvement and clarity through observation and skill.
It excels in problem-solving but can become overly critical with itself or others.`,
  },
  Libra: {
    short: 'Balanced, diplomatic, aesthetic, and relationship-oriented.',
    long: `Libra navigates connection, fairness, and beauty. 
It seeks harmony and partnership, though indecision can arise from wanting every outcome to feel balanced.`,
  },
  Scorpio: {
    short: 'Intense, intuitive, private, and transformative.',
    long: `Scorpio moves beneath the surface. It seeks emotional truth, loyalty, and depth.
Its power comes from resilience and insight; its challenge is learning to trust.`,
  },
  Sagittarius: {
    short: 'Adventurous, philosophical, optimistic, and truth-seeking.',
    long: `Sagittarius expands horizons — physically, mentally, or spiritually.
It values freedom and meaning, though restlessness can be an issue.`,
  },
  Capricorn: {
    short: 'Disciplined, ambitious, responsible, and determined.',
    long: `Capricorn builds long-term structures. It aims for mastery, stability, and legacy.
Its strengths are endurance and leadership; its shadows are rigidity or pessimism.`,
  },
  Aquarius: {
    short: 'Innovative, independent, humanitarian, and unconventional.',
    long: `Aquarius envisions the future. It values intellect, progress, and individuality.
Its genius lies in new perspectives; its detachment can sometimes distance it from emotion.`,
  },
  Pisces: {
    short: 'Empathic, imaginative, spiritual, and boundary-fluid.',
    long: `Pisces dissolves boundaries — exploring intuition, dreams, and compassion.
Its gifts include sensitivity and creativity; its challenges include escapism or overwhelm.`,
  },
}

/** Easy array for iteration */
export const ALL_SIGNS_WITH_MEANINGS = ZODIAC_FULL

/** Get interpretation for a zodiac sign */
export function getSignMeaning(sign: ZodiacName): Interpretation | null {
  return maybe(SIGN_MEANINGS[sign])
}

/* ──────────────────────────────────────────────────────────────
 * Longitude helpers (for ChartScreen, etc.)
 * ──────────────────────────────────────────────────────────── */

/** Given a 0..360° longitude, return sign index 0..11 */
export function signIndexFromLongitude(lon: number): number {
  const normalized = ((lon % 360) + 360) % 360
  return Math.floor(normalized / 30)
}

/** Given a 0..360° longitude, return a ZodiacName (Aries…Pisces) */
export function zodiacNameFromLongitude(lon: number): ZodiacName {
  const idx = signIndexFromLongitude(lon)
  return ZODIAC_FULL[idx]
}