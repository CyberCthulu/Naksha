// components/charts/PlanetPositionsList.tsx
import React from 'react'
import { Text, StyleSheet, Pressable, View } from 'react-native'
import { PlanetPos, PlanetHousePlacement } from '../../lib/astro'
import {
  signIndexFromLongitude,
  zodiacNameFromLongitude,
  getPlanetSignMeaning,
  getPlanetHouseMeaning,
  type PlanetKey,
  type HouseNumber,
} from '../../lib/lexicon'
import { theme } from '../ui/theme'

const ZODIAC_ABBR = [
  'Ar',
  'Ta',
  'Ge',
  'Cn',
  'Le',
  'Vi',
  'Li',
  'Sc',
  'Sg',
  'Cp',
  'Aq',
  'Pi',
]

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

function asHouseNumber(n: number): HouseNumber | null {
  return n >= 1 && n <= 12 ? (n as HouseNumber) : null
}

function trimPeriod(text: string): string {
  return text.trim().replace(/[.!?]+$/, '')
}

function toClause(text: string): string {
  const trimmed = trimPeriod(text)

  if (!trimmed) return ''

  if (trimmed.startsWith('Your ')) {
    return `your ${trimmed.slice(5)}`
  }

  if (trimmed.startsWith('You ')) {
    return `you ${trimmed.slice(4)}`
  }

  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1)
}

function buildPlanetSummary(
  planetName: string,
  lon: number,
  planetHouses: PlanetHousePlacement[] | null
): string {
  const pk = asPlanetKey(planetName)
  if (!pk) return ''

  const signName = zodiacNameFromLongitude(lon)
  const signMeaning = getPlanetSignMeaning(pk, signName)

  const placement = planetHouses?.find((p) => p.name === planetName)
  const houseNumber = placement ? asHouseNumber(placement.house) : null
  const houseMeaning = houseNumber
    ? getPlanetHouseMeaning(pk, houseNumber)
    : null

  if (signMeaning?.short && houseMeaning?.short) {
    const signPart = trimPeriod(signMeaning.short)
    const housePart = toClause(houseMeaning.short)

    return `${signPart}. This tends to show up most clearly when ${housePart}.`
  }

  if (signMeaning?.short) return signMeaning.short
  if (houseMeaning?.short) return houseMeaning.short

  return ''
}

function formatPlanetPosition(lon: number) {
  let signIdx = signIndexFromLongitude(lon)
  const degFloat = degInSign(lon)

  let deg = Math.floor(degFloat)
  let min = Math.round((degFloat - deg) * 60)

  if (min === 60) {
    deg += 1
    min = 0
  }

  if (deg === 30) {
    deg = 0
    signIdx = (signIdx + 1) % 12
  }

  return {
    signIdx,
    deg,
    min,
  }
}

type Props = {
  planets: PlanetPos[]
  planetHouses: PlanetHousePlacement[] | null
  focusedPlanet: PlanetKey | null
  onFocusPlanet: (planet: PlanetKey) => void
}

export default function PlanetPositionsList({
  planets,
  planetHouses,
  focusedPlanet,
  onFocusPlanet,
}: Props) {
  return (
    <>
      <Text style={styles.h2}>Positions</Text>

      {planets.map((p) => {
        const { signIdx, deg, min } = formatPlanetPosition(p.lon)
        const mm = String(min).padStart(2, '0')

        const pk = asPlanetKey(p.name)
        const isActive = pk != null && focusedPlanet === pk
        const summary = buildPlanetSummary(p.name, p.lon, planetHouses)

        const placement = planetHouses?.find((ph) => ph.name === p.name)
        const houseLabel = placement ? `H${placement.house}` : ''

        return (
          <Pressable
            key={p.name}
            disabled={!pk}
            onPress={() => pk && onFocusPlanet(pk)}
            style={[
              styles.itemRow,
              pk && styles.pressableRow,
              isActive && styles.activeRow,
            ]}
          >
            <View style={styles.itemLeft}>
              <Text style={styles.itemLeftText}>{p.name}</Text>
              <Text style={styles.itemLeftText}>
                {`${ZODIAC_ABBR[signIdx]} ${deg}°${mm}′`}
              </Text>
              {!!houseLabel && (
                <Text style={styles.itemLeftText}>{houseLabel}</Text>
              )}
            </View>

            <Text style={styles.itemRight} numberOfLines={4}>
              {summary}
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
  },
  itemLeftText: {
    fontFamily: 'monospace' as any,
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
  itemRight: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.sub,
    paddingLeft: 10,
    lineHeight: 16,
  },
})