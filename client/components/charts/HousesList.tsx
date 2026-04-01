// components/charts/HousesList.tsx
import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { HouseCusp } from '../../lib/astro'
import {
  signIndexFromLongitude,
  zodiacNameFromLongitude,
  getHouseSignMeaning,
  type HouseNumber,
} from '../../lib/lexicon'
import { theme } from '../ui/theme'
import { uiStyles } from '../ui/uiStyles'

const ZODIAC_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi']

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
  return (
    <>
      <Text style={styles.h2}>Houses (Whole Sign)</Text>

      {!houses ? (
        <Text style={uiStyles.muted}>
          Houses require a birth location. Add or update your birth place to view house cusps.
        </Text>
      ) : (
        houses.map((h) => {
          const signIdx = signIndexFromLongitude(h.lon)
          const signName = zodiacNameFromLongitude(h.lon)
          const hn = asHouseNumber(h.house)
          const meaning = hn ? getHouseSignMeaning(hn, signName) : null
          const isActive = hn != null && focusedHouse === hn

          return (
            <Pressable
              key={`house-row-${h.house}`}
              disabled={!hn}
              onPress={() => hn && onFocusHouse(hn)}
              style={[
                styles.itemRow,
                hn && styles.pressableRow,
                isActive && styles.activeRow,
              ]}
            >
              <Text style={styles.itemLeft}>
                {`House ${String(h.house).padStart(2, ' ')}  ${ZODIAC_ABBR[signIdx]}`}
              </Text>
              <Text style={styles.itemRight} numberOfLines={4}>
                {meaning?.short ?? ''}
              </Text>
            </Pressable>
          )
        })
      )}
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