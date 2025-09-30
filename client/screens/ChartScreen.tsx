// screens/ChartScreen.tsx
import React, { useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg'
import { birthToUTC } from '../lib/time'
import { computeNatalPlanets, findAspects, PlanetPos, Aspect } from '../lib/astro'
import { normalizeZone } from '../lib/timezones'

// Simple zodiac helpers
const ZODIAC = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi']
const signOf = (lon: number) => Math.floor(lon / 30)
const degInSign = (lon: number) => (lon % 30 + 30) % 30

type ProfileForChart = {
  birth_date: string | null
  birth_time: string | null
  time_zone: string | null
  first_name?: string | null
  last_name?: string | null
}

export default function ChartScreen({ route }: any) {
  const { profile } = route.params as { profile: ProfileForChart }

  // Defensive: if anything is missing, show a helpful message
  if (!profile?.birth_date || !profile?.birth_time || !profile?.time_zone) {
    return (
      <View style={[styles.container, { alignItems: 'center' }]}>
        <Text style={styles.h1}>Natal Chart</Text>
        <Text style={{ opacity: 0.8, textAlign: 'center' }}>
          Missing birth date, time, or time zone. Please complete your profile.
        </Text>
      </View>
    )
  }

  // Normalize time zone (handles PST/EST/etc -> IANA, and validates IANA strings)
  const tz = normalizeZone(profile.time_zone)
  if (!tz) {
    return (
      <View style={[styles.container, { alignItems: 'center' }]}>
        <Text style={styles.h1}>Natal Chart</Text>
        <Text style={{ opacity: 0.8, textAlign: 'center' }}>
          Your saved time zone isn’t valid. Please update it in “Complete Profile”.
        </Text>
        <Text style={{ opacity: 0.6, marginTop: 6 }}>
          Current value: {String(profile.time_zone)}
        </Text>
      </View>
    )
  }

  const { planets, aspects } = useMemo(() => {
    const { jsDate } = birthToUTC(profile.birth_date!, profile.birth_time!, tz)
    const ps: PlanetPos[] = computeNatalPlanets(jsDate)
    const asps: Aspect[] = findAspects(ps)
    return { planets: ps, aspects: asps }
  }, [profile.birth_date, profile.birth_time, tz])

  const size = 300
  const cx = size / 2
  const cy = size / 2
  const rOuter = size / 2 - 8
  const rInner = rOuter - 22
  const rPlanets = (rOuter + rInner) / 2

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>
        {`Natal Chart${profile.first_name ? ` — ${profile.first_name}` : ''}`}
      </Text>

      <Svg width={size} height={size}>
        {/* Rings */}
        <Circle cx={cx} cy={cy} r={rOuter} stroke="#ccc" strokeWidth={1} fill="none" />
        <Circle cx={cx} cy={cy} r={rInner} stroke="#eee" strokeWidth={1} fill="none" />

        {/* 12 sign dividers + labels */}
        {Array.from({ length: 12 }).map((_, i) => {
          const ang = (i * 30 * Math.PI) / 180
          const x1 = cx + Math.cos(-ang + Math.PI / 2) * rInner
          const y1 = cy + Math.sin(-ang + Math.PI / 2) * rInner
          const x2 = cx + Math.cos(-ang + Math.PI / 2) * rOuter
          const y2 = cy + Math.sin(-ang + Math.PI / 2) * rOuter
          const lx = cx + Math.cos(-ang + Math.PI / 2) * (rOuter + 10)
          const ly = cy + Math.sin(-ang + Math.PI / 2) * (rOuter + 10)
          return (
            <G key={i}>
              <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#bbb" strokeWidth={1} />
              <SvgText x={lx} y={ly} fontSize="10" textAnchor="middle" alignmentBaseline="middle">
                {ZODIAC[i]}
              </SvgText>
            </G>
          )
        })}

        {/* Planets */}
        {planets.map((p) => {
          const ang = (p.lon * Math.PI) / 180
          const x = cx + Math.cos(-ang + Math.PI / 2) * rPlanets
          const y = cy + Math.sin(-ang + Math.PI / 2) * rPlanets
          const label = p.name[0] // placeholder glyph
          return (
            <G key={p.name}>
              <Circle cx={x} cy={y} r={8} fill="#222" />
              <SvgText
                x={x}
                y={y + 0.5}
                fontSize="8"
                fill="#fff"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {label}
              </SvgText>
            </G>
          )
        })}
      </Svg>

      <Text style={styles.h2}>Positions</Text>
      {planets.map((p) => {
        const s = signOf(p.lon)
        const deg = degInSign(p.lon)
        return (
          <Text key={p.name} style={styles.row}>
            {p.name.padEnd(7)} {ZODIAC[s]} {deg.toFixed(2)}°
          </Text>
        )
      })}

      <Text style={styles.h2}>Aspects</Text>
      {aspects.length === 0 ? (
        <Text style={styles.muted}>None (within default orbs)</Text>
      ) : (
        aspects.map((a, i) => (
          <Text key={`${a.a}-${a.b}-${i}`} style={styles.row}>
            {a.a} {a.type} {a.b} (orb {a.orb}°)
          </Text>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  h1: { fontSize: 18, fontWeight: '600', marginBottom: 10, alignSelf: 'center' },
  h2: { fontSize: 16, fontWeight: '600', marginTop: 16, alignSelf: 'flex-start' },
  row: { fontFamily: 'monospace' as any, alignSelf: 'flex-start' },
  muted: { opacity: 0.7, alignSelf: 'flex-start' },
})
