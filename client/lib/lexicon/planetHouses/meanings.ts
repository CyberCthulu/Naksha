//lib/lexicon/planetHouses/meanings.ts
import { HouseNumber, Interpretation, PlanetKey } from '../types'

export type PlanetHouseLexicon = Partial<
  Record<PlanetKey, Partial<Record<HouseNumber, Interpretation>>>
>

export const PLANET_HOUSE_MEANINGS: PlanetHouseLexicon = {
  Sun: {
    1: {
      short: 'Your identity is visible, self-defining, and central to how you move through life.',
      long: `With the Sun in the 1st House, your sense of self tends to be strong, visible, and central to your life path. You are often meant to develop a clear identity and express who you are openly rather than living through the expectations of others.

There is usually a natural drive toward self-definition, confidence, and personal presence. Others may notice you quickly, and your energy can come across as warm, vital, or self-possessed. Growth comes through embodying authentic confidence, so your identity becomes a source of light rather than something built only on recognition.`,
    },
    2: {
      short: 'Your identity is tied to values, self-worth, and building stable resources.',
      long: `With the Sun in the 2nd House, your sense of self is often connected to what you value, what you build, and how secure you feel in the material world. You may take pride in your ability to create stability, earn resources, or develop something tangible over time.

There is often a strong lesson here around self-worth: learning that your value is real and inherent, even while you work to build external security. Growth comes through grounding confidence in both inner worth and outer stewardship, so possessions support your life without defining your identity.`,
    },
    3: {
      short: 'Your identity expresses itself through communication, learning, and mental engagement.',
      long: `With the Sun in the 3rd House, your core identity tends to shine through your mind, voice, and way of communicating. You may feel most alive when learning, speaking, writing, teaching, or exchanging ideas with others.

There is often a natural curiosity and a desire to understand the world through direct interaction. Your words may carry presence, and your thinking can become a major part of how others know you. Growth comes through developing depth and focus, so your intelligence becomes integrated wisdom rather than constant movement alone.`,
    },
    4: {
      short: 'Your identity is rooted in home, inner security, and emotional foundation.',
      long: `With the Sun in the 4th House, your sense of self is often closely tied to your roots, private life, family story, or emotional foundation. Much of your identity may develop through understanding where you come from and what truly makes you feel grounded.

There can be a strong need to build a home, inner base, or private world that reflects who you really are. Your path often involves becoming secure within yourself from the inside out. Growth comes through honoring your inner life deeply, so emotional grounding becomes the source of outer strength.`,
    },
    5: {
      short: 'Your identity expresses itself through creativity, joy, romance, and visible self-expression.',
      long: `With the Sun in the 5th House, your core self often shines through creativity, play, self-expression, and the desire to live from the heart. You may feel most alive when creating, performing, leading, or sharing your unique essence openly.

There is often a strong desire to be seen for who you truly are and to experience life vividly. This placement can bring charisma, artistic energy, and warmth. Growth comes through expressing yourself authentically rather than performatively, so your creative fire becomes a true reflection of the soul rather than a search for applause.`,
    },
    6: {
      short: 'Your identity develops through work, service, discipline, and daily refinement.',
      long: `With the Sun in the 6th House, your sense of self often develops through work, routine, responsibility, and the desire to improve life in practical ways. You may take pride in being useful, capable, and dependable, with a strong drive to refine your habits or contribution over time.

There is often a deep lesson here around integrating purpose into daily life rather than seeking meaning only in grand moments. Your identity strengthens through discipline and service. Growth comes through balancing self-improvement with self-acceptance, so your worth is not reduced to productivity alone.`,
    },
    7: {
      short: 'Your identity develops through partnership, mirroring, and learning through others.',
      long: `With the Sun in the 7th House, your sense of self is often shaped strongly through relationships, partnership, and one-to-one dynamics. You may discover important parts of who you are through the people you attract and the mirrors they provide.

There is often a natural orientation toward connection, cooperation, or shared purpose. Relationships can become major catalysts for growth, identity, and self-understanding. Growth comes through maintaining a clear sense of self within partnership, so closeness enhances your identity rather than replacing it.`,
    },
    8: {
      short: 'Your identity is shaped by depth, transformation, intimacy, and profound inner change.',
      long: `With the Sun in the 8th House, your core identity often develops through intense experiences, emotional depth, vulnerability, and transformation. You may not live life superficially; instead, major turning points, inner crises, or experiences of loss and rebirth may play a defining role in shaping who you become.

There is often a strong drive to understand what lies beneath the surface — psychologically, emotionally, spiritually, or materially. You may carry quiet power and depth even if you are not immediately transparent. Growth comes through embracing transformation consciously, so intensity becomes empowerment rather than entanglement.`,
    },
    9: {
      short: 'Your identity expands through philosophy, higher learning, exploration, and the search for truth.',
      long: `With the Sun in the 9th House, your sense of self tends to grow through exploration, learning, travel, belief systems, and the search for meaning. You may feel most alive when expanding your worldview and engaging with ideas that lift you beyond the familiar.

There is often a strong desire to understand life from a broader perspective and to live according to truth as you understand it. Teaching, guiding, studying, or spiritually seeking may all play a central role in your path. Growth comes through grounding your vision, so your beliefs become embodied wisdom rather than abstraction alone.`,
    },
    10: {
      short: 'Your identity is expressed through achievement, vocation, public life, and legacy.',
      long: `With the Sun in the 10th House, your core identity is often strongly tied to your public path, career, contribution, and what you are here to build in the world. You may feel called to achieve, lead, or become known for something meaningful.

There is often a natural visibility here, along with a desire to make an impact through your work or role in society. Responsibility, ambition, and purpose may become central themes in your life. Growth comes through defining success on your own terms, so your legacy reflects your true calling rather than external pressure alone.`,
    },
    11: {
      short: 'Your identity expresses itself through community, future vision, and contribution to the collective.',
      long: `With the Sun in the 11th House, your sense of self often comes alive through friendships, networks, communities, and long-term visions for the future. You may feel strongly connected to collective goals, shared ideals, or the desire to contribute something meaningful beyond yourself.

There is often a natural role here as a connector, organizer, leader, or contributor within groups. Your identity may strengthen when you are aligned with people and causes that reflect your values. Growth comes through staying rooted in your individuality, so collective belonging does not blur your authentic self.`,
    },
    12: {
      short: 'Your identity develops through inner life, solitude, spiritual growth, and hidden depths.',
      long: `With the Sun in the 12th House, your core identity may develop in subtle, inward, or hidden ways. You may feel deeply connected to solitude, spirituality, imagination, healing, or the unseen dimensions of life, even if your sense of self takes time to fully clarify.

There is often a rich inner world here, along with sensitivity to what is unspoken or beyond the surface. At times, identity can feel diffuse until you learn to trust your inner light. Growth comes through consciously cultivating inner clarity and spiritual grounding, so what is hidden within becomes a source of wisdom rather than confusion.`,
    },
  },

  Moon: {
    1: { short: '', long: `` },
    2: { short: '', long: `` },
    3: { short: '', long: `` },
    4: { short: '', long: `` },
    5: { short: '', long: `` },
    6: { short: '', long: `` },
    7: { short: '', long: `` },
    8: { short: '', long: `` },
    9: { short: '', long: `` },
    10: { short: '', long: `` },
    11: { short: '', long: `` },
    12: { short: '', long: `` },
  },

  Mercury: {
    1: { short: '', long: `` },
    2: { short: '', long: `` },
    3: { short: '', long: `` },
    4: { short: '', long: `` },
    5: { short: '', long: `` },
    6: { short: '', long: `` },
    7: { short: '', long: `` },
    8: { short: '', long: `` },
    9: { short: '', long: `` },
    10: { short: '', long: `` },
    11: { short: '', long: `` },
    12: { short: '', long: `` },
  },

  Venus: {
    1: { short: '', long: `` },
    2: { short: '', long: `` },
    3: { short: '', long: `` },
    4: { short: '', long: `` },
    5: { short: '', long: `` },
    6: { short: '', long: `` },
    7: { short: '', long: `` },
    8: { short: '', long: `` },
    9: { short: '', long: `` },
    10: { short: '', long: `` },
    11: { short: '', long: `` },
    12: { short: '', long: `` },
  },

  Mars: {
    1: { short: '', long: `` },
    2: { short: '', long: `` },
    3: { short: '', long: `` },
    4: { short: '', long: `` },
    5: { short: '', long: `` },
    6: { short: '', long: `` },
    7: { short: '', long: `` },
    8: { short: '', long: `` },
    9: { short: '', long: `` },
    10: { short: '', long: `` },
    11: { short: '', long: `` },
    12: { short: '', long: `` },
  },

  Jupiter: {
    1: { short: '', long: `` },
    2: { short: '', long: `` },
    3: { short: '', long: `` },
    4: { short: '', long: `` },
    5: { short: '', long: `` },
    6: { short: '', long: `` },
    7: { short: '', long: `` },
    8: { short: '', long: `` },
    9: { short: '', long: `` },
    10: { short: '', long: `` },
    11: { short: '', long: `` },
    12: { short: '', long: `` },
  },

  Saturn: {
    1: { short: '', long: `` },
    2: { short: '', long: `` },
    3: { short: '', long: `` },
    4: { short: '', long: `` },
    5: { short: '', long: `` },
    6: { short: '', long: `` },
    7: { short: '', long: `` },
    8: { short: '', long: `` },
    9: { short: '', long: `` },
    10: { short: '', long: `` },
    11: { short: '', long: `` },
    12: { short: '', long: `` },
  },

  Uranus: {
    1: { short: '', long: `` },
    2: { short: '', long: `` },
    3: { short: '', long: `` },
    4: { short: '', long: `` },
    5: { short: '', long: `` },
    6: { short: '', long: `` },
    7: { short: '', long: `` },
    8: { short: '', long: `` },
    9: { short: '', long: `` },
    10: { short: '', long: `` },
    11: { short: '', long: `` },
    12: { short: '', long: `` },
  },

  Neptune: {
    1: { short: '', long: `` },
    2: { short: '', long: `` },
    3: { short: '', long: `` },
    4: { short: '', long: `` },
    5: { short: '', long: `` },
    6: { short: '', long: `` },
    7: { short: '', long: `` },
    8: { short: '', long: `` },
    9: { short: '', long: `` },
    10: { short: '', long: `` },
    11: { short: '', long: `` },
    12: { short: '', long: `` },
  },

  Pluto: {
    1: { short: '', long: `` },
    2: { short: '', long: `` },
    3: { short: '', long: `` },
    4: { short: '', long: `` },
    5: { short: '', long: `` },
    6: { short: '', long: `` },
    7: { short: '', long: `` },
    8: { short: '', long: `` },
    9: { short: '', long: `` },
    10: { short: '', long: `` },
    11: { short: '', long: `` },
    12: { short: '', long: `` },
  },
}