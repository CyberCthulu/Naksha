// screens/ChartScreen.tsx
import React, { useMemo, useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Alert, Button, ActivityIndicator } from 'react-native'
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg'
import { birthToUTC } from '../lib/time'
import { computeNatalPlanets, findAspects, PlanetPos, Aspect } from '../lib/astro'
import { normalizeZone } from '../lib/timezones'
import ChartCompass from '../components/ChartCompass'
import supabase from '../lib/supabase'
import { saveChart } from '../lib/charts'

// Simple zodiac helpers
const ZODIAC = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi']
const signOf = (lon: number) => Math.floor(lon / 30)
const degInSign = (lon: number) => ((lon % 30) + 30) % 30

const GLYPH: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
}

type ProfileForChart = {
  birth_date: string | null
  birth_time: string | null
  time_zone: string | null
  first_name?: string | null
  last_name?: string | null
}

export default function ChartScreen({ route }: any) {
  const { profile } = route.params as { profile: ProfileForChart }
  const { width } = useWindowDimensions()

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
    const asps: Aspect[] = findAspects(ps) // make sure this is the fixed version
    return { planets: ps, aspects: asps }
  }, [profile.birth_date, profile.birth_time, tz])

  // Sizing
  const maxChart = 360
  const pad = 16 // SVG viewBox padding to prevent clip
  const size = Math.min(Math.max(280, width - 32), maxChart) // 16px screen margin each side
  const cx = size / 2
  const cy = size / 2
  const rOuter = size / 2 - 8
  const rInner = rOuter - 26
  const rPlanets = (rOuter + rInner) / 2
  const rAspect = rInner - 6 // draw lines inside the inner ring

  // angle helpers (SVG y axis goes down, so rotate by +90 and invert)
  const toXY = (lonDeg: number, radius: number) => {
    const ang = (lonDeg * Math.PI) / 180
    const x = cx + Math.cos(-ang + Math.PI / 2) * radius
    const y = cy + Math.sin(-ang + Math.PI / 2) * radius
    return { x, y }
  }

  // style aspect lines by type (grayscale styling)
  const aspectStroke: Record<Aspect['type'], number> = {
    conj: 2.0, opp: 1.8, trine: 1.6, square: 1.6, sextile: 1.2
  }

const onSave = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Alert.alert('Not signed in')

  try {
    // 1️⃣ Check if a chart already exists for this date/time/tz
    const { data: existing, error: lookupError } = await supabase
      .from('charts')
      .select('id')
      .eq('user_id', user.id)
      .eq('birth_date', profile.birth_date!)
      .eq('birth_time', profile.birth_time!)
      .eq('time_zone', tz)
      .maybeSingle()

    if (lookupError) throw lookupError

    if (existing) {
      // 2️⃣ Already saved → don’t upsert again
      Alert.alert('Already Saved', 'This chart is already in your library.')
      return
    }

    // 3️⃣ Only save if not already stored
    await saveChart(user.id, {
      name: `${profile.first_name ?? 'My'} Natal Chart`,
      birth_date: profile.birth_date!, // YYYY-MM-DD
      birth_time: profile.birth_time!, // HH:MM:SS
      time_zone: tz,                   // IANA
    })

    Alert.alert('Saved', 'Chart saved to your library.')
  } catch (e: any) {
    Alert.alert('Save failed', e?.message ?? 'Unknown error')
  }
}


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>
        {`Natal Chart${profile.first_name ? ` — ${profile.first_name}` : ''}`}
      </Text>
      
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <Button title="Save Chart Data" onPress={onSave} />
      </View>

      <View style={{ alignItems: 'center' }}>
        <Svg
          width={size}
          height={size}
          viewBox={`${-pad} ${-pad} ${size + pad * 2} ${size + pad * 2}`} // ← prevents clipping
        >
          {/* Rings */}
          <Circle cx={cx} cy={cy} r={rOuter} stroke="#ccc" strokeWidth={1} fill="none" />
          <Circle cx={cx} cy={cy} r={rInner} stroke="#eee" strokeWidth={1} fill="none" />

          {/* 12 sign dividers + labels */}
          {Array.from({ length: 12 }).map((_, i) => {
            const ang = i * 30
            const { x: x1, y: y1 } = toXY(ang, rInner)
            const { x: x2, y: y2 } = toXY(ang, rOuter)
            const { x: lx, y: ly } = toXY(ang, rOuter + 12)
            return (
              <G key={i}>
                <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#bbb" strokeWidth={1} />
                <SvgText x={lx} y={ly} fontSize="10" textAnchor="middle" dy="3">
                  {ZODIAC[i]}
                </SvgText>
              </G>
            )
          })}

          {/* Aspect lines */}
          {aspects.map((a, idx) => {
            const A = planets.find(p => p.name === a.a)
            const B = planets.find(p => p.name === a.b)
            if (!A || !B) return null
            const { x: x1, y: y1 } = toXY(A.lon, rAspect)
            const { x: x2, y: y2 } = toXY(B.lon, rAspect)
            return (
              <Line
                key={`${a.a}-${a.b}-${idx}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#777"
                strokeWidth={aspectStroke[a.type]}
                opacity={0.85}
                strokeDasharray={
                  a.type === 'sextile' ? '4 4'
                  : a.type === 'trine' ? '8 6'
                  : undefined
                }
              />
            )
          })}

          {/* Planets */}
          {planets.map((p) => {
            const { x, y } = toXY(p.lon, rPlanets)
            const glyph = GLYPH[p.name] ?? p.name[0] // ← use glyphs
            return (
              <G key={p.name}>
                <Circle cx={x} cy={y} r={9} fill="#222" />
                <SvgText
                  x={x}
                  y={y}
                  fontSize="9"
                  fill="#fff"
                  textAnchor="middle"
                  dy="3" // more reliable than alignmentBaseline on Android
                >
                  {glyph}
                </SvgText>
              </G>
            )
          })}
        </Svg>
      </View>

      <Text style={styles.h2}>Positions</Text>
      {planets.map((p) => {
        const s = signOf(p.lon)
        const degFloat = degInSign(p.lon)
        const deg = Math.floor(degFloat)
        const min = Math.round((degFloat - deg) * 60)
        const mm = String(min).padStart(2, '0')
        return (
          <Text key={p.name} style={styles.row}>
            {`${p.name.padEnd(7)} ${ZODIAC[s]} ${deg}°${mm}′`}
          </Text>
        )
      })}

      <View style={{ height: 16 }} />
      <ChartCompass style={{ marginBottom: 12 }} />  

      <Text style={styles.h2}>Aspects</Text>
      {aspects.length === 0 ? (
        <Text style={styles.muted}>None (within default orbs)</Text>
      ) : (
        aspects
          .slice()
          .sort((a, b) => a.orb - b.orb)
          .map((a, i) => (
            <Text key={`${a.a}-${a.b}-${i}`} style={styles.row}>
              {`${a.a} ${a.type} ${a.b} (orb ${a.orb.toFixed(2)}°)`}

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
