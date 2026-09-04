// components/charts/HousesList.tsx
import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { HouseCusp } from '../../lib/astro'
import {
  zodiacNameFromLongitude,
  getHouseSignMeaning,
  type HouseNumber,
} from '../../lib/lexicon'
import { AppText } from '../ui/AppText'
import { theme } from '../ui/theme'

function asHouseNumber(n: number): HouseNumber | null {
  return n >= 1 && n <= 12 ? (n as HouseNumber) : null
}

type Props = {
  houses: HouseCusp[] | null
  focusedHouse: HouseNumber | null
  onFocusHouse: (house: HouseNumber) => void
}

export default function HousesList({
  houses,
  focusedHouse,
  onFocusHouse,
}: Props) {
  if (!houses) {
    return (
      <AppText variant="bodySmall" style={styles.fallback}>
        Houses require a birth location. Add or update your birth place to view
        house cusps.
      </AppText>
    )
  }

  return (
    <View>
      {houses.map((h) => {
        const signName = zodiacNameFromLongitude(h.lon)
        const hn = asHouseNumber(h.house)
        const meaning = hn ? getHouseSignMeaning(hn, signName) : null
        const isActive = hn != null && focusedHouse === hn

        return (
          <Pressable
            key={`house-row-${h.house}`}
            testID={`house-row-${h.house}`}
            disabled={!hn}
            accessibilityRole={hn ? 'button' : undefined}
            accessibilityLabel={
              hn ? `House ${hn} in ${signName}` : undefined
            }
            accessibilityState={hn ? { selected: isActive } : undefined}
            onPress={() => hn && onFocusHouse(hn)}
            style={({ pressed }) => [
              styles.row,
              pressed && styles.pressed,
              isActive && styles.activeRow,
            ]}
          >
            <View
              style={[
                styles.focusBar,
                isActive && styles.focusBarActive,
              ]}
            />

            <View style={styles.body}>
              <View style={styles.headline}>
                <AppText variant="numeric" style={styles.number}>
                  {`House ${h.house}`}
                </AppText>
                <AppText variant="bodySmall" style={styles.sign}>
                  {signName}
                </AppText>
              </View>

              {meaning?.short ? (
                <AppText variant="bodySmall" style={styles.summary}>
                  {meaning.short}
                </AppText>
              ) : null}
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  fallback: {
    color: theme.text.secondary,
  },
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
  focusBarActive: {
    backgroundColor: theme.accent.base,
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
  number: {
    color: theme.text.primary,
  },
  sign: {
    color: theme.accent.base,
  },
  summary: {
    color: theme.text.secondary,
    marginTop: theme.space.xs,
  },
})
