import { HouseNumber, Interpretation, ZodiacName } from '../types'

/**
 * Specific house-sign meanings.
 * Start by filling the combinations that matter most.
 * Anything missing can fall back to a blended helper.
 */
export const HOUSE_SIGN_MEANINGS: Partial<
  Record<HouseNumber, Partial<Record<ZodiacName, Interpretation>>>
> = {
  1: {
    Aries: {
      short: 'You approach life boldly, directly, and with strong instinctive drive.',
      long: `With Aries on the 1st House, you tend to meet life head-on. Your energy comes across as direct, courageous, and action-oriented, and people often experience you as someone who initiates rather than waits.

There is usually a strong need to act independently and trust your own instincts. The growth edge is learning patience and pacing, so your confidence becomes focused leadership rather than impulsive reaction.`,
    },
    Taurus: {
      short: 'You approach life steadily, calmly, and with a grounding presence.',
      long: `With Taurus on the 1st House, you tend to move through life with steadiness, patience, and a desire for stability. Others may see you as dependable, grounded, and resistant to unnecessary chaos.

You often prefer building slowly and surely rather than rushing. Your growth comes through balancing consistency with flexibility, so security does not become stagnation.`,
    },
    Gemini: {
      short: 'You approach life with curiosity, adaptability, and mental quickness.',
      long: `With Gemini on the 1st House, your identity tends to express itself through communication, curiosity, and movement. People may experience you as lively, observant, and mentally alert.

You thrive on variety and connection, often learning by talking, exploring, and comparing perspectives. The challenge is focus: learning how to stay rooted when your mind wants to move in many directions at once.`,
    },
    Cancer: {
      short: 'You approach life sensitively, protectively, and with emotional awareness.',
      long: `With Cancer on the 1st House, you tend to engage life through feeling, intuition, and protectiveness. Others may experience you as caring, receptive, and emotionally perceptive, even when you are guarded.

Security and trust matter deeply to how you show up. Growth comes through honoring your sensitivity while building strong enough boundaries to keep it from becoming defensiveness.`,
    },
    Leo: {
      short: 'You approach life confidently, creatively, and with visible self-expression.',
      long: `With Leo on the 1st House, your presence tends to feel warm, expressive, and self-defining. People often notice your individuality quickly, and there is usually a natural urge to create, lead, or radiate from the heart.

You are here to live visibly and authentically. The work is making sure confidence comes from true self-connection rather than needing constant recognition.`,
    },
    Virgo: {
      short: 'You approach life thoughtfully, analytically, and with careful attention to detail.',
      long: `With Virgo on the 1st House, you tend to meet life through observation, discernment, and a desire to improve what you touch. Others may see you as intelligent, precise, and practical.

You often notice details others miss and may instinctively try to make life more orderly or useful. Growth comes through softening perfectionism, so discernment becomes wisdom rather than self-pressure.`,
    },
    Libra: {
      short: 'You approach life through balance, relationship-awareness, and a desire for harmony.',
      long: `With Libra on the 1st House, you tend to engage life through grace, connection, and sensitivity to balance. Others may experience you as diplomatic, pleasant, and socially aware.

You often read dynamics quickly and instinctively try to create fairness or ease. The challenge is remembering that your own truth matters just as much as keeping peace around you.`,
    },
    Scorpio: {
      short: 'You approach life intensely, privately, and with strong emotional depth.',
      long: `With Scorpio on the 1st House, your presence tends to feel powerful, observant, and hard to read at first. Others may sense depth, self-protection, and emotional intensity, even when you say very little.

You often move through life with strong instincts and a need for authenticity. Growth comes through allowing trust and vulnerability to coexist with strength, rather than relying only on control.`,
    },
    Sagittarius: {
      short: 'You approach life with openness, optimism, and a drive to explore beyond limits.',
      long: `With Sagittarius on the 1st House, you tend to meet life with curiosity, movement, and a search for meaning. Others may see you as adventurous, candid, and future-oriented.

You are often most yourself when expanding — through ideas, travel, learning, or spiritual growth. The challenge is grounding your enthusiasm so your vision turns into lived wisdom rather than restlessness.`,
    },
    Capricorn: {
      short: 'You approach life seriously, purposefully, and with strong self-discipline.',
      long: `With Capricorn on the 1st House, your presence tends to feel composed, responsible, and deliberate. Others may experience you as capable, mature, and focused on what matters long-term.

You often move through life with a sense of duty or inner pressure to build something meaningful. Growth comes through allowing warmth, humor, and softness to exist alongside ambition.`,
    },
    Aquarius: {
      short: 'You approach life independently, originally, and from a broader perspective.',
      long: `With Aquarius on the 1st House, you tend to engage life through independence, originality, and a willingness to think differently. Others may see you as unconventional, thoughtful, or slightly detached.

You are often most alive when you are free to be fully yourself. The growth edge is allowing emotional presence to accompany your individuality, so connection and authenticity can coexist.`,
    },
    Pisces: {
      short: 'You approach life intuitively, compassionately, and with a porous sensitivity.',
      long: `With Pisces on the 1st House, your presence tends to feel soft, imaginative, and emotionally receptive. Others may experience you as empathetic, dreamy, or difficult to pin down.

You often move through life by sensing rather than forcing. Growth comes through grounding your sensitivity with stronger boundaries, so intuition becomes a gift rather than a source of overwhelm.`,
    },
  },
  2: {
  },
  3: {
  },
  4: {
  },
  5: {
  },
  6: {
  },
  7: {
  },
  8: {
  },
  9: {
  },
  10: {
  },
  11: {
  },
  12: {
  },
}

/**
 * Sign-flavor fallback phrases used when a specific house-sign
 * interpretation has not been written yet.
 */
export const HOUSE_SIGN_FLAVORS: Record<ZodiacName, string> = {
  Aries: 'with boldness, directness, and a strong instinct to initiate',
  Taurus: 'with patience, steadiness, and a desire for stability',
  Gemini: 'through curiosity, conversation, and mental flexibility',
  Cancer: 'with sensitivity, protectiveness, and emotional awareness',
  Leo: 'with confidence, warmth, and a desire to express yourself fully',
  Virgo: 'through analysis, discernment, and practical attention to detail',
  Libra: 'through balance, relationship-awareness, and a desire for harmony',
  Scorpio: 'with intensity, privacy, and emotional depth',
  Sagittarius: 'through exploration, optimism, and a search for meaning',
  Capricorn: 'with discipline, responsibility, and long-term focus',
  Aquarius: 'through independence, originality, and a broader perspective',
  Pisces: 'through intuition, compassion, and imagination',
}