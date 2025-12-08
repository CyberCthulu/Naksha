// lib/lexicon/houses/index.ts
import { HouseNumber, Interpretation, maybe } from '../types'

/**
 * Meanings for each house (1–12).
 * These are placeholders — expand later.
 */
export const HOUSE_MEANINGS: Record<HouseNumber, Interpretation> = {
  1: {
    short: 'Your identity, approach to life, and how others first perceive you.',
    long: `The 1st House (Ascendant) describes the lens through which you engage with the world.
It governs self-presentation, physical appearance, and the spontaneous part of your personality.
Planets here strongly shape your instinctive behavior and life direction.`,
  },
  2: {
    short: 'Values, possessions, money, and your relationship with security.',
    long: `The 2nd House focuses on material resources, self-worth, income, and what you value.
It reflects how you build stability and what makes you feel grounded and secure.`,
  },
  3: {
    short: 'Communication, learning style, siblings, and daily thinking patterns.',
    long: `The 3rd House governs how you process information, express ideas, and relate to siblings or neighbors.
It also describes short trips, early education, and the rhythms of your everyday mind.`,
  },
  4: {
    short: 'Home, roots, childhood, and emotional foundations.',
    long: `The 4th House (IC) represents your private world — your home life, ancestry, and the emotional soil you grew from.
It’s where you retreat for comfort and protection.`,
  },
  5: {
    short: 'Creativity, romance, pleasure, and self-expression.',
    long: `The 5th House speaks to your creative spark, joy, dating life, and the ways you express individuality.
Children, hobbies, and play all live here.`,
  },
  6: {
    short: 'Daily habits, work ethic, health routines, and service.',
    long: `The 6th House describes your approach to responsibility, wellness, and the systems that keep life running smoothly.
It includes your job environment and how you manage time, stress, and structure.`,
  },
  7: {
    short: 'Partnerships, committed relationships, and one-on-one dynamics.',
    long: `The 7th House (Descendant) rules your significant relationships — romantic partners, business partners, and close allies.
It shows what qualities you attract and seek in others.`,
  },
  8: {
    short: 'Shared resources, transformation, intimacy, and psychological depth.',
    long: `The 8th House deals with merging — financially, emotionally, and spiritually.
It includes taboo topics, fear, desire, inheritance, and deep metamorphosis.`,
  },
  9: {
    short: 'Philosophy, travel, higher learning, and worldview.',
    long: `The 9th House expands the mind — through travel, study, spirituality, and belief systems.
It represents your search for meaning and perspective beyond personal experience.`,
  },
  10: {
    short: 'Career, public identity, legacy, and long-term ambition.',
    long: `The 10th House (MC) shows your professional direction, reputation, achievements, and role in society.
It’s where you strive to leave a mark on the world.`,
  },
  11: {
    short: 'Community, friendships, networks, and hopes for the future.',
    long: `The 11th House governs groups, social bonds, technological spaces, and your long-range goals.
It reflects your place within the wider collective.`,
  },
  12: {
    short: 'The subconscious, spirituality, solitude, and hidden aspects of life.',
    long: `The 12th House is the realm of dreams, intuition, surrender, and the unseen.
It includes karmic patterns, difficult-to-access emotions, and the need for retreat or healing.`,
  },
}

/** Get meaning for a specific house */
export function getHouseMeaning(house: HouseNumber): Interpretation | null {
  return maybe(HOUSE_MEANINGS[house])
}
