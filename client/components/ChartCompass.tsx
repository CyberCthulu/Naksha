// components/ChartCompass.tsx
import React, { useState } from 'react'
import { View, Text, StyleSheet, ViewStyle, Pressable } from 'react-native'
import Svg, { Line as SvgLine } from 'react-native-svg'
import { theme } from './ui/theme'
import { uiStyles } from './ui/uiStyles'

export const PLANET_GLYPH: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
}

export const SIGN_INFO = [
  { abbr: 'Ar', name: 'Aries', glyph: '♈︎' },
  { abbr: 'Ta', name: 'Taurus', glyph: '♉︎' },
  { abbr: 'Ge', name: 'Gemini', glyph: '♊︎' },
  { abbr: 'Cn', name: 'Cancer', glyph: '♋︎' },
  { abbr: 'Le', name: 'Leo', glyph: '♌︎' },
  { abbr: 'Vi', name: 'Virgo', glyph: '♍︎' },
  { abbr: 'Li', name: 'Libra', glyph: '♎︎' },
  { abbr: 'Sc', name: 'Scorpio', glyph: '♏︎' },
  { abbr: 'Sg', name: 'Sagittarius', glyph: '♐︎' },
  { abbr: 'Cp', name: 'Capricorn', glyph: '♑︎' },
  { abbr: 'Aq', name: 'Aquarius', glyph: '♒︎' },
  { abbr: 'Pi', name: 'Pisces', glyph: '♓︎' },
] as const

type Props = {
  style?: ViewStyle
  defaultOpen?: boolean
}

type AspectVariant = 'conj' | 'opp' | 'square' | 'trine' | 'sextile'
type LegendLineProps = { label: string; variant?: AspectVariant }

export default function ChartCompass({ style, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <View style={[uiStyles.card, styles.card, style]}>
      {/* Header / Toggle */}
      <Pressable onPress={() => setOpen((v) => !v)} style={styles.header}>
        <Text style={styles.title}>Glyph Compass</Text>
        <Text style={styles.chev}>{open ? '˄' : '˅'}</Text>
      </Pressable>

      <Text style={styles.sub}>
        Tap to {open ? 'collapse' : 'expand'} (stays inline while you scroll).
      </Text>

      {!open ? null : (
        <>
          {/* Planets */}
          <Text style={styles.section}>Planets</Text>
          <View style={styles.grid2}>
            {Object.entries(PLANET_GLYPH).map(([name, glyph]) => (
              <View key={name} style={styles.row}>
                <Text style={styles.glyph}>{glyph}</Text>
                <Text style={styles.label}>{name}</Text>
              </View>
            ))}
          </View>

          {/* Signs */}
          <Text style={styles.section}>Signs</Text>
          <View style={styles.grid2}>
            {SIGN_INFO.map((s) => (
              <View key={s.abbr} style={styles.row}>
                <Text style={styles.glyph}>{s.glyph}</Text>
                <Text style={styles.label}>{`${s.abbr} · ${s.name}`}</Text>
              </View>
            ))}
          </View>

          {/* Aspects */}
          <Text style={styles.section}>Aspects</Text>
          <View style={styles.grid2}>
            <LegendLine label="Conjunction · 0°" variant="conj" />
            <LegendLine label="Opposition · 180°" variant="opp" />
            <LegendLine label="Square · 90°" variant="square" />
            <LegendLine label="Trine · 120°" variant="trine" />
            <LegendLine label="Sextile · 60°" variant="sextile" />
          </View>

          <Text style={styles.hint}>
            Tip: sextiles are dashed; trines are thicker.
          </Text>
        </>
      )}
    </View>
  )
}

function LegendLine({ label, variant = 'conj' }: LegendLineProps) {
  // Use SVG so dashed is consistent across platforms
  const stroke =
    variant === 'trine'
      ? 'rgba(255,255,255,0.75)'
      : 'rgba(255,255,255,0.55)'

  const strokeWidth =
    variant === 'trine' ? 2.2 : variant === 'square' ? 1.8 : 1.4

  const dash =
    variant === 'sextile'
      ? '4 4'
      : variant === 'trine'
      ? undefined
      : variant === 'opp'
      ? undefined
      : variant === 'square'
      ? undefined
      : undefined

  return (
    <View style={styles.row}>
      <Svg width={28} height={14} style={{ marginRight: 8 }}>
        <SvgLine
          x1="2"
          y1="7"
          x2="26"
          y2="7"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
  },
  title: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  chev: {
    width: 28,
    textAlign: 'right',
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sub: {
    color: theme.colors.sub,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 6,
  },

  section: {
    marginTop: 10,
    marginBottom: 6,
    color: theme.colors.sub,
    fontWeight: '800',
  },

  grid2: { flexDirection: 'row', flexWrap: 'wrap' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    paddingVertical: 4,
    paddingRight: 12,
    minWidth: 0,
  },

  glyph: {
    color: theme.colors.text,
    fontSize: 16,
    width: 26,
    textAlign: 'center',
    marginRight: 6,
  },

  label: {
    color: theme.colors.text,
    fontSize: 14,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },

  hint: {
    marginTop: 10,
    color: theme.colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
})
