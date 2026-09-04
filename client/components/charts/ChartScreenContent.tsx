import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useSpace } from '../space/SpaceProvider'
import type { ChartData } from '../../lib/charts'
import { parseChartData } from '../../lib/chartDataValidation'
import type { ChartMode, ChartProfile } from '../../lib/domainTypes'
import { asHouseNumber, asPlanetKey } from '../../lib/chartInterpretation'
import { buildHousePages, buildPlanetPages } from '../../lib/chartPageBuilders'
import {
  getAspectMeaning,
  getHouseMeaning,
  getHouseSignMeaning,
  getPlanetSignMeaning,
  type AspectType,
  type HouseNumber,
  type PlanetKey,
  zodiacNameFromLongitude,
} from '../../lib/lexicon'
import useChartData from '../../hooks/useChartData'
import useChartInterpretation from '../../hooks/useChartInterpretation'
import type { PlanetPos } from '../../lib/astro'
import { AppText } from '../ui/AppText'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { theme } from '../ui/theme'
import { LoadingState } from '../ui/LoadingState'
import AspectsList from './AspectsList'
import ChartHeader from './ChartHeader'
import { ChartAspectDetail } from './ChartAspectDetail'
import { ChartHouseDetail } from './ChartHouseDetail'
import { ChartHero } from './ChartHero'
import {
  GlyphCompass,
  GLYPH_COMPASS_TRIGGER_CLEARANCE,
} from './GlyphCompass'
import { ChartSection } from './ChartSection'
import type { ChartSelection } from './ChartWheel'
import { InteractiveChartWheel } from './InteractiveChartWheel'
import HousesList from './HousesList'
import InterpretationModal from './InterpretationModal'
import PlanetPositionsList from './PlanetPositionsList'
import type { InterpretationPage } from './interpretationTypes'
import type { RootStackParamList } from '../../navigation/types'

const ASPECT_TYPES: AspectType[] = [
  'conj',
  'opp',
  'square',
  'trine',
  'sextile',
]

const ASPECT_LABELS: Record<AspectType, string> = {
  conj: 'Conjunction',
  opp: 'Opposition',
  square: 'Square',
  trine: 'Trine',
  sextile: 'Sextile',
}

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

  // Dominant but never wider than the viewport gutters allow. Zoom is a
  // gesture now, so the rendered size stays fixed and the wheel scales.
  const size = Math.min(Math.max(240, width - theme.space.xl * 2), 380)

  const [selection, setSelection] = useState<ChartSelection>(null)

  const selectAspect = useCallback((index: number | null) => {
    setSelection(index == null ? null : { kind: 'aspect', index })
  }, [])


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

  /**
   * The one way a planet becomes selected.
   *
   * Device testing found the wheel and the Positions rows maintaining
   * different state: the rows called through to the interpretation hook,
   * which set focusedPlanet but never ChartSelection, so the halo rendered
   * from focus while the glow animation keyed off a selection that was still
   * null. Both paths now run through here, and opening the modal is an option
   * on the selection rather than the thing that performs it -- so a direct
   * wheel tap starts the glow immediately, with no modal involved.
   */
  const selectPlanet = useCallback(
    (planet: PlanetKey, options?: { openInterpretation?: boolean }) => {
      focusPlanet(planet)
      setSelection({ kind: 'planet', planet })

      if (options?.openInterpretation) {
        openPlanetInterpretation(planet)
      }
    },
    [focusPlanet, openPlanetInterpretation]
  )

  const selectPlanetFromWheel = useCallback(
    (planet: PlanetKey) => selectPlanet(planet),
    [selectPlanet]
  )

  const selectPlanetAndRead = useCallback(
    (planet: PlanetKey) => selectPlanet(planet, { openInterpretation: true }),
    [selectPlanet]
  )

  /**
   * The one way a house becomes selected, mirroring selectPlanet.
   *
   * Wheel taps select and explain without opening anything; the Houses rows
   * additionally open the full interpretation, exactly as the Positions rows
   * do for planets.
   */
  const selectHouse = useCallback(
    (house: number, options?: { openInterpretation?: boolean }) => {
      setSelection({ kind: 'house', house })

      const houseNumber = asHouseNumber(house)
      if (houseNumber && options?.openInterpretation) {
        openHouseInterpretation(houseNumber)
      }
    },
    [openHouseInterpretation]
  )

  const selectHouseFromWheel = useCallback(
    (house: number) => selectHouse(house),
    [selectHouse]
  )

  const selectHouseAndRead = useCallback(
    (house: HouseNumber) => selectHouse(house, { openInterpretation: true }),
    [selectHouse]
  )




  const selectedHouse = useMemo(() => {
    if (selection?.kind !== 'house') return null

    const cusp = houses?.find((h) => h.house === selection.house)
    if (!cusp) return null

    const houseNumber = asHouseNumber(cusp.house)
    if (!houseNumber) return null

    const signName = zodiacNameFromLongitude(cusp.lon)
    const signMeaning = getHouseSignMeaning(houseNumber, signName)
    const generic = getHouseMeaning(houseNumber)

    return {
      house: houseNumber,
      signName,
      summary: signMeaning?.short ?? generic?.short ?? null,
    }
  }, [selection, houses])

  const selectedAspect = useMemo(() => {
    if (selection?.kind !== 'aspect') return null

    const aspect = aspects[selection.index]
    if (!aspect) return null

    const type = ASPECT_TYPES.includes(aspect.type as AspectType)
      ? (aspect.type as AspectType)
      : null

    return {
      aspect,
      label: type ? ASPECT_LABELS[type] : aspect.type,
      summary: type ? getAspectMeaning(type)?.short ?? null : null,
    }
  }, [selection, aspects])

  // The hero explains whichever planet is currently focused. Focus already
  // defaults to the Sun on mount, so the fitted, untouched chart still opens
  // on its headline placement.
  const heroSummary = useMemo(() => {
    const selected: PlanetPos | undefined =
      planets.find((p) => p.name === focusedPlanet) ??
      planets.find((p) => p.name === 'Sun')

    if (!selected) return null

    const planetKey = asPlanetKey(selected.name)
    if (!planetKey) return null

    const signName = zodiacNameFromLongitude(selected.lon)
    const meaning = getPlanetSignMeaning(planetKey, signName)
    const house = planetHouses?.find((ph) => ph.name === selected.name)

    return {
      planetKey,
      signName,
      house: house?.house ?? null,
      meaning,
    }
  }, [planets, planetHouses, focusedPlanet])

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
            paddingBottom:
              insets.bottom +
              theme.space.xxxl +
              GLYPH_COMPASS_TRIGGER_CLEARANCE,
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

        {/* Focal point. Pinch to zoom, drag to pan once enlarged. */}
        <View style={styles.wheelFrame}>
          <InteractiveChartWheel
            size={size}
            planets={planets}
            aspects={aspects}
            houses={houses}
            focusedPlanet={focusedPlanet}
            selection={selection}
            onSelectPlanet={selectPlanetFromWheel}
            onSelectAspect={selectAspect}
            onSelectHouse={selectHouseFromWheel}
          />
        </View>

        {selectedHouse ? (
          <ChartHouseDetail
            testID="chart-house-detail"
            house={selectedHouse.house}
            signName={selectedHouse.signName}
            summary={selectedHouse.summary}
            onOpen={() => selectHouseAndRead(selectedHouse.house)}
          />
        ) : null}

        {selectedAspect ? (
          <ChartAspectDetail
            testID="chart-aspect-detail"
            aspect={selectedAspect.aspect}
            label={selectedAspect.label}
            summary={selectedAspect.summary}
          />
        ) : null}

        {!selectedAspect && !selectedHouse && heroSummary ? (
          <ChartHero
            title={`${heroSummary.planetKey} in ${heroSummary.signName}`}
            meaning={heroSummary.meaning?.short ?? null}
            house={heroSummary.house}
            planet={heroSummary.planetKey}
            onOpen={() => selectPlanetAndRead(heroSummary.planetKey)}
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
            onFocusPlanet={selectPlanetAndRead}
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
            onFocusHouse={selectHouseAndRead}
          />
        </ChartSection>

        <ChartSection
          testID="chart-section-aspects"
          eyebrow="Planetary dynamics"
          title="Aspects"
        >
          <AspectsList aspects={aspects} />
        </ChartSection>
      </ScrollView>

      <GlyphCompass hidden={interpretationVisible} />

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
    marginTop: theme.space.lg,
  },

})
