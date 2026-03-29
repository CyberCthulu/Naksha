import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
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
}

export default function HousesList({ houses }: Props) {
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

          return (
            <View key={`house-row-${h.house}`} style={styles.itemRow}>
              <Text style={styles.itemLeft}>
                {`House ${String(h.house).padStart(2, ' ')}  ${ZODIAC_ABBR[signIdx]}`}
              </Text>
              <Text style={styles.itemRight} numberOfLines={4}>
                {meaning?.short ?? ''}
              </Text>
            </View>
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