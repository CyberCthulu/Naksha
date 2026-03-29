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
    Aries: {
      short: 'You pursue money, resources, and self-worth boldly, independently, and with urgency.',
      long: `With Aries on the 2nd House, you tend to approach money, possessions, and self-worth in a direct and active way. You may feel strongest when you are earning through your own effort, initiative, and courage rather than depending too heavily on others.

There is often a strong impulse to move quickly around financial matters, whether that means earning, spending, investing in yourself, or taking risks to build security. Your growth comes through developing patience and consistency, so confidence around resources becomes sustainable strength rather than impulsive action.`,
    },
    Taurus: {
      short: 'You pursue money, resources, and self-worth steadily, patiently, and with a strong need for stability.',
      long: `With Taurus on the 2nd House, you tend to value security, consistency, and tangible comfort in the material realm. Building something lasting usually matters more to you than chasing quick results, and you may have a natural instinct for preserving resources over time.

There is often a deep connection between financial stability and inner peace. You generally do best when you trust slow, steady growth. Your growth comes through staying open to change when needed, so your desire for security does not turn into fear of movement or over-attachment to what is familiar.`,
    },
    Gemini: {
      short: 'You pursue money, resources, and self-worth through adaptability, ideas, and multiple avenues.',
      long: `With Gemini on the 2nd House, you tend to approach finances and self-worth through the mind: ideas, communication, learning, networking, and flexibility. You may be drawn toward earning through writing, speaking, teaching, media, sales, technology, or any path that keeps you mentally engaged.

Your values may be diverse and changing, and you may prefer having more than one income stream or interest rather than putting everything into a single lane. The challenge is consistency. Growth comes through developing focus and follow-through, so your many talents become real assets rather than scattered potential.`,
    },
    Cancer: {
      short: 'You pursue money, resources, and self-worth through emotional security, care, and protection.',
      long: `With Cancer on the 2nd House, your relationship to money and possessions is often deeply emotional. Material stability may feel closely tied to safety, family, nourishment, and a sense of being protected from uncertainty.

You may value what feels personal, familiar, and meaningful more than what is flashy or purely status-driven. There can also be a nurturing quality in how you earn or provide. Your growth comes through building inner emotional security alongside outer financial security, so fear or mood does not overly shape your decisions around worth and resources.`,
    },
    Leo: {
      short: 'You pursue money, resources, and self-worth with pride, creativity, and a desire to express your value visibly.',
      long: `With Leo on the 2nd House, you tend to connect self-worth with creative power, personal dignity, and the ability to bring something uniquely yours into the world. You may want your earning path to feel meaningful, expressive, and aligned with your identity rather than merely practical.

There is often generosity here, along with a desire to enjoy life and create a sense of abundance. You may also feel strongest when your talents are recognized and appreciated. Growth comes through grounding self-worth in something deeper than praise or appearances, so confidence in your value remains steady regardless of outside validation.`,
    },
    Virgo: {
      short: 'You pursue money, resources, and self-worth carefully, practically, and through steady improvement.',
      long: `With Virgo on the 2nd House, you tend to take a thoughtful and precise approach to finances, possessions, and personal value. You may be skilled at organizing, budgeting, refining systems, and paying attention to the details that help life function better.

Your sense of worth may grow through usefulness, competence, and being able to contribute in concrete ways. At times, though, this placement can bring worry, over-analysis, or harsh self-judgment around not doing enough. Growth comes through recognizing that your value is not earned only through perfection, and that practical intelligence becomes most powerful when paired with self-respect.`,
    },
    Libra: {
      short: 'You pursue money, resources, and self-worth through balance, partnership, and a refined sense of value.',
      long: `With Libra on the 2nd House, you tend to approach resources through harmony, aesthetics, and relationship-awareness. You may value beauty, fairness, quality, and mutual exchange, and your earning path may involve collaboration, diplomacy, art, design, or working skillfully with people.

There is often a desire to create peace and equilibrium in the material realm rather than harsh struggle. Your self-worth may also be shaped strongly by how appreciated or valued you feel in relationship. Growth comes through strengthening your independent standards of worth, so your values remain clear even when others' opinions or expectations are in the room.`,
    },
    Scorpio: {
      short: 'You pursue money, resources, and self-worth intensely, strategically, and with strong emotional investment.',
      long: `With Scorpio on the 2nd House, your connection to money, possessions, and value tends to run deep. You may approach material matters with seriousness, privacy, and a powerful instinct to protect what is yours. Surface-level security is rarely enough; you often want something that feels real, resilient, and hard-earned.

There can be strong lessons here around attachment, control, survival, and transformation. At your best, this placement can give tremendous resourcefulness and the ability to rebuild after loss. Growth comes through loosening fear-based control and learning that true security comes not only from holding tightly, but from trusting your capacity to regenerate.`,
    },
    Sagittarius: {
      short: 'You pursue money, resources, and self-worth through growth, opportunity, and a wider vision of abundance.',
      long: `With Sagittarius on the 2nd House, you tend to approach money and value with optimism, openness, and a desire for expansion. You may be drawn toward earning through travel, education, teaching, philosophy, publishing, entrepreneurship, or any path that broadens your world.

You often need your material life to feel connected to freedom, possibility, and meaning. Sometimes this can create generosity or risk-taking that outpaces practicality. Growth comes through pairing faith with wisdom and structure, so abundance becomes something you can actually build and sustain rather than only believe in.`,
    },
    Capricorn: {
      short: 'You pursue money, resources, and self-worth seriously, strategically, and with long-term discipline.',
      long: `With Capricorn on the 2nd House, you tend to take finances, possessions, and personal value very seriously. There is often a strong desire to build stability through hard work, responsibility, and long-range planning, and you may feel most secure when your material world is well structured.

This placement can bring endurance, maturity, and real capacity for building wealth over time. It can also bring pressure, scarcity-consciousness, or the feeling that worth must be earned through achievement. Growth comes through allowing self-worth to exist alongside ambition, so discipline serves your life without becoming a burden of constant self-measurement.`,
    },
    Aquarius: {
      short: 'You pursue money, resources, and self-worth independently, unconventionally, and through originality.',
      long: `With Aquarius on the 2nd House, you tend to approach the material world with independence of thought and a less conventional value system. You may not want to earn, spend, or build security in the same way everyone else does, and you may feel most aligned when your finances reflect freedom, innovation, or a broader social vision.

Your gifts often emerge through originality, intellect, community, technology, or alternative paths. At times, this placement can create detachment or unpredictability around money and value. Growth comes through balancing independence with stability, so your unique approach to resources becomes liberating rather than erratic.`,
    },
    Pisces: {
      short: 'You pursue money, resources, and self-worth intuitively, compassionately, and with fluid boundaries around value.',
      long: `With Pisces on the 2nd House, your relationship to money, possessions, and self-worth may feel sensitive, intuitive, and sometimes difficult to define clearly. You may value meaning, beauty, spirituality, compassion, and emotional resonance more than purely material measures of success.

This placement can support earning through healing, art, imagination, service, or spiritual work, but it can also blur boundaries around giving, receiving, and recognizing your own value. Growth comes through grounding your sensitivity in practical structure, so compassion does not become depletion and your worth does not dissolve into uncertainty.`,
    },
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