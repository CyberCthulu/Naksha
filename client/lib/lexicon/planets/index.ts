// lib/lexicon/planets/index.ts

import {
  Interpretation,
  PlanetKey,
  ZodiacName,
  maybe,
} from '../types'

/**
 * Map of planet → (sign → interpretation).
 * You can gradually expand this over time.
 */
export type PlanetSignLexicon = Partial<
  Record<PlanetKey, Partial<Record<ZodiacName, Interpretation>>>
>

// Helper to keep TS happy when building nested objects
const definePlanetLexicon = (lex: PlanetSignLexicon) => lex

export const PLANET_SIGN_MEANINGS: PlanetSignLexicon = definePlanetLexicon({
  /* ────────────────────────────────────────────────────────────
   * SUN IN SIGNS – core identity, vitality, “I am”
   * ────────────────────────────────────────────────────────── */

  Sun: {
    Aries: {
      short: 'Your core self is bold, direct, and wired for action.',
      long: `With your Sun in Aries, you’re built to initiate. You thrive when you’re moving toward a challenge, 
taking risks, and carving your own path rather than waiting for permission. You’re straightforward, impatient with 
stagnation, and often the first to speak or act.

Over time, the work is learning to pair your courage with emotional awareness and patience, so that your fire 
energizes your life and relationships rather than burning you out or burning bridges.`,
    },
    Taurus: {
      short: 'Your core self seeks stability, comfort, and tangible results.',
      long: `With your Sun in Taurus, you’re grounded and steady by nature. You like to build things that last—whether 
that’s relationships, finances, or a sense of inner security. Consistency and reliability are part of your strength.

You often move slowly and carefully, preferring to trust what you can see and touch. The growth edge is flexibility: 
learning when to release what’s no longer worth holding so that comfort doesn’t become stagnation.`,
    },
    Gemini: {
      short: 'Your core self is curious, adaptable, and mentally active.',
      long: `Sun in Gemini brings a restless, mercurial quality to your identity. You learn by exploring, talking, 
and trying on different perspectives. Variety keeps you alive—new ideas, new people, new environments.

Your gift is being able to connect dots and translate complex ideas into something understandable. The challenge is 
avoiding scattering your energy so thin that nothing gets your full presence.`,
    },
    Cancer: {
      short: 'Your core self is sensitive, protective, and deeply feeling.',
      long: `With your Sun in Cancer, you’re oriented toward emotional safety—for yourself and the people you care about. 
Nurturing, guarding, and caring are central themes. You often sense the mood of a room before anyone speaks.

You’re at your best when you allow your sensitivity to guide you without letting fear or defensiveness rule. 
Creating a home—internally or externally—where you can be vulnerable is a lifelong priority.`,
    },
    Leo: {
      short: 'Your core self is expressive, proud, and hungry to live fully.',
      long: `Sun in Leo shines through creativity, generosity, and a strong sense of personal identity. You’re here to 
be seen for who you truly are, and you often feel called to lead, perform, or inspire others through your presence.

When aligned, you radiate warmth and courage. The task is to honor your need for recognition without letting ego or 
drama dictate your choices, so that your light encourages others to shine too.`,
    },
    Virgo: {
      short: 'Your core self is analytical, service-oriented, and improvement-driven.',
      long: `With your Sun in Virgo, you naturally notice details, systems, and what could be refined. You’re often drawn 
to roles where you can be helpful, organized, and skillful. Competence and integrity matter deeply to you.

The growth path is softening perfectionism. When you allow yourself and others to be works-in-progress, your gift for 
practical wisdom becomes a source of healing rather than criticism.`,
    },
    Libra: {
      short: 'Your core self is relational, aesthetic, and tuned to balance.',
      long: `Sun in Libra orients you toward partnership and fairness. You’re sensitive to how others feel, and you often 
act as a mediator or bridge-builder. Beauty, harmony, and justice are central themes in your life.

Your challenge is remembering that your own desires matter just as much as keeping the peace. When you honor your own 
center, your diplomacy becomes a strength rather than a way to disappear.`,
    },
    Scorpio: {
      short: 'Your core self is intense, private, and transformation-focused.',
      long: `With your Sun in Scorpio, you’re drawn to depth rather than surface. You sense undercurrents and are rarely 
satisfied with small talk or quick answers. Loyalty, trust, and emotional truth are non-negotiable.

You carry strong regenerative power—able to move through endings and reinvent yourself. The work is learning to let go 
of control and to share your vulnerability, so intimacy can feel like a shared journey rather than a battlefield.`,
    },
    Sagittarius: {
      short: 'Your core self seeks meaning, freedom, and a bigger horizon.',
      long: `Sun in Sagittarius pushes you to explore—through travel, study, philosophy, or spiritual questions. 
You’re most alive when you have room to roam and the freedom to follow your curiosity wherever it leads.

Optimism and honesty are key traits, though bluntness can land hard. Over time, your path involves grounding your 
big visions in real-life follow-through, so wisdom doesn’t just stay theoretical.`,
    },
    Capricorn: {
      short: 'Your core self is ambitious, responsible, and long-term oriented.',
      long: `With your Sun in Capricorn, you’re wired for structure, strategy, and achievement. You tend to measure 
life in terms of effort, progress, and the legacy you’re building. Reliability and self-discipline are major strengths.

Yet there’s also a need to soften the internal pressure to constantly prove yourself. Allowing rest, humor, and 
emotional support into your life helps your success feel meaningful rather than exhausting.`,
    },
    Aquarius: {
      short: 'Your core self is independent, future-minded, and a bit unconventional.',
      long: `Sun in Aquarius tunes you into systems, communities, and the bigger picture. You’re often ahead of your time, 
interested in new ideas, technology, or social change. Freedom to think and live your way is crucial.

While you may feel emotionally detached at times, your underlying drive is often deeply humanitarian. The growth edge 
is balancing individuality with intimacy—letting people see the real you, not just the ideas you carry.`,
    },
    Pisces: {
      short: 'Your core self is sensitive, imaginative, and porous to the unseen.',
      long: `With your Sun in Pisces, you’re attuned to subtle realities—emotion, energy, symbolism, and dreams. 
Empathy and creativity flow naturally, and you may feel life more like an ocean than a straight line.

Your task is learning boundaries: how to stay open-hearted without dissolving into other people’s feelings or 
fantasy. When grounded, your compassion and imagination become true spiritual and artistic strengths.`,
    },
  },

  /* ────────────────────────────────────────────────────────────
   * MOON IN SIGNS – emotional needs, instinctive responses
   * ────────────────────────────────────────────────────────── */

  Moon: {
    Aries: {
      short: 'Emotionally, you crave honesty, excitement, and direct engagement.',
      long: `With your Moon in Aries, feelings tend to arrive fast and hot. You process emotion through action—doing 
something about it, not just thinking about it. You need room to react honestly and then move on.

Learning to pause before acting, and to consider others’ sensitivities, helps you express your passion without unnecessary conflict.`,
    },
    Taurus: {
      short: 'You need calm, comfort, and predictability to feel emotionally safe.',
      long: `Moon in Taurus seeks a steady emotional landscape. You soothe yourself through sensory experiences—good food, 
touch, music, beautiful surroundings. Sudden change can feel especially jarring.

Your emotional resilience is strong, but watch for getting stuck in patterns just because they’re familiar. Growth comes 
from trusting that stability can coexist with change.`,
    },
    Gemini: {
      short: 'You process emotions by talking, thinking, and staying mentally engaged.',
      long: `With your Moon in Gemini, feelings often show up as thoughts, questions, or the urge to communicate. You feel 
better when you can name what’s happening, talk it out, or distract yourself with ideas and variety.

Creating space to actually feel—rather than just analyze—gives your heart as much airtime as your mind.`,
    },
    Cancer: {
      short: 'You’re deeply sensitive and need emotional safety and belonging.',
      long: `Moon in Cancer is at home in the realm of feelings. You absorb the emotional climate around you, and you’re 
often the caretaker or emotional anchor in your circles. Family (chosen or biological) deeply impacts your inner world.

The lifelong task is learning to nurture yourself as fiercely as you nurture others, and to set boundaries that protect 
your energy.`,
    },
    Leo: {
      short: 'You need warmth, appreciation, and room to express your heart.',
      long: `With your Moon in Leo, emotional fulfillment comes from feeling seen, valued, and loved for who you are. You 
tend to give generously of your attention and loyalty and may feel hurt if that warmth isn’t reciprocated.

Healthy outlets for creativity and play help your heart feel full, beyond external validation alone.`,
    },
    Virgo: {
      short: 'You find emotional security through order, usefulness, and clear understanding.',
      long: `Moon in Virgo often feels safest when life is organized and problems are being addressed. You may respond to 
stress by analyzing, fixing, or improving something. Being helpful can be a core emotional language.

The invitation is to accept that not everything can be optimized—and that you deserve care even when things (or you) 
are imperfect.`,
    },
    Libra: {
      short: 'You need harmony, fairness, and connection to feel emotionally balanced.',
      long: `With your Moon in Libra, conflict can feel especially destabilizing. You often prioritize others’ needs or the 
“vibe” of the relationship to keep peace, sometimes at the expense of your own feelings.

Your growth edge is expressing what you actually feel and want, trusting that real harmony includes your truth too.`,
    },
    Scorpio: {
      short: 'You experience emotions intensely and need depth, not surface-level connection.',
      long: `Moon in Scorpio feels everything strongly, even if little is shown outwardly. You may be private, protective, 
or suspicious when it comes to vulnerability. Emotional trust is earned, not given quickly.

Transformative healing is possible when you allow yourself to be seen by people who prove safe, letting connection soften 
the need for control.`,
    },
    Sagittarius: {
      short: 'You need freedom, honesty, and a sense of possibility to feel okay.',
      long: `With your Moon in Sagittarius, you instinctively zoom out when emotions get heavy, searching for the lesson or 
bigger meaning. Travel, movement, humor, and learning are emotional medicine for you.

The work is staying present with discomfort long enough to truly process it, instead of only rising above it with optimism.`,
    },
    Capricorn: {
      short: 'You’re emotionally serious and feel safer with structure and reliability.',
      long: `Moon in Capricorn often learns early to “hold it together.” You may default to being the responsible one, 
containing your emotions so things don’t fall apart. Achievement and productivity can become emotional armor.

Softening into support, rest, and vulnerability—without feeling weak—becomes a core part of your emotional evolution.`,
    },
    Aquarius: {
      short: 'You need space, mental stimulation, and authenticity in your emotional world.',
      long: `With your Moon in Aquarius, you may process feelings through ideas, theories, or community involvement rather 
than through overt displays of emotion. You often crave both connection and independence at the same time.

Allowing yourself to feel “illogical” feelings, and to let trusted people in past the cool exterior, creates deeper emotional fulfillment.`,
    },
    Pisces: {
      short: 'You’re emotionally porous, intuitive, and easily moved by the unseen.',
      long: `Moon in Pisces can feel like living with an emotional tuning fork. You pick up moods, atmospheres, and subtle 
signals, sometimes without realizing it. Escapism, fantasy, or caretaking can become coping strategies.

Grounding practices, creative outlets, and healthy emotional boundaries help you channel your sensitivity into compassion 
rather than overwhelm.`,
    },
  },

  /* ────────────────────────────────────────────────────────────
   * OTHER PLANETS – placeholders to fill later
   * ────────────────────────────────────────────────────────── */

  Mercury: {
    Aries: {
      short: '',
      long: '',
    },
    Taurus: {
      short: '',
      long: '',
    },
    Gemini: {
      short: '',
      long: '',
    },
    Cancer: {
      short: '',
      long: '',
    },
    Leo: {
      short: '',
      long: '',
    },
    Virgo: {
      short: '',
      long: '',
    },
    Libra: {
      short: '',
      long: '',
    },
    Scorpio: {
      short: '',
      long: '',
    },
    Sagittarius: {
      short: '',
      long: '',
    },
    Capricorn: {
      short: '',
      long: '',
    },
    Aquarius: {
      short: '',
      long: '',
    },
    Pisces: {
      short: '',
      long: '',
    },
  },

  Venus: {
    Aries: {
      short: 'TODO: Venus in Aries short meaning.',
      long: 'TODO: Venus in Aries long meaning.',
    },
    // ...etc.
  },

  Mars: {
    Aries: {
      short: 'TODO: Mars in Aries short meaning.',
      long: 'TODO: Mars in Aries long meaning.',
    },
  },

  Jupiter: {},
  Saturn: {},
  Uranus: {},
  Neptune: {},
  Pluto: {},
})

export function getPlanetSignMeaning(
  planet: PlanetKey,
  sign: ZodiacName
): Interpretation | null {
  const planetBlock = PLANET_SIGN_MEANINGS[planet]
  if (!planetBlock) return null
  return maybe(planetBlock[sign])
}
