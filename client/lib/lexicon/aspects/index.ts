// lib/lexicon/aspects/index.ts
import { AspectType, Interpretation, maybe } from '../types'

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
