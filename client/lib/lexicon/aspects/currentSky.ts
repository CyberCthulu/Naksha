import type { AspectType, PlanetKey } from '../types'

export type SkyAspectMeaning = {
  title: string
  dynamic: string
  meaning: string
  practice: string
  reflection: string
}

type PairTheme = {
  title: string
  potential: string
  friction: string
  practice: string
  reflection: string
}

export const SKY_PLANETS: readonly PlanetKey[] = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
]

/** Current-sky symbolism: shared reflection themes, not natal traits or predictions. */
export const SKY_ASPECT_DYNAMICS: Record<AspectType, string> = {
  conj: 'A conjunction concentrates two planetary themes in one place. They may reinforce each other, or become difficult to separate.',
  opp: 'An opposition brings two planetary themes into contrast. The invitation is to make room for both needs without letting either take over.',
  square:
    'A square describes friction between two planetary themes. It can be a useful prompt to change an approach that no longer serves both needs.',
  trine:
    'A trine symbolizes cooperation between two planetary themes. What feels available may still need attention to become useful.',
  sextile:
    'A sextile symbolizes an opening for two planetary themes to support each other. A small, deliberate step can help you explore that possibility.',
}

/** Authored pair content, shared by all five aspects with different dynamic framing. */
export const SKY_PAIR_THEMES: Record<string, PairTheme> = {
  'Sun:Moon': {
    title: 'Purpose and belonging',
    potential:
      'A sense of direction may find support in the places, people, and routines that help you feel at home.',
    friction:
      'The wish to move forward may sit alongside a need for comfort or reassurance. Neither has to invalidate the other.',
    practice:
      'Give one meaningful priority a place in your day, and leave room for the care that sustains it.',
    reflection:
      'What would let my intentions and emotional needs share the same plan?',
  },
  'Sun:Mercury': {
    title: 'Finding your voice',
    potential:
      'Words and ideas may offer a clearer way to express what matters to you.',
    friction:
      'It may be easy to identify so strongly with an opinion that a question feels like a personal challenge.',
    practice:
      'Write the essential point in one sentence, then leave space for information you have not considered.',
    reflection:
      'What am I trying to express beneath the need to be understood?',
  },
  'Sun:Venus': {
    title: 'Living your values',
    potential:
      'Pleasure, connection, and a sense of purpose may support one another through a choice that feels worthwhile.',
    friction:
      'Being liked and being true to a preference may pull in different directions.',
    practice:
      'Choose one small act of beauty or connection because you value it, without making approval the measure.',
    reflection: 'Where could my choices show more clearly what I value?',
  },
  'Sun:Mars': {
    title: 'Purpose in motion',
    potential:
      'Initiative may give a clear intention somewhere practical to go.',
    friction:
      'The urge to prove yourself may outrun your actual aim or turn a difference into a contest.',
    practice:
      'Name the result you want, then take a proportionate step that respects other people’s limits.',
    reflection: 'What is worth acting on even if there is nothing to prove?',
  },
  'Sun:Jupiter': {
    title: 'Room to grow',
    potential:
      'A wider perspective may help you imagine a direction that feels more generous or meaningful.',
    friction:
      'A hopeful vision may become a promise larger than the time or resources available.',
    practice:
      'Give an ambitious idea one manageable experiment before expanding the commitment.',
    reflection:
      'Which possibility feels meaningful enough to test in a small way?',
  },
  'Sun:Saturn': {
    title: 'Purpose and commitment',
    potential:
      'A steady routine or clear standard may give a meaningful goal a more durable foundation.',
    friction:
      'Responsibility may feel like a measure of your worth, especially when progress is slow.',
    practice:
      'Separate the task from your value as a person and define what enough effort looks like today.',
    reflection:
      'Which commitment supports my direction, and which standard needs revisiting?',
  },
  'Sun:Uranus': {
    title: 'Freedom to be yourself',
    potential:
      'An unfamiliar approach may reveal a part of your direction that routine has left unexplored.',
    friction:
      'The wish for independence may compete with the comfort of a familiar identity or role.',
    practice:
      'Try one reversible change that expresses your individuality without discarding what still works.',
    reflection: 'Where do I want more freedom to experiment?',
  },
  'Sun:Neptune': {
    title: 'Purpose and imagination',
    potential:
      'Imagination or compassion may bring a quieter source of meaning into view.',
    friction:
      'An inspiring image of who you could be may make present limits or unanswered questions harder to see.',
    practice:
      'Give inspiration a creative outlet, and check practical details before making a commitment.',
    reflection: 'What remains meaningful when I set the ideal image aside?',
  },
  'Sun:Pluto': {
    title: 'Agency and renewal',
    potential:
      'Honest attention to a persistent pattern may help you reclaim effort for something that matters.',
    friction:
      'A need to remain in control may make changing direction feel more threatening than it is.',
    practice:
      'Choose one response that is yours to change, while respecting what belongs to someone else.',
    reflection:
      'Where could I exercise agency without trying to control the whole outcome?',
  },
  'Moon:Mercury': {
    title: 'Giving feelings words',
    potential:
      'A conversation or a few lines of writing may help a feeling become easier to understand.',
    friction:
      'An explanation may arrive before you have had time to notice the feeling beneath it.',
    practice:
      'Describe what you feel and what you know separately before drawing a conclusion.',
    reflection:
      'What feeling needs to be heard before it needs to be explained?',
  },
  'Moon:Venus': {
    title: 'Comfort and connection',
    potential:
      'Small gestures of care may make affection easier to give and receive.',
    friction:
      'Keeping the peace may compete with naming what would actually feel caring or mutual.',
    practice:
      'Ask for one specific form of comfort while leaving room for the other person’s preferences.',
    reflection: 'What kind of care would feel nourishing and mutual?',
  },
  'Moon:Mars': {
    title: 'Feelings and responses',
    potential:
      'Emotional awareness may help you act on a need or state a boundary clearly.',
    friction:
      'A strong feeling may invite a faster response than the situation requires.',
    practice:
      'Pause long enough to name the need, then choose an action that addresses it directly.',
    reflection:
      'What is the feeling asking for, and what response would serve that need?',
  },
  'Moon:Jupiter': {
    title: 'Belonging and possibility',
    potential:
      'Generosity or a broader view may make room for feelings that have seemed difficult to hold.',
    friction:
      'The urge to reassure or offer more may lead you to overlook a smaller, more immediate need.',
    practice:
      'Offer encouragement alongside a realistic promise you can comfortably keep.',
    reflection:
      'What would help me feel supported without needing everything to be resolved?',
  },
  'Moon:Saturn': {
    title: 'Care and responsibility',
    potential:
      'A dependable routine or clear boundary may give emotional needs somewhere steady to rest.',
    friction:
      'The need for comfort may sit uneasily beside a duty or expectation. You might notice a tendency to carry things alone.',
    practice:
      'Name one real responsibility and one need for care, then make a small plan that respects both.',
    reflection:
      'What would responsible care look like if my needs counted too?',
  },
  'Moon:Uranus': {
    title: 'Safety and space',
    potential:
      'A little novelty or room to choose may refresh a familiar emotional routine.',
    friction:
      'The need for predictability may meet an equally real wish for space or change.',
    practice:
      'Keep one comforting anchor while trying a small change you can reverse.',
    reflection: 'What could change without taking away my sense of safety?',
  },
  'Moon:Neptune': {
    title: 'Sensitivity and imagination',
    potential:
      'Music, art, or quiet attention may offer a gentle way to make space for feelings.',
    friction:
      'It may be difficult to tell an immediate feeling from an assumption about what someone else feels.',
    practice:
      'Notice your own experience first, and ask rather than assume when another person is involved.',
    reflection:
      'What belongs to my experience, and what am I imagining about someone else’s?',
  },
  'Moon:Pluto': {
    title: 'Emotional depth',
    potential:
      'Patient attention may reveal the need beneath a familiar protective response.',
    friction:
      'A strong reaction may carry more history than the present situation alone can explain.',
    practice:
      'Give the feeling space without demanding an immediate disclosure, decision, or resolution.',
    reflection: 'What might this reaction be trying to protect?',
  },
  'Mercury:Venus': {
    title: 'Words that connect',
    potential:
      'Curiosity and a thoughtful choice of words may help people understand each other’s preferences.',
    friction:
      'A wish to sound agreeable may obscure the point you actually need to make.',
    practice:
      'Say one honest preference kindly and invite an equally honest response.',
    reflection: 'How can I be both clear and considerate?',
  },
  'Mercury:Mars': {
    title: 'Speaking with intention',
    potential:
      'Clear thinking and initiative may help a discussion lead to a useful decision.',
    friction:
      'Speed or certainty may make it tempting to answer before understanding the question.',
    practice:
      'Check one assumption before sending a message or pressing for an answer.',
    reflection:
      'What would a direct response sound like without unnecessary force?',
  },
  'Mercury:Jupiter': {
    title: 'Details and the wider view',
    potential:
      'A broader perspective may help connect facts into a useful idea or learning opportunity.',
    friction:
      'A compelling story may move faster than the evidence supporting it.',
    practice:
      'Write the larger idea beside the facts you can verify and the questions still open.',
    reflection:
      'Which detail would most improve my understanding of the bigger picture?',
  },
  'Mercury:Saturn': {
    title: 'Clarity through patience',
    potential:
      'Careful thought and a little structure may make a complicated task easier to approach.',
    friction:
      'The desire to be correct may harden into self-criticism or reluctance to ask a question.',
    practice:
      'Break the problem into one answerable question and allow a first draft to be imperfect.',
    reflection:
      'What needs careful thought, and what am I judging before I have explored it?',
  },
  'Mercury:Uranus': {
    title: 'A different perspective',
    potential:
      'An unexpected connection may suggest a new way to understand or communicate an idea.',
    friction:
      'Too many new possibilities may make it hard to finish a thought or hear another perspective.',
    practice:
      'Capture the idea, then test one part of it before changing the whole approach.',
    reflection: 'Which fresh idea is worth slowing down to examine?',
  },
  'Mercury:Neptune': {
    title: 'Imagination and discernment',
    potential:
      'Images, metaphor, or intuition may offer language for something difficult to express directly.',
    friction:
      'An impression may feel persuasive even when the details remain unclear.',
    practice:
      'Let creative ideas develop freely, and verify practical facts separately.',
    reflection:
      'What do I know, what do I sense, and what still needs checking?',
  },
  'Mercury:Pluto': {
    title: 'Looking beneath the surface',
    potential:
      'Focused curiosity may help you ask a more revealing question about a recurring issue.',
    friction:
      'The search for an answer may become a demand for certainty or a suspicion that every word hides something.',
    practice:
      'Ask one open question and leave room for an answer you did not anticipate.',
    reflection: 'Am I looking for understanding, or for a particular answer?',
  },
  'Venus:Mars': {
    title: 'Desire and reciprocity',
    potential:
      'Preference and initiative may work together in an honest invitation or creative act.',
    friction:
      'Wanting closeness and wanting things your own way may pull against each other.',
    practice:
      'Express a desire clearly while making room for a different preference or a no.',
    reflection: 'What would make this exchange feel wanted on both sides?',
  },
  'Venus:Jupiter': {
    title: 'Enjoyment and generosity',
    potential:
      'Appreciation may become easier to express through a shared pleasure or generous gesture.',
    friction:
      'The appeal of more may distract from what already feels satisfying or sustainable.',
    practice:
      'Choose one pleasure you can enjoy fully within your actual time and resources.',
    reflection: 'What feels abundant without needing to become bigger?',
  },
  'Venus:Saturn': {
    title: 'Care that can last',
    potential:
      'Consistency and honest boundaries may give affection or a valued project greater substance.',
    friction:
      'A wish for reassurance may meet limits on time, availability, or what someone can offer.',
    practice:
      'Clarify one expectation and notice the forms of care that can realistically be sustained.',
    reflection: 'Which boundary could make care more dependable?',
  },
  'Venus:Uranus': {
    title: 'Connection with room to breathe',
    potential:
      'A new shared experience may bring freshness to a relationship, preference, or creative practice.',
    friction:
      'The wish for closeness may sit beside a wish to change the usual terms or have more independence.',
    practice:
      'Suggest a small experiment and talk openly about the space each person needs.',
    reflection: 'Where could more freedom support a more honest connection?',
  },
  'Venus:Neptune': {
    title: 'Beauty and idealization',
    potential:
      'Art, tenderness, or a compassionate gesture may deepen your appreciation of a connection.',
    friction:
      'An ideal image may make it difficult to see what is actually being offered or requested.',
    practice:
      'Enjoy the inspiration while checking that expectations are spoken and mutual.',
    reflection:
      'What do I appreciate about what is here, beyond what I hope it could become?',
  },
  'Venus:Pluto': {
    title: 'Values beneath attachment',
    potential:
      'Honest reflection may clarify why a bond, desire, or creative commitment matters so much.',
    friction:
      'The wish for closeness may become entangled with fear of loss or the need to control an outcome.',
    practice:
      'Name what you value without treating another person’s choices as something to manage.',
    reflection:
      'What would deepen trust while preserving both people’s agency?',
  },
  'Mars:Jupiter': {
    title: 'Courage with perspective',
    potential:
      'Confidence may help turn a worthwhile possibility into a first practical step.',
    friction:
      'Enthusiasm may encourage a larger push than your available energy or information supports.',
    practice:
      'Choose a clear aim, a manageable first step, and a point at which to reassess.',
    reflection: 'What would boldness look like at a scale I can sustain?',
  },
  'Mars:Saturn': {
    title: 'Effort and pacing',
    potential:
      'Discipline may give energy a clear sequence and make steady progress more available.',
    friction:
      'The wish to act may meet a delay, constraint, or demanding standard, inviting frustration.',
    practice:
      'Distinguish what can move now from what needs preparation, then take the next workable step.',
    reflection: 'Where would pacing serve me better than pushing harder?',
  },
  'Mars:Uranus': {
    title: 'Changing how you act',
    potential:
      'A willingness to experiment may offer a fresh route around a familiar obstacle.',
    friction:
      'An urge to break free may make an abrupt response feel more useful than it proves to be.',
    practice:
      'Try a reversible alternative and give yourself a pause before any consequential decision.',
    reflection: 'What could I do differently without acting only from urgency?',
  },
  'Mars:Neptune': {
    title: 'Action with meaning',
    potential:
      'A creative or compassionate purpose may give effort a direction that feels worthwhile.',
    friction:
      'It may be difficult to act clearly when the aim is vague or expectations are unspoken.',
    practice:
      'Define one small action and how you will know it is complete before spending more effort.',
    reflection: 'What is the concrete next step behind the inspiration?',
  },
  'Mars:Pluto': {
    title: 'Using strength deliberately',
    potential:
      'Sustained focus may help you address a difficult task or change a well-established response.',
    friction:
      'Determination may become a struggle over control if every obstacle is treated as opposition.',
    practice:
      'Direct effort toward your own choices and respect a clear stopping point.',
    reflection: 'Where would restraint make my action more effective?',
  },
  'Jupiter:Saturn': {
    title: 'Growth with foundations',
    potential:
      'A hopeful direction may gain substance through a realistic plan and patient commitment.',
    friction:
      'The wish to expand may meet limits that ask you to reconsider scale, timing, or expectations.',
    practice:
      'Keep the larger aim in view while choosing one commitment your present capacity can support.',
    reflection: 'What kind of growth could my current foundations hold?',
  },
  'Jupiter:Uranus': {
    title: 'Possibility beyond the familiar',
    potential:
      'Curiosity may open a route to learning or experimentation outside your usual assumptions.',
    friction:
      'Excitement about a new possibility may make novelty seem like evidence that it is right.',
    practice:
      'Explore one new idea while checking what would make it useful in practice.',
    reflection:
      'Which assumption am I ready to examine rather than simply reverse?',
  },
  'Jupiter:Neptune': {
    title: 'Hope and discernment',
    potential:
      'A shared ideal or imaginative vision may offer a meaningful direction for generosity.',
    friction:
      'Hope may make a sweeping promise or appealing story harder to question.',
    practice:
      'Pair an inspiring intention with one verifiable fact and a clear limit on the commitment.',
    reflection: 'How can I keep hope open while staying attentive to evidence?',
  },
  'Jupiter:Pluto': {
    title: 'Belief and influence',
    potential:
      'Looking closely at a strong conviction may reveal a more deliberate way to use influence.',
    friction:
      'Certainty about a goal may obscure whose needs or perspectives are being left out.',
    practice:
      'Ask who benefits from the outcome and invite a perspective that challenges your own.',
    reflection: 'What would responsible influence ask me to reconsider?',
  },
  'Saturn:Uranus': {
    title: 'Continuity and change',
    potential:
      'An established structure may become more useful when it makes room for a thoughtful experiment.',
    friction:
      'The wish to preserve what works may compete with a need to change what has become restrictive.',
    practice:
      'Identify one foundation to keep and one rule you can safely test or revise.',
    reflection:
      'What deserves continuity, and what is ready for a different approach?',
  },
  'Saturn:Neptune': {
    title: 'Giving a vision form',
    potential:
      'A routine or clear commitment may give a creative or compassionate intention practical expression.',
    friction:
      'An ideal may feel difficult to reconcile with real limits, or a rigid standard may crowd out imagination.',
    practice:
      'Give the vision a modest form you can sustain while allowing the plan to evolve.',
    reflection:
      'What small structure would help me care for something I believe in?',
  },
  'Saturn:Pluto': {
    title: 'Responsibility and deep change',
    potential:
      'Patient examination of a durable pattern may reveal what needs reinforcing and what can be released.',
    friction:
      'A need for control or certainty may keep an old structure in place after its purpose has changed.',
    practice:
      'Review one obligation and distinguish necessary responsibility from a habit of holding everything together.',
    reflection:
      'What am I maintaining, and does it still serve a worthwhile purpose?',
  },
  'Uranus:Neptune': {
    title: 'Imagining another way',
    potential:
      'Experiment and imagination may combine in a fresh way of thinking about a shared ideal.',
    friction:
      'A desire for a different future may become hard to distinguish from a wish to escape the present.',
    practice:
      'Translate one imaginative possibility into a small experiment with an observable result.',
    reflection:
      'Which part of the future I imagine could I begin exploring now?',
  },
  'Uranus:Pluto': {
    title: 'Change and agency',
    potential:
      'Questioning an established pattern may reveal room for a more deliberate or independent response.',
    friction:
      'The urge for change may become a struggle over who gets to decide its pace or direction.',
    practice:
      'Focus on a change within your influence and consider the people affected by it.',
    reflection:
      'What could change in a way that increases agency rather than moving control elsewhere?',
  },
  'Neptune:Pluto': {
    title: 'Meaning beneath the surface',
    potential:
      'Quiet reflection may bring attention to the deeper values carried by a shared hope or ideal.',
    friction:
      'An ideal may become difficult to question when it is bound closely to belonging or conviction.',
    practice:
      'Notice one inherited assumption and explore what it means to you in your present life.',
    reflection:
      'Which meaning feels chosen, and which have I accepted without examining it?',
  },
}

const MOON_SATURN: Record<
  AspectType,
  Pick<SkyAspectMeaning, 'meaning' | 'practice'>
> = {
  conj: {
    meaning:
      'The Moon’s themes of comfort and belonging meet Saturn’s themes of duty and limits. Care may take a practical form, though it can be easy to treat every feeling as another task to manage.',
    practice:
      'Choose a dependable act of care, such as keeping a small promise to yourself, without requiring yourself to feel composed first.',
  },
  opp: {
    meaning:
      'The Moon symbolizes emotional needs; Saturn symbolizes responsibility and boundaries. In opposition, this pairing can be read as a tension between wanting reassurance and feeling you must hold everything together. It may be a useful moment to notice where duty leaves too little room for care.',
    practice:
      'Name one real obligation and one emotional need. Set a kind boundary or ask for specific support so both have a place.',
  },
  square: {
    meaning:
      'Comfort and responsibility may seem difficult to fit into the same plan. This pairing invites reflection on habits of self-criticism, withholding a need, or pushing through when an expectation needs adjusting.',
    practice:
      'Rework one expectation that leaves no room for rest or support. A smaller commitment can still be a responsible one.',
  },
  trine: {
    meaning:
      'Emotional care and consistency are symbolically working together. A familiar routine, dependable connection, or calm boundary may be worth leaning into without making care conditional on productivity.',
    practice:
      'Make use of one reliable source of support, and notice which small routines help you feel steadier.',
  },
  sextile: {
    meaning:
      'There is a symbolic opening to support an emotional need with something practical. A little planning or a clear request may make care easier to give or receive.',
    practice:
      'Arrange one small support in advance: ask for a check-in, protect a break, or simplify an obligation.',
  },
}

/** Symmetric pair lookup; unsupported data receives no invented interpretation. */
export function getSkyAspectMeaning(
  a: string,
  b: string,
  type: AspectType
): SkyAspectMeaning | null {
  const first = SKY_PLANETS.indexOf(a as PlanetKey)
  const second = SKY_PLANETS.indexOf(b as PlanetKey)
  if (
    first < 0 ||
    second < 0 ||
    first === second ||
    !Object.prototype.hasOwnProperty.call(SKY_ASPECT_DYNAMICS, type)
  )
    return null
  const key = first < second ? `${a}:${b}` : `${b}:${a}`
  const pair = SKY_PAIR_THEMES[key]
  if (!pair) return null
  const custom = key === 'Moon:Saturn' ? MOON_SATURN[type] : undefined
  const slow = Math.min(first, second) >= SKY_PLANETS.indexOf('Jupiter')
  const experience =
    type === 'opp' || type === 'square' ? pair.friction : pair.potential
  return {
    title: pair.title,
    dynamic: SKY_ASPECT_DYNAMICS[type],
    meaning:
      (custom?.meaning ?? experience) +
      (slow
        ? ' With two slower-moving planets, this is a longer background theme rather than a prediction for this particular day.'
        : ''),
    practice: custom?.practice ?? pair.practice,
    reflection: pair.reflection,
  }
}
