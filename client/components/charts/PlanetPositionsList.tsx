import React from 'react'
import { Text, Pressable, StyleSheet } from 'react-native'
import { PlanetPos } from '../../lib/astro'
import {
  zodiacNameFromLongitude,
  signIndexFromLongitude,
  getPlanetSignMeaning,
  type PlanetKey,
} from '../../lib/lexicon'
import { theme } from '../ui/theme'

const ZODIAC_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi']

const degInSign = (lon: number) => ((lon % 30) + 30) % 30

function asPlanetKey(name: string): PlanetKey | null {
  const allowed: PlanetKey[] = [
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
  return (allowed as string[]).includes(name) ? (name as PlanetKey) : null
}

type Props = {
  planets: PlanetPos[]
  focusedPlanet: PlanetKey | null
  onFocusPlanet: (planet: PlanetKey) => void
}

export default function PlanetPositionsList({
  planets,
  focusedPlanet,
  onFocusPlanet,
}: Props) {
  return (
    <>
      <Text style={styles.h2}>Positions</Text>

      {planets.map((p) => {
        const signIdx = signIndexFromLongitude(p.lon)
        const degFloat = degInSign(p.lon)
        const deg = Math.floor(degFloat)
        const min = Math.round((degFloat - deg) * 60)
        const mm = String(min).padStart(2, '0')

        const pk = asPlanetKey(p.name)
        const signName = zodiacNameFromLongitude(p.lon)
        const meaning = pk ? getPlanetSignMeaning(pk, signName) : null
        const isActive = pk != null && focusedPlanet === pk

        return (
          <Pressable
            key={p.name}
            disabled={!pk}
            onPress={() => pk && onFocusPlanet(pk)}
            style={[styles.itemRow, pk && styles.pressableRow, isActive && styles.activeRow]}
          >
            <Text style={styles.itemLeft}>
              {`${p.name.padEnd(7)} ${ZODIAC_ABBR[signIdx]} ${deg}°${mm}′`}
            </Text>
            <Text style={styles.itemRight} numberOfLines={3}>
              {meaning?.short ?? ''}
            </Text>
          </Pressable>
        )
      })}
    </>
  )
}

const styles = StyleSheet.create({
  h2: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    color: theme.colors.text,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pressableRow: {
    borderRadius: 8,
    paddingVertical: 4,
  },
  activeRow: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  itemLeft: {
    width: 150,
    fontFamily: 'monospace' as any,
    color: theme.colors.text,
  },
  itemRight: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.sub,
    paddingLeft: 10,
    lineHeight: 16,
  },
})