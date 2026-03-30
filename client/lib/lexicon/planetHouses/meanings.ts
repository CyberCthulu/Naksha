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
    1: {
      short: 'Your emotions are visible, instinctive, and closely tied to your identity and presence.',
      long: `With the Moon in the 1st House, your emotional world tends to be close to the surface. You may experience feelings quickly and express them naturally, often wearing your mood or inner state outwardly.

There is a strong connection between your identity and your emotional landscape, and others may perceive you as sensitive, responsive, or intuitive. Your instincts guide how you move through life. Growth comes through developing emotional awareness and stability, so your sensitivity becomes a source of strength rather than reactivity.`,
    },
    2: {
      short: 'Your emotions are tied to security, stability, and your sense of self-worth.',
      long: `With the Moon in the 2nd House, your emotional well-being is often connected to your sense of security, both material and internal. You may feel most at ease when your environment is stable and your needs are met consistently.

There can be a strong link between emotional state and finances, possessions, or personal values. You may seek comfort through what feels tangible and reliable. Growth comes through building inner security alongside outer stability, so your sense of worth is not dependent solely on external conditions.`,
    },
    3: {
      short: 'Your emotions are processed through thought, communication, and mental activity.',
      long: `With the Moon in the 3rd House, your emotional world tends to move through your mind. You may process feelings by talking, writing, or thinking things through, often needing expression to understand what you feel.

There can be emotional sensitivity around communication and environment. You may pick up on subtle cues in conversations or surroundings. Growth comes through balancing thinking and feeling, so your emotions are experienced directly rather than only analyzed.`,
    },
    4: {
      short: 'Your emotions are deeply rooted in home, family, and your inner foundation.',
      long: `With the Moon in the 4th House, this is a natural placement, as the Moon rules this house. Your emotional life tends to be deeply connected to your roots, family, and sense of home.

You may have strong emotional memory and a deep need for safety, comfort, and belonging. Your inner world is rich and influential. Growth comes through building emotional security within yourself, so your foundation remains stable regardless of external circumstances.`,
    },
    5: {
      short: 'Your emotions express themselves through creativity, joy, and romantic or playful experiences.',
      long: `With the Moon in the 5th House, your emotional world tends to be expressive, creative, and connected to joy. You may feel deeply through artistic expression, romance, or experiences that allow you to be fully yourself.

There can be a desire to feel emotionally seen and appreciated. Your moods may fluctuate with creative or romantic experiences. Growth comes through grounding your emotional state, so expression remains authentic rather than dependent on external validation.`,
    },
    6: {
      short: 'Your emotions are tied to daily routines, work, and your physical and mental well-being.',
      long: `With the Moon in the 6th House, your emotional state is often influenced by your daily life, habits, and environment. You may feel more stable when your routines are consistent and your responsibilities are managed.

There can be sensitivity to stress, work conditions, or physical health. You may also care deeply about being useful or supportive. Growth comes through developing healthy routines and boundaries, so your emotional well-being is supported rather than drained by daily demands.`,
    },
    7: {
      short: 'Your emotions are shaped through relationships, connection, and emotional mirroring.',
      long: `With the Moon in the 7th House, your emotional life is closely tied to your relationships. You may seek emotional fulfillment through connection and feel strongly influenced by the moods or needs of others.

Partnerships can play a central role in your emotional development, offering both support and reflection. Growth comes through maintaining emotional awareness of yourself, so your needs remain clear even within close relationships.`,
    },
    8: {
      short: 'Your emotions are intense, deep, and connected to transformation, intimacy, and vulnerability.',
      long: `With the Moon in the 8th House, your emotional world tends to be profound, complex, and transformative. You may feel deeply and experience strong emotional bonds, especially in intimate or shared situations.

There can be sensitivity around trust, loss, or emotional merging. You may be drawn to depth rather than surface-level connection. Growth comes through developing emotional resilience and openness, so intensity becomes a source of insight rather than overwhelm.`,
    },
    9: {
      short: 'Your emotions are tied to belief, meaning, and the need for expansion and understanding.',
      long: `With the Moon in the 9th House, your emotional well-being is often connected to your sense of meaning, belief, and growth. You may feel most at ease when exploring new ideas, philosophies, or experiences.

There can be a need for emotional expansion through learning, travel, or spiritual exploration. Your feelings may be influenced by your worldview. Growth comes through grounding your emotional experiences, so meaning is integrated into daily life rather than remaining abstract.`,
    },
    10: {
      short: 'Your emotions are connected to your public life, career, and sense of purpose.',
      long: `With the Moon in the 10th House, your emotional life may be closely tied to your career, public role, or sense of achievement. You may feel a strong need to be recognized or to create a meaningful contribution in the world.

Others may perceive you as caring, responsive, or emotionally engaged in your work. However, emotional fulfillment may fluctuate with external success. Growth comes through developing inner emotional stability, so your sense of purpose is not dependent solely on external validation.`,
    },
    11: {
      short: 'Your emotions are shaped through friendships, community, and shared goals.',
      long: `With the Moon in the 11th House, your emotional life is often influenced by your social connections and sense of belonging within groups. You may feel supported through friendships and shared vision.

There can be a strong need for emotional connection within community or collective environments. Your feelings may fluctuate with social dynamics. Growth comes through maintaining a sense of self within the group, so belonging enhances rather than defines your emotional state.`,
    },
    12: {
      short: 'Your emotions are deep, private, and connected to the subconscious and unseen layers of experience.',
      long: `With the Moon in the 12th House, your emotional world may be subtle, complex, and not always fully visible to others. You may feel deeply but process emotions internally or in solitude.

There can be strong intuition, empathy, and sensitivity to unseen influences. At times, emotions may feel overwhelming or difficult to define. Growth comes through developing awareness and grounding, so your inner world becomes a source of healing rather than confusion.`,
    },
  },

  Mercury: {
    1: {
      short: 'Your thinking and communication are immediate, visible, and central to how you present yourself.',
      long: `With Mercury in the 1st House, your mind and communication style are closely tied to your identity and presence. You may come across as articulate, curious, and mentally active, often expressing your thoughts quickly and directly.

There is often a strong need to understand and explain yourself, and others may notice your intelligence or conversational style right away. Growth comes through developing focus and depth, so your quick thinking becomes integrated clarity rather than constant mental movement.`,
    },
    2: {
      short: 'Your thinking is grounded in values, practicality, and how you build and manage resources.',
      long: `With Mercury in the 2nd House, your mind tends to focus on practical matters such as finances, resources, and personal values. You may think in terms of usefulness, stability, and how to create tangible results.

There can be skill in managing money, organizing resources, or making thoughtful decisions around value. Your words may carry weight when it comes to what matters. Growth comes through expanding beyond purely practical thinking, so your intellect can explore as well as stabilize.`,
    },
    3: {
      short: 'Your thinking and communication are quick, curious, and highly active.',
      long: `With Mercury in the 3rd House, this is a natural placement, as Mercury rules this house. Your mind tends to be fast, adaptable, and engaged with learning, communication, and information exchange.

You may excel in speaking, writing, teaching, or connecting ideas. There is often a strong curiosity and desire to understand many things. Growth comes through cultivating focus and depth, so your intelligence becomes structured knowledge rather than scattered information.`,
    },
    4: {
      short: 'Your thinking is shaped by your inner world, memories, and emotional foundation.',
      long: `With Mercury in the 4th House, your mind tends to turn inward. You may think deeply about your past, your roots, and your inner emotional landscape.

There can be a reflective or private quality to your communication, and you may express yourself most clearly in safe or familiar environments. Growth comes through balancing inner reflection with outward expression, so your thoughts are shared as well as understood.`,
    },
    5: {
      short: 'Your thinking expresses itself creatively, playfully, and through self-expression.',
      long: `With Mercury in the 5th House, your mind tends to be expressive, creative, and oriented toward sharing ideas in engaging ways. You may enjoy storytelling, humor, performance, or creative communication.

There is often a playful quality to how you think and speak, and you may feel most alive when expressing yourself openly. Growth comes through grounding your ideas, so creativity leads to meaningful output rather than remaining purely expressive.`,
    },
    6: {
      short: 'Your thinking is analytical, precise, and focused on solving problems and improving systems.',
      long: `With Mercury in the 6th House, your mind tends to operate in a detailed, structured, and practical way. You may excel at organizing information, solving problems, and refining systems in your daily life.

There is often a strong focus on efficiency, health, or work-related thinking. However, overthinking or mental stress can arise. Growth comes through balancing analysis with mental rest, so your precision remains a strength rather than a burden.`,
    },
    7: {
      short: 'Your thinking develops through dialogue, relationships, and exchanging perspectives with others.',
      long: `With Mercury in the 7th House, your communication style is often shaped through interaction with others. You may think best through conversation, negotiation, or shared dialogue.

There can be a strong ability to understand multiple perspectives and communicate in a balanced way. However, indecision may arise when trying to consider everything equally. Growth comes through developing a clear personal viewpoint, so communication remains grounded in your own truth.`,
    },
    8: {
      short: 'Your thinking is deep, investigative, and drawn to hidden or complex subjects.',
      long: `With Mercury in the 8th House, your mind tends to seek depth, truth, and understanding beneath the surface. You may be drawn to psychology, strategy, mystery, or subjects that involve transformation and hidden dynamics.

Your communication may be intense, focused, or purposeful. You often prefer meaningful conversation over small talk. Growth comes through allowing openness and flexibility, so your depth of thought remains expansive rather than fixed.`,
    },
    9: {
      short: 'Your thinking is expansive, philosophical, and oriented toward meaning and big ideas.',
      long: `With Mercury in the 9th House, your mind tends to focus on philosophy, belief systems, and higher learning. You may enjoy exploring ideas that expand your worldview and connect to larger meaning.

There is often a natural interest in teaching, writing, or sharing knowledge. However, ideas can remain abstract if not grounded. Growth comes through integrating your insights into practical understanding, so your knowledge becomes lived wisdom.`,
    },
    10: {
      short: 'Your thinking and communication are tied to your career, reputation, and public role.',
      long: `With Mercury in the 10th House, your mind is often directed toward goals, achievement, and how you are perceived publicly. You may communicate in a way that is structured, purposeful, and aligned with your ambitions.

There can be skill in strategy, planning, or professional communication. Your words may carry authority in your field. Growth comes through balancing ambition with authenticity, so your communication reflects your true perspective rather than only external expectations.`,
    },
    11: {
      short: 'Your thinking is innovative, future-oriented, and shaped by groups, networks, and shared ideas.',
      long: `With Mercury in the 11th House, your mind tends to operate in a forward-thinking and collective way. You may be drawn to ideas that involve progress, innovation, or social connection.

You often think well within groups or networks and may enjoy exchanging ideas with others who share your vision. Growth comes through focusing your ideas, so your vision becomes actionable rather than purely conceptual.`,
    },
    12: {
      short: 'Your thinking is introspective, intuitive, and connected to the subconscious or unseen.',
      long: `With Mercury in the 12th House, your mind may operate in subtle, intuitive, or inward ways. You may think deeply, reflect privately, or process information beneath the surface of awareness.

There can be strong imagination, intuition, or sensitivity to hidden patterns. However, clarity may sometimes feel elusive. Growth comes through grounding your thoughts and expressing them clearly, so your inner understanding can be shared and applied.`,
    },
  },

  Venus: {
    1: {
      short: 'You express charm, attraction, and beauty naturally through your presence and identity.',
      long: `With Venus in the 1st House, your energy often comes across as pleasant, attractive, and harmonious. You may naturally draw others toward you through your demeanor, style, or way of being.

There is often a strong connection between your identity and your sense of beauty or relationship to others. You may value being liked or appreciated. Growth comes through developing self-worth that is independent of external validation, so your charm reflects authenticity rather than adaptation.`,
    },
    2: {
      short: 'You find pleasure and value in stability, comfort, and building material and emotional security.',
      long: `With Venus in the 2nd House, your relationship to love, pleasure, and beauty is closely tied to value and stability. You may enjoy comfort, quality, and the tangible aspects of life, including finances and possessions.

There is often a strong appreciation for what feels secure and lasting. You may also attract resources or value through your natural sense of harmony. Growth comes through balancing attachment with flow, so enjoyment does not become dependency on material or external conditions.`,
    },
    3: {
      short: 'You express love and attraction through communication, connection, and shared ideas.',
      long: `With Venus in the 3rd House, your relational style often centers around communication, curiosity, and mental connection. You may enjoy conversation, writing, or exchanging ideas as a way of bonding with others.

There is often charm in how you speak and connect, and you may attract others through your words or intellect. Growth comes through developing emotional depth, so connection goes beyond surface-level interaction into meaningful understanding.`,
    },
    4: {
      short: 'You find love and pleasure in home, emotional security, and close personal bonds.',
      long: `With Venus in the 4th House, your sense of love and harmony is often tied to your home, family, and inner emotional world. You may feel most at ease in environments that are comfortable, nurturing, and emotionally safe.

There is often a deep appreciation for private connection and meaningful bonds. You may express affection through care and creating a sense of belonging. Growth comes through balancing inner and outer connection, so your emotional world remains supportive without becoming overly enclosed.`,
    },
    5: {
      short: 'You express love and attraction through creativity, romance, and joyful self-expression.',
      long: `With Venus in the 5th House, your relational style tends to be expressive, playful, and romantic. You may enjoy creativity, art, and experiences that allow you to feel alive and fully present.

There is often a strong desire for romance, admiration, and enjoyment in connection. You may express love through creativity and passion. Growth comes through grounding your desires, so pleasure becomes sustainable rather than dependent on constant excitement or validation.`,
    },
    6: {
      short: 'You express love through care, support, and practical acts of service in daily life.',
      long: `With Venus in the 6th House, your approach to love and harmony often shows through practical care, helpfulness, and attention to detail. You may express affection by supporting others, improving situations, or contributing in meaningful ways.

There can be a desire for balance and harmony within daily routines and work environments. However, love may become tied to usefulness. Growth comes through recognizing your worth beyond what you do, so relationships remain mutual rather than service-based alone.`,
    },
    7: {
      short: 'You naturally seek harmony, balance, and connection within relationships and partnerships.',
      long: `With Venus in the 7th House, this is a natural placement, as Venus rules this house. Your approach to love and connection is centered around partnership, harmony, and mutual understanding.

You may value relationships highly and seek balance, fairness, and cooperation in your connections. There is often a natural ability to attract partners and maintain harmony. Growth comes through maintaining your individuality, so connection enhances rather than defines your identity.`,
    },
    8: {
      short: 'You experience love and attraction deeply, intensely, and through emotional and transformative bonds.',
      long: `With Venus in the 8th House, your approach to love tends to be intense, emotional, and deeply connected. You may seek relationships that involve transformation, intimacy, and profound emotional bonding.

There can be strong attraction, passion, and a desire for depth rather than surface-level connection. However, attachment or power dynamics may arise. Growth comes through cultivating trust and balance, so intimacy becomes empowering rather than consuming.`,
    },
    9: {
      short: 'You express love through shared beliefs, exploration, and expanding experiences together.',
      long: `With Venus in the 9th House, your approach to love and connection often involves growth, learning, and shared exploration. You may be drawn to partners who expand your worldview or align with your beliefs.

There is often a love of travel, philosophy, or cultural connection within relationships. You may value freedom and expansion in love. Growth comes through grounding connection, so relationships remain stable as well as expansive.`,
    },
    10: {
      short: 'You express love and value through your career, public image, and achievements.',
      long: `With Venus in the 10th House, your sense of attraction and value may be tied to your public life, career, or reputation. You may be drawn to partners who are established, successful, or aligned with your ambitions.

There is often a natural charm in professional settings, and relationships may influence your public path. Growth comes through aligning love with authenticity, so your connections support your true self rather than only your status or image.`,
    },
    11: {
      short: 'You express love through friendship, shared goals, and connection within communities.',
      long: `With Venus in the 11th House, your approach to love often begins with friendship, shared ideals, and mutual interests. You may value connection within groups or communities and feel drawn to relationships that align with your vision for the future.

There is often ease in social settings and a natural ability to connect with others. Growth comes through maintaining emotional depth, so relationships go beyond shared ideas into meaningful connection.`,
    },
    12: {
      short: 'You experience love in subtle, private, and deeply emotional or spiritual ways.',
      long: `With Venus in the 12th House, your approach to love may be inward, sensitive, and sometimes hidden. You may experience deep compassion, idealism, or spiritual connection in relationships.

There can be a tendency toward sacrifice, longing, or blurred boundaries in love. You may feel drawn to connections that are difficult to define. Growth comes through developing clarity and self-worth, so love becomes grounded and reciprocal rather than elusive or self-sacrificing.`,
    },
  },

  Mars: {
    1: {
      short: 'You express energy, drive, and assertiveness directly through your identity and presence.',
      long: `With Mars in the 1st House, your energy is immediate, visible, and action-oriented. You may come across as assertive, bold, or physically expressive, with a natural drive to take initiative.

There is often strong willpower and a desire to act independently. However, impatience or impulsiveness can arise. Growth comes through directing your energy with intention, so your strength becomes focused action rather than reactive force.`,
    },
    2: {
      short: 'You direct your energy toward building resources, stability, and material security.',
      long: `With Mars in the 2nd House, your drive is often focused on earning, building, and securing resources. You may feel motivated to create financial stability and tangible results through effort and persistence.

There can be determination around values and possessions, but also potential conflict around money or self-worth. Growth comes through aligning action with true values, so effort leads to meaningful and sustainable results.`,
    },
    3: {
      short: 'You express energy through communication, thinking, and mental activity.',
      long: `With Mars in the 3rd House, your drive tends to move through your mind and communication. You may think quickly, speak directly, and engage actively in conversations or debates.

There can be strong opinions and a desire to express ideas assertively. However, arguments or impatience in communication may arise. Growth comes through channeling mental energy constructively, so your words become powerful rather than reactive.`,
    },
    4: {
      short: 'You direct your energy inward, toward home, family, and your emotional foundation.',
      long: `With Mars in the 4th House, your drive may be expressed in your private life or within your home environment. There can be strong emotional energy tied to family, roots, or personal security.

You may feel motivated to build a stable foundation or protect what matters to you. However, internal tension or conflict within the home may arise. Growth comes through processing emotional energy consciously, so it becomes strength rather than internal pressure.`,
    },
    5: {
      short: 'You express energy through creativity, passion, romance, and bold self-expression.',
      long: `With Mars in the 5th House, your drive tends to be creative, expressive, and passionate. You may pursue what excites you with intensity, whether in art, romance, or personal projects.

There is often a strong desire to take risks and express yourself fully. Romance may be fiery and dynamic. Growth comes through balancing passion with consistency, so your creative energy can sustain itself over time.`,
    },
    6: {
      short: 'You direct your energy toward work, routines, and improving daily systems.',
      long: `With Mars in the 6th House, your drive is often focused on productivity, efficiency, and daily responsibilities. You may work hard, take initiative in your routines, and strive to improve systems around you.

There can be strong motivation to stay active and engaged, but also potential for stress or burnout. Growth comes through balancing effort with rest, so your energy remains sustainable and effective.`,
    },
    7: {
      short: 'You express energy through relationships, partnership dynamics, and direct interaction with others.',
      long: `With Mars in the 7th House, your drive often emerges within relationships. You may attract strong, assertive partners or engage in dynamic, sometimes challenging interactions.

There can be passion and intensity in partnerships, but also conflict if energy is not balanced. Growth comes through developing cooperation and mutual respect, so relationships become a space for growth rather than constant tension.`,
    },
    8: {
      short: 'You direct your energy toward transformation, intimacy, and deep emotional experiences.',
      long: `With Mars in the 8th House, your drive tends to be intense, focused, and transformative. You may pursue deep emotional or psychological experiences and feel compelled to understand what lies beneath the surface.

There can be strong willpower in matters of intimacy, shared resources, or personal transformation. However, control or power struggles may arise. Growth comes through channeling intensity into conscious transformation, so your energy empowers rather than overwhelms.`,
    },
    9: {
      short: 'You express energy through exploration, belief, and the pursuit of knowledge and meaning.',
      long: `With Mars in the 9th House, your drive is often directed toward expansion, learning, and exploration. You may feel motivated to travel, study, or pursue experiences that broaden your perspective.

There can be strong conviction in your beliefs and a desire to defend or express them. Growth comes through remaining open-minded, so your passion for truth does not become rigidity.`,
    },
    10: {
      short: 'You direct your energy toward achievement, ambition, and your public path or career.',
      long: `With Mars in the 10th House, your drive is often focused on success, achievement, and making an impact in the world. You may be highly motivated in your career and willing to take initiative to reach your goals.

There can be strong ambition and leadership ability, but also pressure or conflict in professional settings. Growth comes through aligning ambition with purpose, so your actions lead to meaningful and sustainable success.`,
    },
    11: {
      short: 'You express energy through groups, friendships, and pursuing collective goals.',
      long: `With Mars in the 11th House, your drive often emerges in social settings, group efforts, or shared visions. You may feel motivated to take action within communities or toward long-term goals.

There can be leadership within groups, but also potential for conflict if dynamics become unbalanced. Growth comes through channeling your energy into constructive collaboration, so your drive supports collective progress.`,
    },
    12: {
      short: 'Your energy operates beneath the surface, often expressed privately or through inner processes.',
      long: `With Mars in the 12th House, your drive may be less visible and more internalized. You may act behind the scenes or feel your energy move through subconscious or emotional layers.

There can be hidden tension or difficulty expressing anger directly. However, this placement can also support spiritual discipline or deep inner work. Growth comes through becoming aware of your internal energy, so it can be expressed consciously rather than remaining suppressed.`,
    },
  },

  Jupiter: {
    1: {
      short: 'You express growth, optimism, and expansion naturally through your identity and presence.',
      long: `With Jupiter in the 1st House, your energy often comes across as expansive, optimistic, and growth-oriented. You may naturally project confidence, generosity, or a sense of possibility.

There is often a desire to grow, explore, and develop yourself continuously. Others may experience you as uplifting or encouraging. Growth comes through grounding your expansion, so optimism is paired with awareness and direction.`,
    },
    2: {
      short: 'You experience growth and opportunity through values, resources, and building stability.',
      long: `With Jupiter in the 2nd House, your sense of expansion often relates to finances, possessions, and personal values. You may have opportunities to grow materially or develop a strong sense of abundance.

There can be generosity and a broad approach to resources, though overextension may occur. Growth comes through aligning abundance with responsibility, so expansion becomes sustainable rather than excessive.`,
    },
    3: {
      short: 'You grow through learning, communication, and expanding your mental world.',
      long: `With Jupiter in the 3rd House, your expansion tends to occur through knowledge, communication, and curiosity. You may enjoy learning, teaching, or sharing ideas across different environments.

There is often a broad-minded approach to thinking and a desire to understand many perspectives. Growth comes through developing focus, so your intellectual expansion becomes integrated wisdom rather than scattered information.`,
    },
    4: {
      short: 'You experience growth through home, family, and building a strong inner foundation.',
      long: `With Jupiter in the 4th House, your sense of expansion is often connected to your home, roots, and emotional foundation. You may experience growth through family, living environment, or inner development.

There can be a desire to create a supportive and abundant home life. Emotional security may expand over time. Growth comes through balancing inner and outer expansion, so your foundation remains stable as it grows.`,
    },
    5: {
      short: 'You grow through creativity, joy, self-expression, and embracing life fully.',
      long: `With Jupiter in the 5th House, your expansion is often tied to creativity, pleasure, and self-expression. You may feel most alive when engaging in activities that bring joy and allow you to express yourself freely.

There can be a natural enthusiasm for romance, art, or creative pursuits. Growth comes through balancing enjoyment with intention, so your expansion remains meaningful rather than excessive.`,
    },
    6: {
      short: 'You grow through work, discipline, and improving daily routines and systems.',
      long: `With Jupiter in the 6th House, your expansion tends to occur through daily effort, work, and self-improvement. You may find opportunities in service, productivity, or developing effective routines.

There can be growth in health, habits, or practical contribution. However, overcommitment may arise. Growth comes through maintaining balance, so your desire to improve does not lead to burnout.`,
    },
    7: {
      short: 'You grow through relationships, partnership, and shared experiences with others.',
      long: `With Jupiter in the 7th House, your expansion often comes through relationships and partnerships. You may attract opportunities through others or grow significantly through connection.

There is often a generous and open approach to relationships, with a desire for mutual growth. Growth comes through maintaining balance, so expansion in partnership supports both individuals equally.`,
    },
    8: {
      short: 'You grow through transformation, intimacy, and deep emotional or psychological exploration.',
      long: `With Jupiter in the 8th House, your expansion tends to occur through deep experiences, transformation, and shared resources. You may gain insight through exploring emotional, psychological, or spiritual depths.

There can be opportunities for growth through joint ventures or transformative events. Growth comes through integrating depth with wisdom, so expansion is guided rather than overwhelming.`,
    },
    9: {
      short: 'You grow through philosophy, travel, higher learning, and the search for truth.',
      long: `With Jupiter in the 9th House, this is a natural placement, as Jupiter rules this house. Your expansion is strongly tied to learning, belief systems, travel, and the pursuit of meaning.

You may feel drawn to explore different cultures, philosophies, or spiritual paths. There is often a natural optimism and desire for understanding. Growth comes through grounding your beliefs, so your expansion becomes lived wisdom rather than abstraction.`,
    },
    10: {
      short: 'You grow through career, achievement, and your role in the public world.',
      long: `With Jupiter in the 10th House, your expansion often occurs through your career, reputation, and public life. You may experience opportunities for growth in leadership, achievement, or recognition.

There can be a sense of purpose tied to making an impact in the world. Growth comes through aligning success with integrity, so expansion in your public life reflects your deeper values.`,
    },
    11: {
      short: 'You grow through friendships, community, and contributing to collective goals.',
      long: `With Jupiter in the 11th House, your expansion tends to occur through networks, groups, and shared vision. You may benefit from connections with others and opportunities within communities.

There is often a desire to contribute to something larger than yourself. Growth comes through focusing your vision, so collective expansion becomes tangible and effective.`,
    },
    12: {
      short: 'You grow through inner work, spirituality, and connection to the unseen.',
      long: `With Jupiter in the 12th House, your expansion often occurs through inner development, spirituality, and reflection. You may gain insight through solitude, intuition, or connection to deeper layers of experience.

There can be a sense of quiet growth or hidden support in your life. Growth comes through grounding your inner wisdom, so your expansion becomes both meaningful and applicable.`,
    },
  },

  Saturn: {
    1: {
      short: 'Your identity develops through discipline, responsibility, and overcoming self-doubt.',
      long: `With Saturn in the 1st House, your sense of self often develops through challenge, responsibility, and gradual self-definition. You may feel a strong awareness of yourself early on, sometimes accompanied by pressure or self-consciousness.

There can be a tendency toward seriousness or restraint in how you present yourself. However, this placement also brings the potential for deep self-mastery and resilience. Growth comes through building confidence over time, so your identity becomes grounded in strength rather than shaped by limitation.`,
    },
    2: {
      short: 'You develop self-worth and stability through discipline, effort, and long-term responsibility.',
      long: `With Saturn in the 2nd House, your relationship to money, resources, and self-worth often involves lessons of patience and responsibility. You may feel the need to work hard to build stability or overcome early limitations around security.

There can be caution or fear around finances, but also strong potential for long-term success through persistence. Growth comes through recognizing your inherent value, so self-worth is not defined solely by what you build externally.`,
    },
    3: {
      short: 'Your thinking and communication develop through structure, discipline, and careful expression.',
      long: `With Saturn in the 3rd House, your mental processes and communication style may be serious, focused, and deliberate. You may take time to express yourself or feel pressure to communicate clearly and correctly.

There can be early challenges around learning or expression, but also strong potential for disciplined thinking and deep understanding. Growth comes through trusting your voice, so structure supports your communication rather than restricting it.`,
    },
    4: {
      short: 'Your emotional foundation develops through responsibility, structure, and building inner stability.',
      long: `With Saturn in the 4th House, your sense of home, family, and emotional security may involve responsibility, pressure, or early maturity. You may feel the need to create stability where it was lacking.

There can be a strong drive to build a solid foundation, though emotional expression may feel restricted at times. Growth comes through allowing vulnerability and emotional openness, so your inner world becomes as strong as your outer structure.`,
    },
    5: {
      short: 'Your creativity and self-expression develop through discipline, effort, and overcoming hesitation.',
      long: `With Saturn in the 5th House, your approach to creativity, joy, and self-expression may feel structured or restrained. You may take your creative pursuits seriously and work hard to develop your abilities.

There can be hesitation in expressing yourself or fear of judgment. However, this placement offers the potential for mastery through persistence. Growth comes through allowing yourself to play and express freely, so discipline supports creativity rather than limiting it.`,
    },
    6: {
      short: 'Your growth comes through discipline in work, routines, and developing strong daily systems.',
      long: `With Saturn in the 6th House, your approach to work, health, and routine is often structured, disciplined, and responsibility-driven. You may take your duties seriously and feel a strong need to maintain order in your daily life.

There can be pressure around productivity or perfection, but also the ability to build highly effective systems. Growth comes through balancing discipline with self-care, so your routines remain sustainable and supportive.`,
    },
    7: {
      short: 'Your growth in relationships comes through commitment, responsibility, and long-term partnership.',
      long: `With Saturn in the 7th House, relationships may feel serious, significant, and tied to responsibility or commitment. You may approach partnership with caution or take time to fully trust and connect.

There can be lessons around boundaries, commitment, and mutual responsibility. While relationships may develop slowly, they often carry depth and longevity. Growth comes through opening to connection while maintaining structure, so partnership becomes both stable and fulfilling.`,
    },
    8: {
      short: 'Your growth comes through facing deep fears, transformation, and learning to trust vulnerability.',
      long: `With Saturn in the 8th House, your experience of intimacy, transformation, and shared resources may involve challenge or caution. You may feel the need to control or protect yourself in deep emotional situations.

There can be lessons around trust, power, and vulnerability, often requiring you to face fears directly. Growth comes through allowing transformation to occur gradually, so control becomes strength rather than restriction.`,
    },
    9: {
      short: 'Your beliefs and worldview develop through discipline, experience, and structured understanding.',
      long: `With Saturn in the 9th House, your approach to philosophy, belief, and learning may be serious, structured, and experience-based. You may question beliefs deeply and seek truth through discipline rather than blind acceptance.

There can be a gradual development of wisdom over time. Growth comes through remaining open to expansion, so structure supports your worldview without limiting it.`,
    },
    10: {
      short: 'Your career and public path develop through discipline, responsibility, and long-term achievement.',
      long: `With Saturn in the 10th House, this is a natural placement, as Saturn rules this house. Your career path often involves responsibility, ambition, and a strong drive to achieve.

You may take your public role seriously and work steadily toward long-term goals. There can be pressure or delay, but also the potential for significant success through persistence. Growth comes through aligning ambition with purpose, so achievement becomes meaningful rather than burdensome.`,
    },
    11: {
      short: 'Your growth in community and goals comes through responsibility, structure, and long-term vision.',
      long: `With Saturn in the 11th House, your approach to friendships, networks, and long-term goals may be serious and selective. You may value meaningful connections over large social circles.

There can be responsibility within groups or a focus on building structured goals over time. Growth comes through allowing openness and flexibility, so your vision remains expansive while grounded.`,
    },
    12: {
      short: 'Your growth comes through inner discipline, confronting hidden fears, and developing spiritual strength.',
      long: `With Saturn in the 12th House, your challenges and growth often occur beneath the surface. You may carry hidden fears, responsibilities, or subconscious patterns that require deep inner work.

There can be a sense of isolation or internal pressure, but also the potential for profound spiritual strength and resilience. Growth comes through bringing awareness to your inner world, so what is hidden becomes a source of mastery rather than limitation.`,
    },
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