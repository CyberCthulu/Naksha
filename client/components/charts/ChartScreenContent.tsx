import React, { useEffect, useMemo } from 'react'
import {
  ActivityIndicator,
  Button,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useSpace } from '../space/SpaceProvider'
import type { ChartData } from '../../lib/charts'
import { parseChartData } from '../../lib/chartDataValidation'
import type { ChartMode, ChartProfile } from '../../lib/domainTypes'
import { asPlanetKey } from '../../lib/chartInterpretation'
import { buildHousePages, buildPlanetPages } from '../../lib/chartPageBuilders'
import {
  getPlanetSignMeaning,
  type PlanetKey,
  zodiacNameFromLongitude,
} from '../../lib/lexicon'
import useChartData from '../../hooks/useChartData'
import useChartInterpretation from '../../hooks/useChartInterpretation'
import { theme } from '../ui/theme'
import { uiStyles } from '../ui/uiStyles'
import AspectsList from './AspectsList'
import ChartCompass from './ChartCompass'
import ChartHeader from './ChartHeader'
import ChartWheel from './ChartWheel'
import HousesList from './HousesList'
import InterpretationModal from './InterpretationModal'
import PlanetPositionsList from './PlanetPositionsList'
import type { InterpretationPage } from './interpretationTypes'

type Props = {
  profile: ChartProfile
  chartMode: ChartMode
  fromSaved?: boolean
  saved?: ChartData
  tz: string
}

export default function ChartScreenContent({
  profile,
  chartMode,
  fromSaved,
  saved,
  tz,
}: Props) {
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { focusedPlanet, focusPlanet, clearFocus } = useSpace()
  const parsedSaved = useMemo(
    () => (fromSaved ? parseChartData(saved) : null),
    [fromSaved, saved]
  )

  const {
    loading,
    planets,
    aspects,
    houses,
    planetHouses,
    isSaved,
    canSaveChart,
    saveCurrentChart,
  } = useChartData({
    profile,
    chartMode,
    fromSaved,
    saved: parsedSaved ?? undefined,
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
  const subtitleZone = parsedSaved?.meta.time_zone ?? tz
  const subtitleCoords =
    parsedSaved?.meta.birth_lat != null && parsedSaved.meta.birth_lon != null
      ? ` (${parsedSaved.meta.birth_lat.toFixed(2)}, ${parsedSaved.meta.birth_lon.toFixed(2)})`
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
            title={
              !canSaveChart
                ? 'View Only'
                : isSaved
                ? 'Saved to My Charts'
                : chartMode === 'guest'
                ? 'Save Chart'
                : 'Save Chart Data'
            }
            onPress={saveCurrentChart}
            disabled={isSaved || !canSaveChart}
          />
        </View>

        {!canSaveChart && (
          <View style={[uiStyles.card, { alignItems: 'center' }]}>
            <Text style={[uiStyles.text, { textAlign: 'center' }]}>
              Add a birth location to save houses and chart data.
            </Text>
          </View>
        )}

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
