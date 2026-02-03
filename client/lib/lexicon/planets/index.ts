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
    long: `Mercury in Gemini is at home here, bringing mental agility and a hunger for information. You think in webs rather than lines—connecting ideas, people, and perspectives with ease. Conversation, learning, and variety keep your mind alive.

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
    long: `Venus in Taurus is at home here, seeking comfort, security, and physical presence. You value consistency and tend to show love through touch, reliability, and shared pleasures. Once you commit, you’re deeply devoted.

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
    long: `Venus in Libra is naturally relationship-oriented. You value fairness, beauty, and emotional reciprocity, often thriving in partnership. Romance, shared aesthetics, and emotional equality matter deeply to you.

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
    long: `Jupiter in Sagittarius is at home here. You expand through travel, philosophy, spirituality, and the search for meaning. Optimism and faith in life are natural strengths.

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
    long: `Saturn is at home in Capricorn. Life may feel demanding early, with heavy responsibilities or high expectations.

Through persistence, you gain authority and respect. Success feels deeply earned, and your leadership becomes a model for others.`
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
    short: 'You’re wired to initiate change boldly and independently.',
    long: `With Uranus in Aries, innovation comes through action. You’re instinctively driven to break new ground, take risks, and act on sudden inspiration.

Your challenge is pacing yourself. When grounded, your courage becomes a catalyst for powerful new beginnings—not just impulsive rebellion.`
  },

  Taurus: {
    short: 'You’re here to revolutionize values, security, and material systems.',
    long: `Uranus in Taurus disrupts comfort zones around stability, money, and self-worth. You may experience sudden shifts in what you rely on or value.

Over time, you learn that true security comes from adaptability. Your ability to innovate within practical systems can reshape how stability itself is defined.`
  },

  Gemini: {
    short: 'Your mind is fast, unconventional, and naturally inventive.',
    long: `With Uranus in Gemini, your thinking style is electric and original. You may process information differently than others or jump between ideas rapidly.

Your gift is mental innovation—new ways of communicating, learning, or connecting ideas. Structure helps turn flashes of insight into lasting contributions.`
  },

  Cancer: {
    short: 'You’re here to redefine emotional safety and belonging.',
    long: `Uranus in Cancer brings change to family patterns, emotional bonds, and ideas of home. You may feel different from your roots or experience sudden emotional shifts.

Your path involves creating new models of care and connection—ones that honor individuality without sacrificing emotional truth.`
  },

  Leo: {
    short: 'Your self-expression is unique, bold, and impossible to ignore.',
    long: `With Uranus in Leo, creativity and identity are infused with originality. You’re not here to perform a role—you’re here to reinvent it.

Learning to own your uniqueness without needing constant reaction or shock value allows your authentic brilliance to shine.`
  },

  Virgo: {
    short: 'You innovate through systems, work, and practical problem-solving.',
    long: `Uranus in Virgo awakens new ways of being useful, efficient, and precise. You may question traditional routines or feel called to improve systems that others accept.

Your gift is practical innovation—bringing fresh solutions into everyday life without losing attention to detail.`
  },

  Libra: {
    short: 'You’re here to challenge norms around relationships and fairness.',
    long: `With Uranus in Libra, partnerships may feel unconventional or unpredictable. You seek equality, freedom, and authenticity in connection.

Your growth comes from balancing independence with commitment, creating relationships that evolve rather than conform.`
  },

  Scorpio: {
    short: 'You awaken through deep transformation and emotional truth.',
    long: `Uranus in Scorpio brings sudden insights around power, intimacy, and control. You may experience intense emotional shifts that force growth and renewal.

Your strength lies in your ability to face taboo or hidden truths and emerge transformed, helping others do the same.`
  },

  Sagittarius: {
    short: 'You’re here to revolutionize belief systems and worldviews.',
    long: `With Uranus in Sagittarius, your ideas challenge tradition, dogma, and outdated philosophies. You may feel driven to explore beyond accepted truths.

Your role is expanding perspectives—grounding freedom in wisdom rather than rebellion for its own sake.`
  },

  Capricorn: {
    short: 'You’re here to disrupt outdated structures and redefine success.',
    long: `Uranus in Capricorn shakes up authority, ambition, and institutions. You may feel tension between tradition and innovation in your career or life path.

Your gift is modernizing systems—introducing change that makes structures more humane, flexible, and future-ready.`
  },

  Aquarius: {
    short: 'You’re naturally ahead of your time and wired for innovation.',
    long: `Uranus is at home in Aquarius. You think in systems, futures, and collective progress. You may feel different, detached, or misunderstood early on.

Embracing your originality while staying connected allows your ideas to genuinely improve the world around you.`
  },

  Pisces: {
    short: 'You awaken through intuition, spirituality, and imagination.',
    long: `With Uranus in Pisces, insight comes through dreams, symbolism, and subtle perception. You may experience sudden spiritual awakenings or emotional revelations.

Grounding intuition in reality helps transform inspiration into meaningful creative or healing work.`
  },
},


/* ────────────────────────────────────────────────────────────
 * NEPTUNE IN SIGNS – dreams, intuition, illusion, spirituality
 * ────────────────────────────────────────────────────────── */

Neptune: {
  Aries: {
    short: 'Your dreams push you toward action and self-discovery.',
    long: `With Neptune in Aries, inspiration comes in flashes of courage and personal vision. You may idealize independence or feel called to pursue a dream through bold action.

The challenge is clarity—learning when to act on intuition versus impulse. When aligned, you become a pioneer for inspired, purpose-driven change.`
  },

  Taurus: {
    short: 'You seek spiritual meaning through stability, beauty, and the senses.',
    long: `Neptune in Taurus blends imagination with the material world. You may idealize comfort, security, or physical pleasure, finding peace in nature, art, or routine.

Your growth comes from grounding dreams in reality—so inspiration nourishes your life rather than blurring your sense of value or worth.`
  },

  Gemini: {
    short: 'Your imagination flows through thoughts, words, and ideas.',
    long: `With Neptune in Gemini, intuition and intellect intertwine. You may feel inspired by language, storytelling, symbolism, or abstract ideas—but also prone to mental fog.

Learning to slow down and listen beneath the noise helps you translate inspiration into meaningful communication.`
  },

  Cancer: {
    short: 'You’re deeply intuitive and emotionally sensitive to your surroundings.',
    long: `Neptune in Cancer heightens empathy and emotional perception. You may absorb feelings from family, environments, or collective moods without realizing it.

Developing emotional boundaries allows your compassion to become a source of strength rather than emotional overwhelm.`
  },

  Leo: {
    short: 'You dream of expressing your true self creatively and authentically.',
    long: `With Neptune in Leo, imagination fuels creativity, romance, and self-expression. You may idealize recognition or feel called to inspire others through art or presence.

Staying connected to your authentic self—rather than an idealized image—helps your creativity shine without distortion.`
  },

  Virgo: {
    short: 'You seek meaning through service, healing, and refinement.',
    long: `Neptune in Virgo brings sensitivity into the realm of work, health, and usefulness. You may feel called to help, heal, or improve systems—but struggle with perfectionism or burnout.

Compassion for yourself is key. When grounded, your intuition becomes practical wisdom and gentle service.`
  },

  Libra: {
    short: 'You idealize harmony, connection, and relational balance.',
    long: `With Neptune in Libra, relationships are infused with romance, empathy, and idealism. You may see the best in others—sometimes to your own detriment.

Learning to maintain clarity and self-definition allows your love and diplomacy to flourish without self-sacrifice.`
  },

  Scorpio: {
    short: 'You’re drawn to mystery, transformation, and emotional depth.',
    long: `Neptune in Scorpio intensifies intuition around power, intimacy, and hidden truths. You may feel magnetically pulled toward deep emotional or spiritual experiences.

The work lies in discernment—learning when to surrender and when to protect your emotional boundaries.`
  },

  Sagittarius: {
    short: 'You dream of truth, freedom, and higher meaning.',
    long: `With Neptune in Sagittarius, spirituality and philosophy are central themes. You may idealize belief systems, teachers, or distant horizons.

Grounding faith in lived experience helps transform inspiration into wisdom rather than blind optimism or escapism.`
  },

  Capricorn: {
    short: 'You seek to merge dreams with responsibility and achievement.',
    long: `Neptune in Capricorn blurs the line between ambition and meaning. You may idealize success or feel disillusioned with traditional definitions of authority and status.

Your path involves redefining success in soulful terms—building structures that support purpose, not just productivity.`
  },

  Aquarius: {
    short: 'You dream of collective progress and a more compassionate future.',
    long: `With Neptune in Aquarius, imagination extends to humanity as a whole. You may feel inspired by social change, innovation, or visionary ideals.

Staying grounded helps ensure your hopes translate into real-world impact rather than remaining abstract or detached.`
  },

  Pisces: {
    short: 'You’re deeply intuitive, imaginative, and spiritually sensitive.',
    long: `Neptune is at home in Pisces, amplifying empathy, creativity, and spiritual awareness. You may feel connected to unseen realms, emotions, or collective suffering.

Learning boundaries is essential. When grounded, your sensitivity becomes a powerful channel for healing, art, and compassion.`
  },
},


/* ────────────────────────────────────────────────────────────
 * PLUTO IN SIGNS – power, shadow, rebirth, deep transformation
 * ────────────────────────────────────────────────────────── */

Pluto: {
  Aries: {
    short: 'Your transformation comes through reclaiming personal power.',
    long: `With Pluto in Aries, your life pushes you to confront issues of independence, anger, and self-assertion. You may experience intense struggles around identity or the right to act freely.

Through facing conflict and courageously redefining yourself, you learn that true power comes from conscious action rather than force or reaction.`
  },

  Taurus: {
    short: 'Your transformation centers on security, values, and self-worth.',
    long: `Pluto in Taurus brings deep change around money, possessions, and stability. You may experience loss or upheaval that forces you to redefine what truly matters.

By learning to let go of attachment and fear, you discover an unshakable sense of inner value that no external change can take away.`
  },

  Gemini: {
    short: 'Your transformation happens through thought, communication, and truth.',
    long: `With Pluto in Gemini, words and ideas carry enormous power. You may experience mental intensity, obsession with understanding, or transformative conversations.

Your growth lies in using language consciously—speaking truth without manipulation and learning when silence is just as powerful as speech.`
  },

  Cancer: {
    short: 'Your transformation runs through emotional security and family patterns.',
    long: `Pluto in Cancer brings deep healing around family, ancestry, and emotional safety. You may inherit intense emotional patterns or feel responsible for holding others together.

Reclaiming your emotional autonomy allows you to nurture from strength rather than survival, transforming inherited wounds into resilience.`
  },

  Leo: {
    short: 'Your transformation centers on identity, creativity, and self-expression.',
    long: `With Pluto in Leo, issues of recognition, pride, and authenticity are profound. You may experience power struggles around being seen or validated.

True empowerment comes when you express yourself from the heart—creating not to dominate, but to inspire and lead with integrity.`
  },

  Virgo: {
    short: 'Your transformation unfolds through service, healing, and self-improvement.',
    long: `Pluto in Virgo intensifies themes around work, health, and usefulness. You may feel driven to fix, purify, or control systems—sometimes turning that intensity inward.

Learning compassion for imperfection allows your desire to help and heal to become a source of empowerment rather than self-criticism.`
  },

  Libra: {
    short: 'Your transformation occurs through relationships and balance of power.',
    long: `With Pluto in Libra, relationships become arenas for deep psychological change. You may encounter intense partnerships, power struggles, or lessons around equality.

By confronting dependency and control, you learn to form connections rooted in mutual respect and shared strength.`
  },

  Scorpio: {
    short: 'You are wired for profound emotional and psychological transformation.',
    long: `Pluto in Scorpio is at home, amplifying themes of death, rebirth, intimacy, and shadow work. You’re naturally attuned to what others avoid—truth, pain, and emotional depth.

Your power lies in your capacity to face darkness without being consumed by it, emerging again and again renewed and wiser.`
  },

  Sagittarius: {
    short: 'Your transformation comes through belief, truth, and expanded understanding.',
    long: `With Pluto in Sagittarius, your life challenges belief systems, philosophies, and moral truths. You may experience intense shifts in worldview or confront dogma—your own or others’.

True growth arises when you seek truth with humility, allowing wisdom to evolve rather than clinging to absolute certainty.`
  },

  Capricorn: {
    short: 'Your transformation centers on authority, ambition, and responsibility.',
    long: `Pluto in Capricorn brings deep restructuring around power, success, and control. You may encounter intense pressure to achieve or dismantle outdated definitions of authority.

Your empowerment comes from redefining success on your own terms—building structures that reflect integrity, not fear.`
  },

  Aquarius: {
    short: 'Your transformation unfolds through society, innovation, and collective change.',
    long: `With Pluto in Aquarius, power dynamics around groups, technology, and social systems come into focus. You may feel driven to challenge outdated structures or imagine radical futures.

Learning to balance individuality with collective responsibility allows your vision to catalyze meaningful change.`
  },

  Pisces: {
    short: 'Your transformation occurs through surrender, compassion, and spiritual depth.',
    long: `Pluto in Pisces dissolves illusions around control, inviting deep spiritual and emotional rebirth. You may confront themes of loss, sacrifice, or collective suffering.

Through surrender and grounded compassion, you discover a profound inner strength rooted in faith, empathy, and transcendence.`
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
