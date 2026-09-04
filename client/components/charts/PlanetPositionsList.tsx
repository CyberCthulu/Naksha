// components/charts/PlanetPositionsList.tsx
import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { PlanetPos, PlanetHousePlacement } from '../../lib/astro'
import {
  signIndexFromLongitude,
  zodiacNameFromLongitude,
  type PlanetKey,
  type HouseNumber,
} from '../../lib/lexicon'
import { asPlanetKey, buildPlanetSummary } from '../../lib/chartInterpretation'
import { AppText } from '../ui/AppText'
import { theme } from '../ui/theme'
import { PLANET_GLYPH, SIGN_INFO } from './ChartCompass'

const degInSign = (lon: number) => ((lon % 30) + 30) % 30

function asHouseNumber(n: number): HouseNumber | null {
  return n >= 1 && n <= 12 ? (n as HouseNumber) : null
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

  return { signIdx, deg, min }
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
    <View>
      {planets.map((p) => {
        const { deg, min } = formatPlanetPosition(p.lon)
        const mm = String(min).padStart(2, '0')
        const signName = zodiacNameFromLongitude(p.lon)

        const pk = asPlanetKey(p.name)
        const isActive = pk != null && focusedPlanet === pk
        const summary = buildPlanetSummary(p.name, p.lon, planetHouses)

        const placement = planetHouses?.find((ph) => ph.name === p.name)
        const houseNumber = placement
          ? asHouseNumber(placement.house)
          : null

        const glyph = pk ? PLANET_GLYPH[pk] : null
        const accent = isActive && pk ? theme.planet[pk] : theme.text.tertiary

        return (
          <Pressable
            key={p.name}
            testID={`position-row-${p.name}`}
            disabled={!pk}
            accessibilityRole={pk ? 'button' : undefined}
            accessibilityLabel={
              pk
                ? `${p.name} in ${signName}${
                    houseNumber ? `, house ${houseNumber}` : ''
                  }`
                : undefined
            }
            accessibilityState={pk ? { selected: isActive } : undefined}
            onPress={() => pk && onFocusPlanet(pk)}
            style={({ pressed }) => [
              styles.row,
              pressed && styles.pressed,
              isActive && styles.activeRow,
            ]}
          >
            {/* A focus bar, so selection is never signalled by colour alone. */}
            <View
              style={[
                styles.focusBar,
                isActive && { backgroundColor: accent },
              ]}
            />

            <View style={styles.body}>
              <View style={styles.headline}>
                {glyph ? (
                  <AppText style={[styles.glyph, { color: accent }]}>
                    {glyph}
                  </AppText>
                ) : null}

                <AppText variant="subheading" style={styles.name}>
                  {p.name}
                </AppText>

                <AppText variant="numeric" style={styles.degree}>
                  {`${deg}°${mm}′`}
                </AppText>

                <AppText variant="bodySmall" style={styles.sign}>
                  {signName}
                </AppText>

                {houseNumber ? (
                  <AppText variant="numeric" style={styles.house}>
                    {`House ${houseNumber}`}
                  </AppText>
                ) : null}
              </View>

              {summary ? (
                <AppText variant="bodySmall" style={styles.summary}>
                  {summary}
                </AppText>
              ) : null}
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

export { SIGN_INFO }

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    minHeight: theme.touchTarget.min,
    paddingVertical: theme.space.md,
  },
  pressed: {
    opacity: 0.7,
  },
  activeRow: {
    backgroundColor: theme.surface.selected,
  },
  focusBar: {
    width: 2,
    borderRadius: 1,
    backgroundColor: 'transparent',
    marginRight: theme.space.md,
  },
  body: {
    flex: 1,
  },
  headline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: theme.space.sm,
    rowGap: theme.space.hair,
  },
  glyph: {
    fontSize: 18,
    lineHeight: 24,
  },
  name: {
    color: theme.text.primary,
  },
  degree: {
    color: theme.text.primary,
  },
  sign: {
    color: theme.text.secondary,
  },
  house: {
    color: theme.text.tertiary,
    fontSize: 12,
  },
  summary: {
    color: theme.text.secondary,
    marginTop: theme.space.xs,
  },
})
