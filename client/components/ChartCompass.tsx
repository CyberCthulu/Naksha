// components/ChartCompass.tsx
import React from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'

export const PLANET_GLYPH: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
}

export const SIGN_INFO = [
  { abbr: 'Ar', name: 'Aries',       glyph: '♈︎' },
  { abbr: 'Ta', name: 'Taurus',      glyph: '♉︎' },
  { abbr: 'Ge', name: 'Gemini',      glyph: '♊︎' },
  { abbr: 'Cn', name: 'Cancer',      glyph: '♋︎' },
  { abbr: 'Le', name: 'Leo',         glyph: '♌︎' },
  { abbr: 'Vi', name: 'Virgo',       glyph: '♍︎' },
  { abbr: 'Li', name: 'Libra',       glyph: '♎︎' },
  { abbr: 'Sc', name: 'Scorpio',     glyph: '♏︎' },
  { abbr: 'Sg', name: 'Sagittarius', glyph: '♐︎' },
  { abbr: 'Cp', name: 'Capricorn',   glyph: '♑︎' },
  { abbr: 'Aq', name: 'Aquarius',    glyph: '♒︎' },
  { abbr: 'Pi', name: 'Pisces',      glyph: '♓︎' },
]

type Props = { style?: ViewStyle }

// ✅ define types BEFORE function
type AspectVariant = 'conj' | 'opp' | 'square' | 'trine' | 'sextile'
type LegendLineProps = { label: string; variant?: AspectVariant }

export default function ChartCompass({ style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title}>Glyph Compass</Text>

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
      <View style={styles.grid3}>
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
    </View>
  )
}

// ✅ typed version of LegendLine
function LegendLine({ label, variant = 'conj' }: LegendLineProps) {
  const style =
    variant === 'sextile' ? [styles.line, { borderStyle: 'dashed' as const }]
    : variant === 'trine' ? [styles.line, { borderWidth: 2 }]
    : variant === 'opp' ? [styles.line, { opacity: 0.8 }]
    : variant === 'square' ? [styles.line, { borderWidth: 1.5 }]
    : [styles.line]

  return (
    <View style={styles.row}>
      <View style={style} />
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e3e3e3',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
    gap: 6,
  },
  title: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  section: { marginTop: 6, fontWeight: '600' },
  grid2: { flexDirection: 'row', flexWrap: 'wrap' },
  grid3: { flexDirection: 'row', flexWrap: 'wrap' },
  row: { flexDirection: 'row', alignItems: 'center', width: '50%', paddingVertical: 4 },
  glyph: { fontSize: 16, width: 26, textAlign: 'center' },
  label: { fontSize: 14 },
  line: {
    width: 24,
    height: 0,
    borderBottomWidth: 1.2,
    borderColor: '#777',
    marginRight: 8,
  },
})
