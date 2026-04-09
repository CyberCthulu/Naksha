//screens/ChartScreen.tsx
import React, { useEffect, useLayoutEffect, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
  Button,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ParamListBase } from '@react-navigation/native'

import { useSpace } from '../components/space/SpaceProvider'
import type { ChartData } from '../lib/charts'
import { normalizeZone } from '../lib/timezones'

// chart components
import ChartHeader from '../components/charts/ChartHeader'
import ChartWheel from '../components/charts/ChartWheel'
import PlanetPositionsList from '../components/charts/PlanetPositionsList'
import HousesList from '../components/charts/HousesList'
import AspectsList from '../components/charts/AspectsList'
import ChartCompass from '../components/charts/ChartCompass'
import InterpretationModal from '../components/charts/InterpretationModal'
import type { InterpretationPage } from '../components/charts/interpretationTypes'

// interpretation helpers
import { asPlanetKey } from '../lib/chartInterpretation'
import { buildPlanetPages, buildHousePages } from '../lib/chartPageBuilders'

// hooks
import useChartInterpretation from '../hooks/useChartInterpretation'
import useChartData from '../hooks/useChartData'

// lexicon
import {
  zodiacNameFromLongitude,
  getPlanetSignMeaning,
  type PlanetKey,
} from '../lib/lexicon'

// shared UI
import { uiStyles } from '../components/ui/uiStyles'
import { theme } from '../components/ui/theme'

type ProfileForChart = {
  birth_date: string | null
  birth_time: string | null
  time_zone: string | null
  birth_lat?: number | null
  birth_lon?: number | null
  birth_location?: string | null
  first_name?: string | null
  last_name?: string | null
}

type SavedChartPayload = ChartData

type RouteParams = {
  profile: ProfileForChart
  fromSaved?: boolean
  saved?: SavedChartPayload
}

type ChartScreenProps = NativeStackScreenProps<ParamListBase, 'Chart'>

export default function ChartScreen({ route }: ChartScreenProps) {
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false })
  }, [navigation])

  const { profile, fromSaved, saved } = route.params as RouteParams
  const { focusedPlanet, focusPlanet, clearFocus } = useSpace()

  if (!profile?.birth_date || !profile?.birth_time || !profile?.time_zone) {
    return (
      <View style={uiStyles.center}>
        <Text style={uiStyles.h1}>Natal Chart</Text>
        <Text style={uiStyles.muted}>
          Missing birth date, time, or time zone. Please complete your profile.
        </Text>
      </View>
    )
  }

  const tz = normalizeZone(profile.time_zone)

  if (!tz) {
    return (
      <View style={uiStyles.center}>
        <Text style={uiStyles.h1}>Natal Chart</Text>
        <Text style={uiStyles.muted}>
          Your saved time zone isn’t valid. Update it in “Complete Profile”.
        </Text>
        <Text style={uiStyles.muted}>Current: {String(profile.time_zone)}</Text>
      </View>
    )
  }

  const {
    loading,
    planets,
    aspects,
    houses,
    planetHouses,
    isSaved,
    saveCurrentChart,
  } = useChartData({
    profile,
    fromSaved,
    saved,
    tz,
  })

  useEffect(() => {
    if (!planets.length) return

    const sun = planets.find((p) => p.name === 'Sun')
    const fallback = planets[0]
    const pk = asPlanetKey(sun?.name ?? fallback?.name ?? '')

    if (pk && !focusedPlanet) {
      focusPlanet(pk)
    }

    return () => {
      clearFocus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planets, focusPlanet, clearFocus])

  const maxChart = 360
  const size = Math.min(Math.max(280, width - 32), maxChart)

  const subtitleLocation = profile.birth_location ?? null
  const subtitleZone = saved?.meta.time_zone ?? tz
  const subtitleCoords =
    saved?.meta.birth_lat != null && saved?.meta.birth_lon != null
      ? ` (${Number(saved.meta.birth_lat).toFixed(2)}, ${Number(saved.meta.birth_lon).toFixed(2)})`
      : ''

  const orderedPlanetKeys = useMemo<PlanetKey[]>(
    () =>
      planets
        .map((p) => asPlanetKey(p.name))
        .filter((p): p is PlanetKey => p != null),
    [planets]
  )

  const planetPages = useMemo<InterpretationPage[]>(
    () => buildPlanetPages(planets, orderedPlanetKeys, planetHouses),
    [planets, orderedPlanetKeys, planetHouses]
  )

  const housePages = useMemo<InterpretationPage[]>(
    () => buildHousePages(houses),
    [houses]
  )

  const {
    interpretationVisible,
    activePages,
    modalHeaderTitle,
    currentInterpretationIndex,
    focusedHouse,
    openPlanetInterpretation,
    openHouseInterpretation,
    handleChangeInterpretationIndex,
    closeInterpretation,
  } = useChartInterpretation({
    focusPlanet,
    planetPages,
    housePages,
  })

  const sunSummary = useMemo(() => {
    const sun = planets.find((p) => p.name === 'Sun')
    if (!sun) return null

    const signName = zodiacNameFromLongitude(sun.lon)
    const meaning = getPlanetSignMeaning('Sun', signName)

    return { signName, meaning }
  }, [planets])

  if (loading) {
    return (
      <View style={uiStyles.center}>
        <ActivityIndicator size="large" />
        <Text style={[uiStyles.text, { marginTop: 8 }]}>Loading chart…</Text>
      </View>
    )
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing.screen,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 28,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <ChartHeader
          onBack={() => navigation.goBack()}
          title="Natal Chart"
          subtitleLocation={subtitleLocation}
          subtitleZone={subtitleZone}
          subtitleCoords={subtitleCoords}
          sunTitle={sunSummary ? `Sun in ${sunSummary.signName}` : null}
          sunShortMeaning={sunSummary?.meaning?.short ?? null}
        />

        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <Button
            title={isSaved ? 'Already Saved' : 'Save Chart Data'}
            onPress={saveCurrentChart}
            disabled={isSaved}
          />
        </View>

        <View style={{ alignItems: 'center' }}>
          <ChartWheel
            size={size}
            planets={planets}
            aspects={aspects}
            houses={houses}
          />
        </View>

        <PlanetPositionsList
          planets={planets}
          planetHouses={planetHouses}
          focusedPlanet={focusedPlanet}
          onFocusPlanet={openPlanetInterpretation}
        />

        <View style={{ height: 16 }} />

        <HousesList
          houses={houses}
          focusedHouse={focusedHouse}
          onFocusHouse={openHouseInterpretation}
        />

        <View style={{ height: 16 }} />

        <ChartCompass style={{ marginBottom: 12 }} />

        <AspectsList aspects={aspects} />
      </ScrollView>

      <InterpretationModal
        visible={interpretationVisible && activePages.length > 0}
        headerTitle={modalHeaderTitle}
        pages={activePages}
        currentIndex={currentInterpretationIndex}
        onChangeIndex={handleChangeInterpretationIndex}
        onClose={closeInterpretation}
      />
    </>
  )
}