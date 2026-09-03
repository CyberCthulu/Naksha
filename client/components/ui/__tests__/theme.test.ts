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
