// components/charts/ChartCompass.tsx
import React, { useState } from 'react'
import { View, Text, StyleSheet, ViewStyle, Pressable } from 'react-native'
import Svg, { Line as SvgLine } from 'react-native-svg'
import { AppText } from '../ui/AppText'
import { Card } from '../ui/Card'
import { Icon } from '../ui/Icon'
import { theme } from '../ui/theme'

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
    <Card style={style}>
      {/* Header / Toggle */}
      <Pressable
        testID="glyph-compass-toggle"
        accessibilityRole="button"
        accessibilityLabel="Glyph Compass"
        accessibilityHint={open ? 'Collapse the legend' : 'Expand the legend'}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <AppText variant="heading" style={styles.title}>
          Glyph Compass
        </AppText>
        <Icon name={open ? 'collapse' : 'expand'} size="md" />
      </Pressable>

      <AppText variant="caption" style={styles.sub}>
        Stays inline while you scroll.
      </AppText>

      {!open ? null : (
        <>
          {/* Planets */}
          <AppText variant="eyebrow" style={styles.section}>Planets</AppText>
          <View style={styles.grid2}>
            {Object.entries(PLANET_GLYPH).map(([name, glyph]) => (
              <View key={name} style={styles.row}>
                <Text style={styles.glyph}>{glyph}</Text>
                <Text style={styles.label}>{name}</Text>
              </View>
            ))}
          </View>

          {/* Signs */}
          <AppText variant="eyebrow" style={styles.section}>Signs</AppText>
          <View style={styles.grid2}>
            {SIGN_INFO.map((s) => (
              <View key={s.abbr} style={styles.row}>
                <Text style={styles.glyph}>{s.glyph}</Text>
                <Text style={styles.label}>{`${s.abbr} · ${s.name}`}</Text>
              </View>
            ))}
          </View>

          {/* Aspects */}
          <AppText variant="eyebrow" style={styles.section}>Aspects</AppText>
          <View style={styles.grid2}>
            <LegendLine label="Conjunction · 0°" variant="conj" />
            <LegendLine label="Opposition · 180°" variant="opp" />
            <LegendLine label="Square · 90°" variant="square" />
            <LegendLine label="Trine · 120°" variant="trine" />
            <LegendLine label="Sextile · 60°" variant="sextile" />
          </View>

          <AppText variant="caption" style={styles.hint}>
            Tip: sextiles are dashed; trines are thicker.
          </AppText>
        </>
      )}
    </Card>
  )
}

function LegendLine({ label, variant = 'conj' }: LegendLineProps) {
  // Use SVG so dashed is consistent across platforms
  const stroke =
    variant === 'trine'
      ? theme.text.secondary
      : theme.text.tertiary

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: theme.touchTarget.min,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    flex: 1,
    color: theme.text.primary,
  },
  sub: {
    color: theme.text.tertiary,
    marginBottom: theme.space.xs,
  },

  section: {
    marginTop: theme.space.md,
    marginBottom: theme.space.xs,
    color: theme.accent.base,
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
    color: theme.accent.base,
    fontSize: 16,
    width: 26,
    textAlign: 'center',
    marginRight: 6,
  },

  label: {
    color: theme.text.secondary,
    fontSize: 14,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },

  hint: {
    marginTop: theme.space.md,
    color: theme.text.tertiary,
    textAlign: 'center',
  },
})
