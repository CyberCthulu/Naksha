// components/ui/theme.ts
//
// Two layers live here during the V2 migration:
//
//   1. DEPRECATED V1 COMPATIBILITY — `colors`, `spacing`, and `radius.card`.
//      These keep their exact original values. They are NOT aliases of the V2
//      roles below. Pointing them at V2 values would repaint every screen the
//      moment this file is imported, which is precisely what the staged
//      migration is designed to avoid. They are removed per-screen as each
//      surface migrates.
//
//   2. V2 SEMANTIC ROLES — everything else. Nothing consumes these yet beyond
//      the Background primitive; screens adopt them in later slices.
//
// See docs/ui-redesign/design-system.md for the approved values and the rules
// governing accent and planet usage.

// ---------------------------------------------------------------------------
// V2 palette primitives
// ---------------------------------------------------------------------------

const background = {
  /** App root. The deep navy near-black environment. */
  base: '#080B14',
  /** Upper gradient stop; hero background lift. */
  raised: '#0E1322',
  /** Input wells; the recessed area behind a field. */
  sunken: '#05070E',
} as const

const surface = {
  /** Default card. Opaque, unlike the translucent V1 cardBg. */
  base: '#131A2C',
  /** Sheets, modals, pressed cards, dropdowns. */
  raised: '#1A2238',
  /** Selected list row. */
  selected: 'rgba(201,164,92,0.10)',
} as const

const border = {
  base: 'rgba(214,222,240,0.10)',
  strong: 'rgba(214,222,240,0.18)',
  accent: 'rgba(201,164,92,0.38)',
} as const

const text = {
  /** Ivory. 16.2:1 on background.base, 14.9:1 on surface.base. */
  primary: '#F4EFE6',
  /** Muted slate-lavender. 8.9:1 / 8.2:1. */
  secondary: '#A9B2CC',
  /** Dim slate. 5.5:1 / 5.0:1. */
  tertiary: '#7F8AA8',
  /** Inert controls only. Deliberately below AA; never for content. */
  disabled: '#4E566E',
  /** On an accent fill. 7.9:1 on accent.base. */
  onAccent: '#0A0E1A',
} as const

const accent = {
  /** The single warm gold. */
  base: '#C9A45C',
  /** Reserved for the hero glyph or the currently focused planet. */
  bright: '#E3C078',
  muted: 'rgba(201,164,92,0.14)',
  border: 'rgba(201,164,92,0.38)',
} as const

const state = {
  danger: '#E5736B',
  dangerMuted: 'rgba(229,115,107,0.12)',
  warning: '#D9A441',
  warningMuted: 'rgba(217,164,65,0.12)',
  success: '#6FBF8B',
  successMuted: 'rgba(111,191,139,0.12)',
  info: '#7FA8D9',
  infoMuted: 'rgba(127,168,217,0.12)',
} as const

/**
 * At most one planet accent is active at a time, driven by the existing
 * SpaceProvider focus contract. Permitted only on chart glyphs, the hero
 * background glow, and interpretation eyebrow rules.
 */
const planet = {
  Sun: '#E8B44A',
  Moon: '#B9C2D6',
  Mercury: '#A8B0C8',
  Venus: '#E0BE96',
  Mars: '#C7563A',
  Jupiter: '#D6B98C',
  Saturn: '#CBB577',
  Uranus: '#7FC4C4',
  Neptune: '#7D94D9',
  Pluto: '#A98A7C',
} as const

const scrim = 'rgba(4,6,12,0.72)'

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export const theme = {
  // === DEPRECATED V1 COMPATIBILITY — exact original values, do not re-point ===
  colors: {
    text: '#fff',
    muted: 'rgba(255,255,255,0.75)',
    sub: 'rgba(255,255,255,0.85)',
    border: 'rgba(255,255,255,0.4)',
    cardBg: 'rgba(0,0,0,0.35)',
    // Opaque dark ink for text sitting on a light surface (e.g. the primary
    // Button's white background). cardBg is a translucent surface fill and must
    // not be used as a text color.
    textOnLight: '#11151F',
    danger: 'crimson',
  },
  spacing: {
    screen: 20,
    top: 40,
    card: 14,
  },

  // === V2 SEMANTIC ROLES ===
  background,
  surface,
  border,
  text,
  accent,
  state,
  planet,
  scrim,

  space: {
    none: 0,
    /** Optical nudges only. */
    hair: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    /** Screen gutter. */
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 40,
    xxxxxl: 48,
  },

  radius: {
    /** DEPRECATED V1 key. Same value as radius.md; kept for existing callers. */
    card: 12,
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },

  /**
   * Depth comes from background lightness steps plus a hairline border.
   * There are deliberately no shadows: shadowColor and elevation are invisible
   * against a near-black environment and cost real Android overdraw.
   */
  elevation: {
    level0: {
      backgroundColor: background.base,
      borderColor: 'transparent',
      borderWidth: 0,
    },
    level1: {
      backgroundColor: surface.base,
      borderColor: border.base,
      borderWidth: 1,
    },
    level2: {
      backgroundColor: surface.raised,
      borderColor: border.strong,
      borderWidth: 1,
    },
    level3: {
      backgroundColor: surface.selected,
      borderColor: border.accent,
      borderWidth: 1,
    },
  },

  icon: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    /** Thinner strokes at larger sizes keep optical weight even. */
    stroke: {
      sm: 1.75,
      md: 1.75,
      lg: 1.5,
      xl: 1.5,
    },
  },

  /**
   * Every standard interactive control needs an actual or enclosing pressable
   * area of at least this size. hitSlop may extend a nearly-compliant target;
   * it is never a substitute for a real touch area.
   */
  touchTarget: {
    min: 48,
  },

  /**
   * Budget only. V1 has no motion system and the backgrounds are static;
   * nothing currently animates. These exist so that any future approved
   * transition has a single source of truth rather than inventing one.
   */
  motion: {
    enter: 150,
    exit: 120,
  },
} as const

export type PlanetAccent = keyof typeof planet
