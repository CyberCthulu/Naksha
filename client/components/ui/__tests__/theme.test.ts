import { theme } from '../theme'

describe('V1 compatibility keys', () => {
  // These guard the migration contract: importing the V2 token layer must not
  // repaint a single existing screen. Every value below is the pre-V2 value.
  it('keeps every legacy color at its original value', () => {
    expect(theme.colors).toEqual({
      text: '#fff',
      muted: 'rgba(255,255,255,0.75)',
      sub: 'rgba(255,255,255,0.85)',
      border: 'rgba(255,255,255,0.4)',
      cardBg: 'rgba(0,0,0,0.35)',
      textOnLight: '#11151F',
      danger: 'crimson',
    })
  })

  it('keeps textOnLight from the Slice 1A contrast fix', () => {
    expect(theme.colors.textOnLight).toBe('#11151F')
  })

  it('keeps legacy spacing and the legacy card radius', () => {
    expect(theme.spacing).toEqual({ screen: 20, top: 40, card: 14 })
    expect(theme.radius.card).toBe(12)
  })

  it('does not alias legacy keys onto visually different V2 roles', () => {
    // If any of these ever become equal, the legacy key has been re-pointed and
    // every screen still using it has been silently repainted.
    expect(theme.colors.text).not.toBe(theme.text.primary)
    expect(theme.colors.muted).not.toBe(theme.text.secondary)
    expect(theme.colors.sub).not.toBe(theme.text.secondary)
    expect(theme.colors.border).not.toBe(theme.border.base)
    expect(theme.colors.cardBg).not.toBe(theme.surface.base)
    expect(theme.colors.danger).not.toBe(theme.state.danger)
    expect(theme.spacing.card).not.toBe(theme.space.lg)
  })
})

describe('V2 semantic tokens', () => {
  it('defines the environment, surfaces and scrim', () => {
    expect(theme.background).toEqual({
      base: '#080B14',
      raised: '#0E1322',
      sunken: '#05070E',
    })
    expect(theme.surface).toEqual({
      base: '#131A2C',
      raised: '#1A2238',
      selected: 'rgba(201,164,92,0.10)',
    })
    expect(theme.scrim).toBe('rgba(4,6,12,0.72)')
  })

  it('defines borders and text roles', () => {
    expect(theme.border).toEqual({
      base: 'rgba(214,222,240,0.10)',
      strong: 'rgba(214,222,240,0.18)',
      accent: 'rgba(201,164,92,0.38)',
    })
    expect(theme.text).toEqual({
      primary: '#F4EFE6',
      secondary: '#A9B2CC',
      tertiary: '#7F8AA8',
      disabled: '#4E566E',
      onAccent: '#0A0E1A',
    })
  })

  it('defines the single warm gold and its reserved bright variant', () => {
    expect(theme.accent.base).toBe('#C9A45C')
    expect(theme.accent.bright).toBe('#E3C078')
    expect(theme.accent.muted).toBe('rgba(201,164,92,0.14)')
    expect(theme.accent.border).toBe('rgba(201,164,92,0.38)')
  })

  it('defines state colors with muted fills', () => {
    expect(theme.state.danger).toBe('#E5736B')
    expect(theme.state.warning).toBe('#D9A441')
    expect(theme.state.success).toBe('#6FBF8B')
    expect(theme.state.info).toBe('#7FA8D9')

    for (const muted of [
      theme.state.dangerMuted,
      theme.state.warningMuted,
      theme.state.successMuted,
      theme.state.infoMuted,
    ]) {
      expect(muted).toMatch(/^rgba\(\d+,\d+,\d+,0\.12\)$/)
    }
  })

  it('defines exactly the ten supported planet accents', () => {
    expect(Object.keys(theme.planet)).toEqual([
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
    ])
    expect(theme.planet.Sun).toBe('#E8B44A')
    expect(theme.planet.Mars).toBe('#C7563A')
    expect(theme.planet.Neptune).toBe('#7D94D9')
  })

  it('defines the spacing scale', () => {
    expect(theme.space).toEqual({
      none: 0,
      hair: 2,
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      xxl: 24,
      xxxl: 32,
      xxxxl: 40,
      xxxxxl: 48,
    })
  })

  it('defines the radius scale alongside the legacy card radius', () => {
    expect(theme.radius.none).toBe(0)
    expect(theme.radius.xs).toBe(4)
    expect(theme.radius.sm).toBe(8)
    expect(theme.radius.md).toBe(12)
    expect(theme.radius.lg).toBe(16)
    expect(theme.radius.xl).toBe(20)
    expect(theme.radius.pill).toBe(999)
  })

  it('expresses elevation without shadows', () => {
    expect(theme.elevation.level0.backgroundColor).toBe(theme.background.base)
    expect(theme.elevation.level1.backgroundColor).toBe(theme.surface.base)
    expect(theme.elevation.level1.borderColor).toBe(theme.border.base)
    expect(theme.elevation.level2.backgroundColor).toBe(theme.surface.raised)
    expect(theme.elevation.level3.borderColor).toBe(theme.border.accent)

    // Depth is background steps plus a hairline, never a shadow.
    const serialized = JSON.stringify(theme.elevation)
    expect(serialized).not.toMatch(/shadow/i)
    expect(serialized).not.toMatch(/elevation":\s*[1-9]/)
  })

  it('defines icon sizing, touch targets and motion budgets', () => {
    expect(theme.icon.sm).toBe(16)
    expect(theme.icon.md).toBe(20)
    expect(theme.icon.lg).toBe(24)
    expect(theme.icon.xl).toBe(28)
    expect(theme.icon.stroke.md).toBe(1.75)
    expect(theme.icon.stroke.lg).toBe(1.5)

    expect(theme.touchTarget.min).toBe(48)

    expect(theme.motion.enter).toBe(150)
    expect(theme.motion.exit).toBe(120)
  })
})

describe('typography roles', () => {
  const SERIF = 'CormorantGaramond_600SemiBold'

  it('exposes exactly the eleven approved roles', () => {
    expect(Object.keys(theme.typography)).toEqual([
      'display',
      'title',
      'heading',
      'subheading',
      'eyebrow',
      'bodyLarge',
      'body',
      'bodySmall',
      'caption',
      'button',
      'numeric',
    ])
  })

  it('uses the serif only for display, title and heading', () => {
    expect(theme.typography.display.fontFamily).toBe(SERIF)
    expect(theme.typography.title.fontFamily).toBe(SERIF)
    expect(theme.typography.heading.fontFamily).toBe(SERIF)

    const serifRoles = Object.entries(theme.typography)
      .filter(([, style]) => style.fontFamily === SERIF)
      .map(([name]) => name)
    expect(serifRoles).toEqual(['display', 'title', 'heading'])
  })

  it('maps each sans role to its registered weight family', () => {
    expect(theme.typography.subheading.fontFamily).toBe('Inter_600SemiBold')
    expect(theme.typography.eyebrow.fontFamily).toBe('Inter_600SemiBold')
    expect(theme.typography.button.fontFamily).toBe('Inter_600SemiBold')
    expect(theme.typography.bodyLarge.fontFamily).toBe('Inter_400Regular')
    expect(theme.typography.body.fontFamily).toBe('Inter_400Regular')
    expect(theme.typography.bodySmall.fontFamily).toBe('Inter_400Regular')
    expect(theme.typography.caption.fontFamily).toBe('Inter_400Regular')
    expect(theme.typography.numeric.fontFamily).toBe('Inter_500Medium')
  })

  it('carries the approved sizes and line heights', () => {
    const metrics = Object.fromEntries(
      Object.entries(theme.typography).map(([name, style]) => [
        name,
        [style.fontSize, style.lineHeight],
      ])
    )

    expect(metrics).toEqual({
      display: [32, 38],
      title: [26, 32],
      heading: [20, 26],
      subheading: [15, 20],
      eyebrow: [12, 16],
      bodyLarge: [16, 26],
      body: [15, 23],
      bodySmall: [13, 20],
      caption: [12, 16],
      button: [15, 20],
      numeric: [14, 20],
    })
  })

  it('applies the approved letter spacing', () => {
    expect(theme.typography.display.letterSpacing).toBe(-0.5)
    expect(theme.typography.title.letterSpacing).toBe(-0.3)
    expect(theme.typography.heading.letterSpacing).toBe(-0.2)
    expect(theme.typography.button.letterSpacing).toBe(0.2)
  })

  it('gives eyebrow positive tracking and uppercase transform', () => {
    expect(theme.typography.eyebrow.letterSpacing).toBe(0.8)
    expect(theme.typography.eyebrow.textTransform).toBe('uppercase')
  })

  it('gives the numeric role tabular figures', () => {
    expect(theme.typography.numeric.fontVariant).toEqual(['tabular-nums'])
  })

  it('disables Android font padding so lineHeight is the only authority', () => {
    // Android otherwise adds space from the font's own ascent/descent metrics
    // on top of lineHeight, which for a low-x-height serif reads as a large
    // unexplained gap above the text.
    for (const [name, style] of Object.entries(theme.typography)) {
      expect([name, style.includeFontPadding]).toEqual([name, false])
    }
  })

  it('never pairs a weight-specific family with a fontWeight', () => {
    // expo-font registers each weight as its own family. Adding fontWeight on
    // top asks the platform to synthesize a weight it already has, which is how
    // faux-bold and faux-thin appear on Android.
    for (const [name, style] of Object.entries(theme.typography)) {
      expect([name, 'fontWeight' in style]).toEqual([name, false])
    }
  })
})
