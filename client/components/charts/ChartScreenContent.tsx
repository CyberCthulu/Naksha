import React, { useEffect, useMemo } from 'react'
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
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
import { AppText } from '../ui/AppText'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { theme } from '../ui/theme'
import { LoadingState } from '../ui/LoadingState'
import AspectsList from './AspectsList'
import ChartCompass from './ChartCompass'
import ChartHeader from './ChartHeader'
import { ChartHero } from './ChartHero'
import { ChartSection } from './ChartSection'
import ChartWheel from './ChartWheel'
import HousesList from './HousesList'
import InterpretationModal from './InterpretationModal'
import PlanetPositionsList from './PlanetPositionsList'
import type { InterpretationPage } from './interpretationTypes'
import type { RootStackParamList } from '../../navigation/types'

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
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Chart'>>()
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
    saveWarning,
    saveCurrentChart,
  } = useChartData({
    profile,
    chartMode,
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

  // Dominant but never wider than the viewport gutters allow.
  const size = Math.min(Math.max(240, width - theme.space.xl * 2), 380)

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
    return <LoadingState label="Loading chart" size="large" />
  }

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + theme.space.xs,
            paddingBottom: insets.bottom + theme.space.xxxl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <ChartHeader
          onBack={() => navigation.goBack()}
          title="Natal Chart"
          subtitleLocation={subtitleLocation}
          subtitleZone={subtitleZone}
          subtitleCoords={subtitleCoords}
        />

        {/* Chart context: what this chart can and cannot do. */}
        <View style={styles.contextBlock}>
          {!canSaveChart ? (
            <View testID="chart-status-view-only" style={styles.statusChip}>
              <AppText variant="eyebrow" style={styles.statusLabel}>
                View Only
              </AppText>
              <AppText variant="bodySmall" style={styles.statusNote}>
                Add a birth location to save houses and chart data.
              </AppText>
            </View>
          ) : isSaved ? (
            <View testID="chart-status-saved" style={styles.savedChip}>
              <Icon name="save" size="sm" color={theme.accent.base} />
              <AppText variant="eyebrow" style={styles.savedLabel}>
                Saved to My Charts
              </AppText>
            </View>
          ) : (
            <Button
              testID="chart-save-action"
              title={chartMode === 'guest' ? 'Save Chart' : 'Save Chart Data'}
              onPress={saveCurrentChart}
            />
          )}

          {canSaveChart && saveWarning && chartMode === 'self' ? (
            <AppText
              testID="chart-save-warning"
              variant="bodySmall"
              accessibilityLiveRegion="polite"
              style={styles.warning}
            >
              {saveWarning}
            </AppText>
          ) : null}
        </View>

        {/* Focal point. */}
        <View style={styles.wheelFrame}>
          <ChartWheel
            size={size}
            planets={planets}
            aspects={aspects}
            houses={houses}
            focusedPlanet={focusedPlanet}
          />
        </View>

        {sunSummary ? (
          <ChartHero
            title={`Sun in ${sunSummary.signName}`}
            meaning={sunSummary.meaning?.short ?? null}
            planet="Sun"
          />
        ) : null}

        <ChartSection
          testID="chart-section-positions"
          eyebrow="Placements"
          title="Positions"
        >
          <PlanetPositionsList
            planets={planets}
            planetHouses={planetHouses}
            focusedPlanet={focusedPlanet}
            onFocusPlanet={openPlanetInterpretation}
          />
        </ChartSection>

        <ChartSection
          testID="chart-section-houses"
          eyebrow="Life areas"
          title="Houses"
          note="Whole Sign"
        >
          <HousesList
            houses={houses}
            focusedHouse={focusedHouse}
            onFocusHouse={openHouseInterpretation}
          />
        </ChartSection>

        <ChartSection
          testID="chart-section-compass"
          eyebrow="Legend"
          title="Glyph Compass"
        >
          <ChartCompass />
        </ChartSection>

        <ChartSection
          testID="chart-section-aspects"
          eyebrow="Relationships"
          title="Aspects"
        >
          <AspectsList aspects={aspects} />
        </ChartSection>
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.space.xl,
  },
  contextBlock: {
    alignItems: 'center',
  },
  statusChip: {
    alignItems: 'center',
    paddingHorizontal: theme.space.md,
  },
  statusLabel: {
    color: theme.text.tertiary,
  },
  statusNote: {
    color: theme.text.secondary,
    marginTop: theme.space.xs,
    textAlign: 'center',
  },
  savedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.space.xs,
    minHeight: theme.touchTarget.min,
  },
  savedLabel: {
    color: theme.accent.base,
  },
  warning: {
    color: theme.state.danger,
    marginTop: theme.space.sm,
    textAlign: 'center',
  },
  wheelFrame: {
    alignItems: 'center',
    marginTop: theme.space.lg,
  },
})
