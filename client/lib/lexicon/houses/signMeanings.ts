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
    Aries: {
      short: 'You communicate directly, quickly, and with bold, instinctive expression.',
      long: `With Aries on the 3rd House, your communication style tends to be fast, direct, and assertive. You often speak what comes to mind without much filtering, and others may experience you as confident, candid, or even confrontational at times.

Your thinking process is active and decisive, preferring action over over-analysis. You may learn best by doing, engaging, and testing ideas in real time. Growth comes through developing patience in communication, so your natural boldness becomes clear leadership rather than impulsive reaction.`,
    },
    Taurus: {
      short: 'You communicate steadily, thoughtfully, and with a grounded, practical tone.',
      long: `With Taurus on the 3rd House, your communication style tends to be calm, measured, and deliberate. You may take your time to process thoughts before expressing them, and others often experience you as steady, reliable, and clear.

You tend to prefer practical, tangible knowledge and may learn best through repetition and consistency. Once you understand something, it tends to stay with you. Growth comes through staying open to new ideas and perspectives, so your grounded thinking does not become resistance to change.`,
    },
    Gemini: {
      short: 'You communicate quickly, curiously, and with natural adaptability and mental agility.',
      long: `With Gemini on the 3rd House, communication is a central strength. You tend to think, speak, and process information quickly, often moving between topics with ease. Others may experience you as witty, articulate, and mentally sharp.

You thrive on conversation, learning, and exchanging ideas, and you may enjoy writing, speaking, or connecting across different perspectives. The challenge is depth and focus. Growth comes through learning to slow down and stay with ideas long enough to fully develop them.`,
    },
    Cancer: {
      short: 'You communicate with sensitivity, intuition, and emotional awareness.',
      long: `With Cancer on the 3rd House, your communication style is influenced strongly by emotion and intuition. You may pick up on tone, mood, and unspoken dynamics easily, and your words often carry a caring or protective quality.

You may prefer familiar environments or people when expressing yourself, and your learning style may be tied to emotional connection and memory. Growth comes through balancing emotional awareness with clarity, so feelings enhance communication rather than cloud it.`,
    },
    Leo: {
      short: 'You communicate confidently, expressively, and with a natural sense of presence.',
      long: `With Leo on the 3rd House, your communication tends to be warm, expressive, and engaging. You may have a natural storytelling ability or a way of speaking that draws attention and holds interest.

You often want your voice to be heard and may take pride in how you express yourself. Learning can feel most alive when it allows for creativity and self-expression. Growth comes through ensuring that communication remains authentic and open, rather than becoming centered only on recognition or performance.`,
    },
    Virgo: {
      short: 'You communicate precisely, analytically, and with strong attention to detail.',
      long: `With Virgo on the 3rd House, your thinking and communication style tends to be careful, structured, and detail-oriented. You may be skilled at explaining complex ideas clearly, noticing small errors, or refining information into something useful.

You often learn best through analysis, organization, and practical application. However, this placement can also bring overthinking or self-criticism in how you express yourself. Growth comes through trusting your voice and allowing communication to flow without excessive perfectionism.`,
    },
    Libra: {
      short: 'You communicate diplomatically, thoughtfully, and with a focus on balance and harmony.',
      long: `With Libra on the 3rd House, your communication style tends to be polite, considerate, and aware of others. You may naturally weigh different perspectives and aim to create understanding or agreement.

You often prefer dialogue over conflict and may be skilled in negotiation or mediation. Your learning style may involve comparison, discussion, and shared ideas. Growth comes through expressing your own viewpoint clearly, even when it disrupts harmony.`,
    },
    Scorpio: {
      short: 'You communicate deeply, intentionally, and with a perceptive, probing mind.',
      long: `With Scorpio on the 3rd House, your communication style tends to be intense, focused, and purposeful. You may not speak unnecessarily, but when you do, your words often carry weight and depth.

You tend to observe closely, read between the lines, and seek truth beneath the surface. Learning may involve investigation, psychology, or uncovering hidden layers. Growth comes through softening control in communication, allowing openness and trust alongside depth.`,
    },
    Sagittarius: {
      short: 'You communicate openly, honestly, and with a broad, philosophical perspective.',
      long: `With Sagittarius on the 3rd House, your communication style tends to be expansive, direct, and idea-driven. You may enjoy discussing big concepts, beliefs, and visions, and others may experience you as honest, enthusiastic, and sometimes blunt.

You often learn through exploration, teaching, and connecting ideas to a larger meaning. There is a natural desire to understand the “why” behind things. Growth comes through refining your communication, so truth is expressed with both clarity and consideration.`,
    },
    Capricorn: {
      short: 'You communicate seriously, thoughtfully, and with a structured, disciplined approach.',
      long: `With Capricorn on the 3rd House, your communication style tends to be practical, concise, and purposeful. You may not speak unless there is something meaningful to say, and others may see you as grounded, intelligent, and reliable in your thinking.

You often prefer structured learning and may excel in environments that require discipline and focus. Growth comes through allowing more flexibility and ease in communication, so expression does not feel overly restricted or heavy.`,
    },
    Aquarius: {
      short: 'You communicate uniquely, intellectually, and with an original perspective.',
      long: `With Aquarius on the 3rd House, your thinking and communication style tends to be innovative, independent, and future-oriented. You may approach ideas from unconventional angles and enjoy exploring concepts that challenge the norm.

You often thrive in discussions that involve innovation, systems, or collective thinking. Others may experience you as insightful, but sometimes detached. Growth comes through integrating emotional presence into your communication, so ideas connect as well as inspire.`,
    },
    Pisces: {
      short: 'You communicate intuitively, imaginatively, and with a fluid, sensitive style.',
      long: `With Pisces on the 3rd House, your communication style tends to be soft, intuitive, and sometimes abstract. You may express yourself through imagery, feeling, or symbolism rather than strict logic, and others may experience your words as poetic or emotional.

You often learn through intuition, immersion, and creative experience. However, clarity can sometimes be a challenge. Growth comes through grounding your thoughts and expression, so your intuitive understanding can be communicated in a way others can fully grasp.`,
    },
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