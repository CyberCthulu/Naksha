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
      long: `With the Moon in Cancer, a need for emotional safety may express itself through care, memory, and close bonds. You absorb the emotional climate around you, and you’re
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
 * MERCURY IN SIGNS – thinking style, communication, perception
 * ────────────────────────────────────────────────────────── */

Mercury: {
  Aries: {
    short: 'Your mind is fast, direct, and driven by instinct.',
    long: `With Mercury in Aries, your thoughts move quickly and decisively. You tend to speak as soon as an idea forms, valuing honesty and speed over polish. You’re mentally courageous—willing to say what others hesitate to—and you often thrive in debates or situations that require rapid decisions.

Your challenge is learning to slow down long enough to listen and refine your ideas. While your mental fire is a strength, impulsive words can sometimes spark unnecessary conflict. When channeled with awareness, your mind becomes a powerful initiator—cutting through confusion and inspiring action.`
  },

  Taurus: {
    short: 'Your thinking is steady, practical, and grounded in reality.',
    long: `Mercury in Taurus gives you a deliberate, patient mind. You prefer ideas that are useful, tangible, and proven over abstract theories. Once you form an opinion, it tends to stick—you think things through carefully before speaking.

You communicate best when you have time to process, and you often express yourself clearly and calmly. The growth edge is flexibility: learning when to reconsider or adapt instead of holding onto ideas simply because they feel safe or familiar.`
  },

  Gemini: {
    short: 'Your mind is curious, quick, and constantly making connections.',
    long: `Mercury in Gemini approaches ideas through questions, exchange, and quick connections. You think in webs rather than lines—connecting ideas, people, and perspectives with ease. Conversation, learning, and variety keep your mind alive.

You’re skilled at explaining complex ideas simply, but your challenge is focus. With so many interests, it’s easy to skim the surface rather than dive deep. When you learn to sustain attention, your intellect becomes exceptionally versatile and sharp.`
  },

  Cancer: {
    short: 'Your thinking is intuitive, emotional, and memory-driven.',
    long: `With Mercury in Cancer, your mind is closely tied to your feelings. You remember things emotionally—tone, atmosphere, and personal significance matter more than raw facts. You often sense what’s being said beneath the words.

You communicate best in safe, familiar environments and may be cautious about sharing your thoughts openly. The growth lies in expressing your inner world without retreating into defensiveness, trusting that your emotional intelligence is a strength, not a liability.`
  },

  Leo: {
    short: 'Your mind is expressive, confident, and creative.',
    long: `Mercury in Leo brings a dramatic, heartfelt quality to your thinking and speech. You communicate with warmth and conviction, often using storytelling or creative expression to make your point. You like your ideas to be seen, heard, and appreciated.

Your challenge is staying open to other viewpoints when your pride gets involved. When balanced, your voice becomes inspiring—capable of motivating others through authenticity, enthusiasm, and genuine self-expression.`
  },

  Virgo: {
    short: 'Your mind is analytical, precise, and detail-oriented.',
    long: `Mercury in Virgo sharpens your perception. You naturally notice patterns, inconsistencies, and areas for improvement. Problem-solving, organizing, and refining ideas come easily to you, and you often think in practical steps.

The shadow side can be overthinking or self-criticism. Learning when “good enough” truly is enough allows your mental clarity to serve healing and efficiency rather than anxiety or perfectionism.`
  },

  Libra: {
    short: 'Your thinking is balanced, relational, and fairness-oriented.',
    long: `With Mercury in Libra, your mind seeks harmony. You naturally consider multiple perspectives and often act as a mediator or translator between differing viewpoints. Words matter to you—you strive for diplomacy and grace in communication.

The challenge is decisiveness. Weighing every option can lead to mental hesitation. When you trust your own judgment alongside others’ input, your thinking becomes both fair and effective.`
  },

  Scorpio: {
    short: 'Your mind is penetrating, investigative, and emotionally perceptive.',
    long: `Mercury in Scorpio gives you a mind that cuts beneath the surface. You’re less interested in what’s obvious and more drawn to what’s hidden—motives, power dynamics, emotional truth. You think deeply and intensely.

You may keep your thoughts private, sharing only with those you trust. The work is using your insight constructively rather than defensively. When balanced, your perception becomes a powerful tool for transformation and psychological understanding.`
  },

  Sagittarius: {
    short: 'Your thinking is expansive, philosophical, and future-oriented.',
    long: `With Mercury in Sagittarius, your mind is driven by meaning. You think in big pictures, seeking truth, wisdom, and understanding rather than details. Learning through experience—travel, stories, belief systems—feeds your intellect.

Blunt honesty can be both a strength and a challenge. Refining how you express your truths helps your insights land with inspiration rather than overwhelm.`
  },

  Capricorn: {
    short: 'Your mind is structured, strategic, and goal-oriented.',
    long: `Mercury in Capricorn approaches thinking as a responsibility. You value logic, planning, and long-term usefulness. Your communication tends to be measured and purposeful—you speak when there’s something worth saying.

The challenge is allowing flexibility and creativity into your mental world. When you soften rigid thinking, your intellect becomes a powerful architect—capable of building ideas that endure.`
  },

  Aquarius: {
    short: 'Your thinking is innovative, unconventional, and future-focused.',
    long: `With Mercury in Aquarius, your mind naturally questions norms and explores new ideas. You think in systems, patterns, and concepts that extend beyond personal experience. Originality and independence are key to your mental process.

You may sometimes seem detached, but your thinking often serves a larger vision. Balancing intellect with emotional awareness helps your ideas connect more deeply with others.`
  },

  Pisces: {
    short: 'Your mind is imaginative, intuitive, and symbolic.',
    long: `Mercury in Pisces thinks in images, feelings, and impressions rather than strict logic. You absorb information subtly, often understanding things before you can articulate them. Creativity and intuition guide your mental flow.

The challenge is clarity. Grounding your insights in structure helps prevent confusion or overwhelm. When balanced, your mind becomes a bridge between imagination and meaning, logic and empathy.`
  },
},


/* ────────────────────────────────────────────────────────────
 * VENUS IN SIGNS – love style, attraction, values, pleasure
 * ────────────────────────────────────────────────────────── */

Venus: {
  Aries: {
    short: 'You love boldly, directly, and with excitement.',
    long: `With Venus in Aries, attraction is immediate and passionate. You’re drawn to sparks, confidence, and the thrill of pursuit. In love, you value honesty and momentum—relationships need to feel alive, not stagnant.

You tend to fall fast and express affection openly, sometimes impulsively. The challenge is patience: learning that lasting connection doesn’t require constant intensity. When balanced, your love style is courageous, refreshing, and energizing to others.`
  },

  Taurus: {
    short: 'You love steadily, sensually, and with deep loyalty.',
    long: `Venus in Taurus expresses affection and values through comfort, steadiness, and physical presence. You value consistency and tend to show love through touch, reliability, and shared pleasures. Once you commit, you’re deeply devoted.

You’re drawn to what feels safe and beautiful, but the growth edge is flexibility—learning when to let go rather than holding on out of comfort alone. Your love is a grounding force when trust is established.`
  },

  Gemini: {
    short: 'You love through conversation, curiosity, and mental connection.',
    long: `With Venus in Gemini, attraction begins in the mind. You’re drawn to wit, ideas, and people who keep you mentally engaged. Variety, humor, and communication are essential to feeling connected.

You may struggle with boredom or restlessness if a relationship becomes too predictable. Learning to stay present rather than constantly seeking novelty allows your playful, curious love style to deepen into something lasting.`
  },

  Cancer: {
    short: 'You love protectively, emotionally, and with deep care.',
    long: `Venus in Cancer seeks emotional safety and closeness. You bond through nurturing, shared memories, and a sense of belonging. Love often feels tied to home, family, or emotional familiarity.

You’re sensitive to shifts in connection and may withdraw if you feel unsafe. The work is trusting that vulnerability doesn’t always lead to loss. When secure, your love is profoundly comforting and loyal.`
  },

  Leo: {
    short: 'You love passionately and want to feel chosen and cherished.',
    long: `With Venus in Leo, love is expressive and wholehearted. You enjoy romance, affection, and feeling special to your partner—and you give generously in return. Creativity and play are important expressions of love for you.

The challenge is separating genuine connection from validation-seeking. When balanced, your warmth and enthusiasm make others feel seen, valued, and inspired to love boldly too.`
  },

  Virgo: {
    short: 'You love through care, attentiveness, and meaningful effort.',
    long: `Venus in Virgo expresses affection through practical acts—helping, listening, and showing up consistently. You value sincerity and integrity over grand gestures, often demonstrating love in subtle but meaningful ways.

You may be selective or cautious in relationships, noticing imperfections easily. Learning to soften self-criticism and accept love without needing to earn it allows your devotion to feel nurturing rather than anxious.`
  },

  Libra: {
    short: 'You love harmoniously and seek balance and mutual respect.',
    long: `Venus in Libra may express attraction and affection through comparison and negotiation, seeking a balance between your preferences and someone else’s. You value fairness, beauty, and emotional reciprocity; partnership can bring both these values and their compromises into sharper focus. Romance, shared aesthetics, and emotional equality matter deeply to you.

The challenge is not losing yourself in the relationship. When you honor your own needs as much as the bond itself, your love becomes graceful, supportive, and deeply connective.`
  },

  Scorpio: {
    short: 'You love intensely, deeply, and with emotional commitment.',
    long: `With Venus in Scorpio, love is never casual. You seek depth, honesty, and emotional fusion, often forming powerful bonds. Trust and loyalty are essential, and betrayal cuts deeply.

You may struggle with control or fear of vulnerability. Growth comes from allowing intimacy without guarding every emotional edge. When aligned, your love is transformative, passionate, and profoundly loyal.`
  },

  Sagittarius: {
    short: 'You love freely and are drawn to growth and adventure.',
    long: `Venus in Sagittarius values honesty, exploration, and shared meaning. You’re attracted to people who expand your worldview and respect your need for independence. Love should feel inspiring, not confining.

Commitment works best when it allows space for growth. Learning to balance freedom with emotional presence helps your love stay expansive without becoming evasive.`
  },

  Capricorn: {
    short: 'You love seriously and value commitment and reliability.',
    long: `With Venus in Capricorn, you approach relationships thoughtfully and with intention. You value maturity, loyalty, and long-term potential over fleeting attraction. Love is something you build, not rush.

You may guard your heart carefully, opening slowly over time. Allowing warmth and vulnerability alongside responsibility helps your love feel emotionally fulfilling, not just secure.`
  },

  Aquarius: {
    short: 'You love uniquely and value freedom and authenticity.',
    long: `Venus in Aquarius is drawn to individuality and unconventional connection. You value friendship, equality, and shared ideals in love, often needing space to remain yourself within a relationship.

Emotional detachment can be a defense. Letting others see your feelings—not just your ideas—creates deeper bonds while preserving your independence.`
  },

  Pisces: {
    short: 'You love romantically, compassionately, and without boundaries.',
    long: `Venus in Pisces loves in an all-encompassing way. You’re deeply empathetic, idealistic, and sensitive to emotional nuance. Love can feel spiritual, artistic, or transcendent.

The challenge is discernment—seeing partners clearly rather than through fantasy. When grounded, your love becomes a source of profound healing, creativity, and unconditional compassion.`
  },
},



/* ────────────────────────────────────────────────────────────
 * MARS IN SIGNS – drive, desire, action, anger, boundaries
 * ────────────────────────────────────────────────────────── */

Mars: {
  Aries: {
    short: 'You act quickly, assert boldly, and trust your instincts.',
    long: `Mars in Aries is pure forward motion. You’re driven to act immediately and decisively, often relying on instinct rather than overthinking. Competition, challenge, and momentum fuel your energy.

Anger tends to surface fast but burn out just as quickly. The work is learning when to pause before reacting, so your courage becomes focused leadership rather than impulsive conflict.`
  },

  Taurus: {
    short: 'You move steadily and resist being rushed or pushed.',
    long: `With Mars in Taurus, your drive is slow but powerful. Once committed, you’re incredibly persistent and difficult to deter. You prefer tangible progress and tend to conserve energy until it truly matters.

Anger builds gradually and can be stubborn when provoked. Learning flexibility and timely expression helps prevent pressure from turning into resentment.`
  },

  Gemini: {
    short: 'You act through ideas, words, and mental agility.',
    long: `Mars in Gemini channels energy into communication and movement. You’re motivated by curiosity, debate, and variety, often juggling multiple interests at once. Quick thinking and adaptability are key strengths.

Frustration may show up as scattered energy or sharp words. Learning to focus your drive helps turn mental stimulation into meaningful progress.`
  },

  Cancer: {
    short: 'You act protectively and are driven by emotional security.',
    long: `With Mars in Cancer, your actions are influenced by feelings and emotional safety. You’re motivated to protect yourself and those you care about, often acting behind the scenes rather than directly.

Anger can be indirect or suppressed, surfacing later as moodiness. Developing clear boundaries and direct expression allows your drive to feel empowered instead of defensive.`
  },

  Leo: {
    short: 'You act confidently and want to be seen for your efforts.',
    long: `Mars in Leo thrives on passion, creativity, and recognition. You’re motivated by pride and the desire to express yourself boldly. Leadership and performance often come naturally.

Anger may flare when you feel disrespected or overlooked. Channeling your fire into purposeful action rather than ego-driven reaction strengthens your influence.`
  },

  Virgo: {
    short: 'You act thoughtfully and are driven to improve and refine.',
    long: `With Mars in Virgo, your energy is focused on precision and usefulness. You’re motivated by solving problems and making things work better. Effort is often quiet but effective.

Anger can turn inward as self-criticism. Learning to release perfectionism and trust imperfect action helps your drive feel constructive rather than exhausting.`
  },

  Libra: {
    short: 'You act diplomatically and seek fairness in conflict.',
    long: `Mars in Libra prefers cooperation over confrontation. You’re motivated by balance, justice, and mutual respect, often weighing options carefully before acting.

Anger may be delayed or internalized to avoid tension. Developing assertiveness helps you express needs clearly without sacrificing harmony.`
  },

  Scorpio: {
    short: 'You act intensely and with deep emotional commitment.',
    long: `With Mars in Scorpio, your drive is powerful, focused, and relentless. You pursue goals with emotional intensity and rarely act without purpose. Endurance is a defining strength.

Anger can become consuming if held too tightly. Learning to release control and trust transformation allows your drive to be regenerative rather than destructive.`
  },

  Sagittarius: {
    short: 'You act boldly and are driven by freedom and meaning.',
    long: `Mars in Sagittarius seeks movement, exploration, and truth. You’re motivated by big ideas and the desire to expand your horizons. Optimism fuels your action.

Anger may erupt when you feel confined or restricted. Learning follow-through and patience helps turn enthusiasm into lasting achievement.`
  },

  Capricorn: {
    short: 'You act strategically and are driven by long-term goals.',
    long: `With Mars in Capricorn, discipline and ambition define your approach. You’re motivated by achievement and willing to work patiently toward success. Endurance and responsibility are core strengths.

Anger may be suppressed in favor of control. Allowing yourself emotional release alongside determination keeps your drive sustainable.`
  },

  Aquarius: {
    short: 'You act independently and are driven by ideals and innovation.',
    long: `Mars in Aquarius channels energy into originality and change. You’re motivated by ideas, causes, and the desire to challenge outdated systems. Independence is essential to your drive.

Anger may detach into rebellion or aloofness. Learning to stay emotionally present while advocating for change strengthens your impact.`
  },

  Pisces: {
    short: 'You act intuitively and are driven by emotion and imagination.',
    long: `With Mars in Pisces, motivation flows from feeling rather than force. You’re guided by intuition, creativity, and compassion, often acting subtly rather than directly.

Anger can dissolve into avoidance or confusion. Developing grounding practices and clear direction helps your energy manifest with purpose instead of drifting.`
  },
},


/* ────────────────────────────────────────────────────────────
 * JUPITER IN SIGNS – growth, belief, meaning, optimism
 * ────────────────────────────────────────────────────────── */

Jupiter: {
  Aries: {
    short: 'You grow by taking risks and trusting your courage.',
    long: `Jupiter in Aries expands through boldness and initiative. You believe in yourself most when you’re moving forward, starting something new, or standing on your own feet. Confidence grows through action.

The challenge is impulsive overconfidence. Learning when to pause and consider others allows your enthusiasm to inspire rather than overwhelm.`
  },

  Taurus: {
    short: 'You grow through stability, patience, and tangible value.',
    long: `With Jupiter in Taurus, expansion comes slowly and steadily. You believe in growth that lasts—building security, comfort, and resources over time. Faith is rooted in consistency and reliability.

The growth edge is flexibility. Letting go of what feels safe but limiting allows abundance to keep flowing rather than stagnating.`
  },

  Gemini: {
    short: 'You grow by learning, questioning, and exchanging ideas.',
    long: `Jupiter in Gemini expands through curiosity and communication. You thrive when gathering information, sharing perspectives, and staying mentally engaged. Variety feeds your sense of meaning.

The challenge is superficiality. Focusing your learning helps transform scattered knowledge into true wisdom.`
  },

  Cancer: {
    short: 'You grow through emotional connection and belonging.',
    long: `With Jupiter in Cancer, expansion happens through care, empathy, and emotional security. You believe in the power of nurturing—family, home, and chosen communities are sources of faith.

The work is balancing protection with openness. Growth deepens when you allow emotional risk alongside safety.`
  },

  Leo: {
    short: 'You grow through self-expression, creativity, and confidence.',
    long: `Jupiter in Leo expands through visibility and joy. You believe life is meant to be lived fully and generously, often inspiring others through your enthusiasm and warmth.

The challenge is ego inflation. When confidence is shared rather than centered only on self, your light becomes truly expansive.`
  },

  Virgo: {
    short: 'You grow by being useful, skilled, and of service.',
    long: `With Jupiter in Virgo, expansion comes through refinement and practical contribution. You believe in progress made through effort, precision, and improvement.

The growth edge is releasing perfectionism. Trusting the bigger picture allows you to see how small acts of service create meaningful impact.`
  },

  Libra: {
    short: 'You grow through relationships, balance, and fairness.',
    long: `Jupiter in Libra expands through cooperation and mutual understanding. You believe growth happens when perspectives are shared and harmony is cultivated.

The challenge is indecision or people-pleasing. True expansion comes when you honor your own truth alongside others’.`
  },

  Scorpio: {
    short: 'You grow through depth, truth, and transformation.',
    long: `With Jupiter in Scorpio, expansion comes from facing what others avoid. You believe in emotional honesty, healing, and profound inner change.

The risk is obsession or extremity. Growth becomes sustainable when intensity is paired with trust and emotional release.`
  },

  Sagittarius: {
    short: 'You grow through exploration, truth, and big-picture thinking.',
    long: `Jupiter in Sagittarius seeks a wider horizon for belief and possibility. Travel, philosophy, and spiritual questions can invite you to test what you know against what you have yet to experience. Optimism can help you take chances, though conviction can also make it harder to hear a challenge.

The challenge is excess or restlessness. Grounding wisdom in lived experience turns belief into genuine understanding.`
  },

  Capricorn: {
    short: 'You grow through discipline, responsibility, and achievement.',
    long: `With Jupiter in Capricorn, expansion is earned through effort and structure. You believe in long-term success and respect systems that reward dedication.

The work is allowing joy alongside ambition. Growth feels richer when achievement is balanced with fulfillment and connection.`
  },

  Aquarius: {
    short: 'You grow through innovation, ideas, and collective progress.',
    long: `Jupiter in Aquarius expands through originality and social awareness. You believe in progress, equality, and the power of new ideas to reshape the future.

The challenge is detachment. Staying emotionally engaged helps your vision remain humane as well as revolutionary.`
  },

  Pisces: {
    short: 'You grow through compassion, imagination, and faith.',
    long: `With Jupiter in Pisces, expansion flows through spirituality, creativity, and empathy. You believe in unseen connections and often trust life to unfold intuitively.

The risk is escapism or blind faith. Grounding your compassion in reality allows your sensitivity to become a true source of wisdom.`
  },
},


/* ────────────────────────────────────────────────────────────
 * SATURN IN SIGNS – responsibility, discipline, life lessons
 * ────────────────────────────────────────────────────────── */

Saturn: {
  Aries: {
    short: 'You learn patience, confidence, and self-trust through action.',
    long: `With Saturn in Aries, lessons revolve around courage and self-assertion. You may have felt blocked or hesitant about taking initiative early in life, learning through trial and error how to trust yourself.

Over time, discipline strengthens your confidence. True leadership emerges when impulsiveness gives way to purposeful action.`
  },

  Taurus: {
    short: 'You learn security through patience and self-worth.',
    long: `Saturn in Taurus teaches lessons around stability, resources, and self-value. You may experience delays or pressure related to money, comfort, or feeling safe.

Through persistence and steady effort, you build lasting foundations. Learning that worth is not only material brings deeper fulfillment.`
  },

  Gemini: {
    short: 'You learn clarity, focus, and confidence in communication.',
    long: `With Saturn in Gemini, communication and learning may feel serious or demanding early on. You may have doubted your voice or felt misunderstood.

Mastery comes through practice and structure. Over time, your words gain authority, and your thinking becomes both sharp and reliable.`
  },

  Cancer: {
    short: 'You learn emotional responsibility and inner security.',
    long: `Saturn in Cancer brings lessons around vulnerability, family, and emotional safety. You may have learned early to protect yourself or take on emotional responsibility for others.

With maturity, you develop strong emotional boundaries and become a source of quiet strength and stability for those you care about.`
  },

  Leo: {
    short: 'You learn confidence through humility and authenticity.',
    long: `With Saturn in Leo, self-expression and recognition may feel blocked or delayed. You may question whether it’s safe to be seen or celebrated.

Through patience and self-acceptance, confidence grows naturally. Your leadership becomes grounded, respected, and earned rather than forced.`
  },

  Virgo: {
    short: 'You learn self-acceptance beyond perfectionism.',
    long: `Saturn in Virgo emphasizes responsibility, precision, and service. You may place high standards on yourself, feeling pressure to be useful or flawless.

Over time, wisdom comes from accepting imperfection. Your ability to serve becomes healing rather than self-critical.`
  },

  Libra: {
    short: 'You learn balance, commitment, and healthy boundaries in relationships.',
    long: `With Saturn in Libra, relationships carry weight and lessons. You may feel tested through partnerships or struggle with fairness and decision-making.

Maturity brings the ability to commit wisely, creating relationships built on mutual respect rather than obligation.`
  },

  Scorpio: {
    short: 'You learn trust, surrender, and emotional resilience.',
    long: `Saturn in Scorpio brings intense lessons around control, intimacy, and emotional truth. You may face deep fears related to loss, power, or vulnerability.

Strength develops through facing discomfort directly. Over time, you gain profound emotional wisdom and inner authority.`
  },

  Sagittarius: {
    short: 'You learn wisdom through experience rather than belief alone.',
    long: `With Saturn in Sagittarius, faith and meaning are tested. You may question belief systems or feel restricted in freedom early on.

True wisdom develops when ideals are grounded in real-world experience. Your perspective becomes steady, honest, and deeply informed.`
  },

  Capricorn: {
    short: 'You learn mastery, responsibility, and self-respect.',
    long: `With Saturn in Capricorn, responsibility often takes the form of long-term goals, clear standards, and patient effort. Life may feel demanding early, with heavy responsibilities or high expectations.

As you work with long-term commitments, you may develop practical mastery and a steadier sense of authority over your own choices. If you take on leadership, accountability can matter more than recognition.`
  },

  Aquarius: {
    short: 'You learn individuality while honoring collective responsibility.',
    long: `With Saturn in Aquarius, lessons revolve around belonging and authenticity. You may feel like an outsider or struggle to balance independence with community.

Maturity brings the ability to contribute uniquely while remaining connected, turning innovation into meaningful impact.`
  },

  Pisces: {
    short: 'You learn boundaries, faith, and emotional grounding.',
    long: `Saturn in Pisces teaches lessons around sensitivity, compassion, and surrender. You may feel overwhelmed by emotions or uncertain where you end and others begin.

With time, you develop spiritual strength and emotional boundaries, allowing empathy to exist without self-sacrifice.`
  },
},


/* ────────────────────────────────────────────────────────────
 * URANUS IN SIGNS – awakening, innovation, breaking patterns
 * ────────────────────────────────────────────────────────── */

Uranus: {
  Aries: {
    short: 'A shared urge to break patterns through bold, independent action.',
    long: `Uranus in Aries places disruption in the realm of initiative: established ideas about who gets to act first, take risks, or claim independence come under pressure. Sudden beginnings can open possibilities that caution would miss.

The same urgency can make revolt an end in itself. Its constructive form pairs courage with enough patience to see a new direction through.`
  },

  Taurus: {
    short: 'Innovation presses against inherited ideas of security and value.',
    long: `Uranus in Taurus brings change to the systems people count on for stability: money, resources, ownership, and the material habits of everyday life. A shared attachment to what feels solid meets an impulse to make it work differently.

Practical invention can widen access and resilience; change pursued only for shock can unsettle what people need. The deeper question is which foundations deserve protection and which can be rebuilt.`
  },

  Gemini: {
    short: 'Disruption reshapes how information is learned and exchanged.',
    long: `Uranus in Gemini unsettles familiar channels of thought, language, and exchange. New ways of connecting ideas can make learning more open and communication more inventive, especially when established categories feel too narrow.

The pace can also reward novelty over understanding. A flash of insight gains force when it is tested, explained, and made useful to others.`
  },

  Cancer: {
    short: 'Shared ideas of home and care make room for new forms of belonging.',
    long: `Uranus in Cancer challenges inherited models of family, shelter, and emotional security. New forms of care can allow more freedom than familiar roles or domestic arrangements permit.

The tension is between protecting bonds and refusing constraints that have become stifling. A new meaning of home still needs room for dependable care.`
  },

  Leo: {
    short: 'Creative conventions meet a collective appetite for originality.',
    long: `Uranus in Leo questions who gets to be seen and which forms of art or performance count as authentic. Instead of merely performing inherited roles, creative experiments can remake the roles themselves and open space for unfamiliar voices.

Visibility can become its own demand, though, and shock can replace substance. The creative impulse gains depth when the work matters beyond the reaction it provokes.`
  },

  Virgo: {
    short: 'Everyday systems become a field for practical innovation.',
    long: `Uranus in Virgo brings experimentation to work, routines, and the methods used to solve ordinary problems. A cohort may question whether established measures of efficiency actually serve the people who live with them.

Careful redesign can make useful systems more adaptable. Constant optimization, however, can make daily life feel like a problem that never ends. A useful change gives people more room to work, not just a higher standard they must meet.`
  },

  Libra: {
    short: 'Relationship norms are tested against freedom and fairness.',
    long: `Uranus in Libra questions the social agreements that define partnership, reciprocity, and what counts as fair. A cohort may experiment with new ways of relating when familiar roles leave too little room for equality or independence.

Change can make connection more honest, but treating every commitment as a limit can weaken trust. Freedom in a relationship still has to make room for mutual consideration.`
  },

  Scorpio: {
    short: 'Unsettling insights challenge old rules around power and intimacy.',
    long: `Uranus in Scorpio disrupts what a culture keeps private about desire, dependency, control, and loss. Sudden exposure of a hidden arrangement can invite greater honesty about how power moves between people.

Breaking secrecy is not the same as earning trust; revelation without care can become another form of control. Its insight is most useful when paired with respect for boundaries.`
  },

  Sagittarius: {
    short: 'A shared challenge to settled beliefs opens new horizons.',
    long: `Uranus in Sagittarius puts innovation into belief, education, travel, and the stories people use to explain the world. A cohort may cross inherited boundaries in search of a wider view.

An open horizon can sharpen inquiry, while reflexively rejecting every tradition can make novelty another dogma. Exploration has more depth when it risks revising its own assumptions, not only those it inherited.`
  },

  Capricorn: {
    short: 'Established structures face pressure to become more adaptable.',
    long: `Uranus in Capricorn brings disruption to institutions, authority, and inherited measures of success. A system built to endure may become too rigid to meet present needs.

Reform can make structures more humane and durable; rebellion without a workable replacement can leave people unsupported. Lasting innovation has to carry responsibility as well as break with the past.`
  },

  Aquarius: {
    short: 'Collective systems invite experiments in freedom and belonging.',
    long: `Uranus in Aquarius can challenge the habits and rules that shape groups, institutions, and shared futures. Networks may create new forms of participation when membership no longer has to mean conformity.

The same distance that makes a system easier to question can make its human costs easier to miss. If this placement is personally emphasized, originality works best when it remains accountable to the people affected by change.`
  },

  Pisces: {
    short: 'Unconventional visions unsettle fixed ideas of faith and imagination.',
    long: `Uranus in Pisces brings change to shared spiritual language, artistic imagination, and ways of understanding experiences that resist literal explanation. Unusual images or intuitions can open a culture to possibilities it had dismissed.

Insight still needs discernment: a startling feeling is not proof on its own. Grounding inspiration in observation or craft helps make an unusual vision communicable.`
  },
},


/* ────────────────────────────────────────────────────────────
 * NEPTUNE IN SIGNS – dreams, intuition, illusion, spirituality
 * ────────────────────────────────────────────────────────── */

Neptune: {
  Aries: {
    short: 'A shared ideal of courage gives inspiration a forward edge.',
    long: `Neptune in Aries gives a cohort images of the brave initiator: someone who acts before certainty arrives. That vision can inspire needed beginnings, especially when people have been taught to wait for permission.

It can also blur the line between conviction and impulse, or turn independence into an ideal no one can live up to. The useful question is what a bold vision asks people to do in practice.`
  },

  Taurus: {
    short: 'Beauty and material security become vessels for shared longing.',
    long: `Neptune in Taurus blends imagination with the tangible: land, food, art, money, and the comforts people hope will make life feel safe. Sensory experience can seem transcendent, and a more generous material order can feel imaginable.

Beauty can restore attention to what sustains life. It can also make possessions stand in for peace, especially when comfort is asked to answer needs it cannot meet.`
  },

  Gemini: {
    short: 'Language carries shared dreams, symbols, and elusive meanings.',
    long: `Neptune in Gemini places collective ideals in language, media, and the exchange of ideas. Metaphor and storytelling can carry meanings that plain facts alone struggle to hold.

The same openness can let suggestion pass for evidence or blur what was actually said. Imaginative communication benefits from checking a compelling impression against clear information.`
  },

  Cancer: {
    short: 'Collective images of home and care carry powerful longing.',
    long: `Neptune in Cancer invests home, family, and belonging with an ideal of unconditional shelter. This can widen compassion for people who lack safety or a place to belong.

An imagined perfect home can also hide the ordinary limits and negotiations that real care requires. Warmth is more sustainable when it does not ask one person to carry every feeling nearby.`
  },

  Leo: {
    short: 'Art and visibility become screens for collective ideals.',
    long: `Neptune in Leo lends glamour to creativity, performance, romance, and the figure who seems to shine effortlessly. Shared images of artistic greatness can stir people to make something expressive and generous.

The spell can fade when admiration replaces attention to the work itself, or when an image of authenticity becomes another role to perform. Personal expression gains clarity when inspiration has room for imperfection.`
  },

  Virgo: {
    short: 'The ideal of being useful meets the limits of imperfect systems.',
    long: `Neptune in Virgo places a shared longing for care inside work, health, and everyday service. It can inspire thoughtful attention to people whom efficient systems overlook.

It can also romanticize self-sacrifice or promise a purity that no routine can deliver. Practical compassion helps with what is possible without treating every flaw as a failure to care.`
  },

  Libra: {
    short: 'Harmony and fairness become compelling shared ideals.',
    long: `Neptune in Libra gives partnership and social balance an almost luminous promise: people might meet one another without domination or needless conflict. That ideal can deepen empathy and diplomacy.

It can also make a polished agreement look fair when someone's needs remain unspoken. The wish for harmony needs the support of clear terms and honest disagreement.`
  },

  Scorpio: {
    short: 'A shared fascination with hidden motives complicates intimacy.',
    long: `Neptune in Scorpio gives mystery to questions of trust, desire, secrecy, and power. Cultural images of profound intimacy can make people more willing to explore what is usually kept private.

The same longing can mistake intensity for honesty or surrender for safety. When this theme is personally active, discernment matters as much as openness: what is felt deeply still needs to be tested against how someone behaves.`
  },

  Sagittarius: {
    short: 'Belief and exploration carry shared visions of freedom.',
    long: `Neptune in Sagittarius reaches toward distant horizons, teachers, and stories that promise a larger meaning. This can open a cohort to unfamiliar philosophies and a more generous sense of possibility.

It can also place too much faith in a guide or an answer that seems to explain everything. The constructive expression keeps wonder alive while allowing experience and evidence to revise belief.`
  },

  Capricorn: {
    short: 'Dreams of meaningful authority meet the reality of institutions.',
    long: `Neptune in Capricorn places collective hopes in achievement, leadership, and durable structures. Institutions may promise not only order but meaning, making disillusionment sharp when their actions fail that ideal.

The placement can inspire structures that serve a real purpose instead of only projecting prestige. It also invites scrutiny of what success asks people to overlook.`
  },

  Aquarius: {
    short: 'Collective progress becomes an object of hope and projection.',
    long: `With Neptune in Aquarius, imagination extends to humanity as a whole. Shared visions of networks, innovation, and social change can make cooperation across distance seem possible.

The danger is loving the idea of a better future more than the people living in the present. A vision gains substance when a group can name whose needs it serves and how its promises will be tested.`
  },

  Pisces: {
    short: 'Shared imagination turns toward empathy, art, and the unseen.',
    long: `Neptune in Pisces can express collective imagination and spiritual longing through empathy, art, and sensitivity to what is hard to name. A culture may find new language for grief, compassion, or experiences that resist neat categories.

Porous boundaries can foster care, but they can also blur the difference between helping and being overwhelmed. A compelling vision of compassion needs discernment about what can actually be offered without erasing limits.`
  },
},


/* ────────────────────────────────────────────────────────────
 * PLUTO IN SIGNS – power, shadow, rebirth, deep transformation
 * ────────────────────────────────────────────────────────── */

Pluto: {
  Aries: {
    short: 'Autonomy and the right to act become questions of power.',
    long: `Pluto in Aries brings deep questions of power into independence, assertion, and conflict. Struggles over who is allowed to initiate change can expose whose anger is treated as legitimate.

Courage can challenge coercion, but force can also disguise itself as freedom. Where personally emphasized in a chart, this pattern may ask for action that is deliberate enough to avoid repeating the control it resists.`
  },

  Taurus: {
    short: 'Shared assumptions about wealth and security face deep scrutiny.',
    long: `Pluto in Taurus puts power into money, land, resources, and the systems that decide who can feel materially secure. Pressure on these foundations can reveal where ownership has been confused with worth.

Repair may require patient stewardship rather than either hoarding or destroying what people depend on. An individual chart can locate where questions of possession, dependence, and value become personally consequential.`
  },

  Gemini: {
    short: 'Information and language become sites of power and contest.',
    long: `With Pluto in Gemini, words and ideas carry enormous power. Control of stories, education, and channels of communication shapes what can be known or said.

Language can expose a hidden truth or manipulate an audience into accepting one. The choice to speak or remain silent can itself shift power; inquiry becomes more useful when it does not turn every exchange into a struggle for control.`
  },

  Cancer: {
    short: 'Power beneath ideas of home, kinship, and safety comes into view.',
    long: `Pluto in Cancer draws attention to the structures that define family, protection, and belonging. A culture may have to examine whose homes are secure, whose needs are called private, and who sets the terms of belonging.

Protection can conceal control when questioning an inherited role is treated as betrayal. Care becomes more honest when it makes room for autonomy as well as attachment.`
  },

  Leo: {
    short: 'Creative visibility raises questions of influence and control.',
    long: `Pluto in Leo intensifies the power of performance, celebrity, leadership, and the desire to be seen. A cohort may both elevate charismatic figures and ask whose creativity is overlooked when attention gathers around them.

Expression can bring life to shared possibilities, or become a contest for admiration. Making something honest can matter more than controlling the response to it.`
  },

  Virgo: {
    short: 'Work and health systems expose the power hidden in standards.',
    long: `Pluto in Virgo intensifies questions of labor, health, usefulness, and who defines a task as done well. Demands for efficiency or purity can give one group control over another's daily life.

Close attention can repair neglected systems; relentless correction can make people feel reduced to their flaws. The same scrutiny can turn inward when people measure themselves against impossible standards. Useful reform leaves room for the imperfect people who have to live with it.`
  },

  Libra: {
    short: 'The terms of partnership reveal hidden imbalances of power.',
    long: `Pluto in Libra draws power into agreements, alliances, and ideas of fairness. A cohort may question relationships that look balanced on the surface while one side holds the ability to set the terms.

Confronting dependency can make reciprocity more real; turning every difference into a contest can make negotiation impossible. House and aspect context can show whether this shared pattern becomes a prominent personal theme.`
  },

  Scorpio: {
    short: 'Hidden arrangements of trust and control invite deep scrutiny.',
    long: `Pluto in Scorpio brings questions of power, loss, and renewal into the intimate territory of trust and what people keep hidden. A cohort may bring taboo subjects into view and question who benefits from secrecy.

Facing a difficult truth can loosen control; exposing someone else's vulnerability can also become a misuse of power. Personal meaning depends on where and how this placement connects with the rest of the chart.`
  },

  Sagittarius: {
    short: 'Belief and moral certainty become instruments of power.',
    long: `Pluto in Sagittarius reveals how belief systems, education, and claims to universal truth can organize power. A cohort may challenge dogma while discovering how easily a liberating idea can become another absolute.

Inquiry grows stronger when it can revise its own conclusions. The constructive expression makes room for many lived horizons without pretending that every claim is equally sound.`
  },

  Capricorn: {
    short: 'Institutions confront the costs of concentrated authority.',
    long: `Pluto in Capricorn brings deep restructuring around power, success, and control. A cohort may see where institutions preserve order by demanding too much from the people inside them.

Changing a structure takes more than rejecting its leaders: durable reform also asks who will carry responsibility and how power can be checked. In an individual chart, this shared pressure may intersect with personal commitments or authority.`
  },

  Aquarius: {
    short: 'Networks and group ideals reveal new forms of collective power.',
    long: `With Pluto in Aquarius, power dynamics around groups, technology, and social systems come into focus. Challenges to inherited institutions can create new networks that concentrate influence of their own.

Collective change can broaden participation, or let a group's vision override the people it claims to serve. Personal chart context determines where this wider struggle for freedom and accountability is felt.`
  },

  Pisces: {
    short: 'Shared ideals of compassion expose where care and control blur.',
    long: `Pluto in Pisces puts pressure on collective beliefs about sacrifice, spirituality, and what people owe one another in suffering. An ideal of boundless compassion may reveal hidden forms of power inside institutions that claim to heal or save.

Renewal is possible when care respects limits and agency instead of asking anyone to disappear into a cause. A collective ideal is stronger when it can offer help without demanding a savior or a sacrifice.`
  },
},
})

export function getPlanetSignMeaning(
  planet: PlanetKey,
  sign: ZodiacName
): Interpretation | null {
  const planetBlock = PLANET_SIGN_MEANINGS[planet]
  if (!planetBlock) return null
  return maybe(planetBlock[sign])
}
