// components/ui/theme.ts
export const theme = {
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
  radius: {
    card: 12,
  },
} as const
