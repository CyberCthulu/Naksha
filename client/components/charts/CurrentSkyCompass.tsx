import { useState } from 'react'
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'

import { useCurrentSky } from '../../hooks/useCurrentSky'
import { formatSkyPosition, skyAspectKey } from '../../lib/currentSky'
import { angularSeparation, ASPECT_RULES } from '../../lib/aspects'
import { AppText } from '../ui/AppText'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { CelestialMark } from '../ui/CelestialMark'
import { LoadingState } from '../ui/LoadingState'
import { useScreenActivity } from '../ui/ScreenActivity'
import { theme, type PlanetAccent } from '../ui/theme'
import { PLANET_GLYPH } from './ChartCompass'
import type { ChartSelection } from './ChartWheel'
import { InteractiveChartWheel } from './InteractiveChartWheel'

type SkySelection =
  | { kind: 'planet'; planet: PlanetAccent }
  | { kind: 'aspect'; key: string }
  | null

export function CurrentSkyCompass() {
  const screenActive = useScreenActivity()
  const { sky, error, refresh, active } = useCurrentSky(screenActive)
  const { width } = useWindowDimensions()
  const [measuredWidth, setMeasuredWidth] = useState(0)
  const [selection, setSelection] = useState<SkySelection>({
    kind: 'planet',
    planet: 'Sun',
  })
  const [showPositions, setShowPositions] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const wheelSize = Math.min(
    measuredWidth || Math.max(1, width - 2 * (theme.space.xl + theme.space.lg)),
    400
  )
  const aspectIndex =
    selection?.kind === 'aspect'
      ? (sky?.aspects.findIndex(
          (aspect) => skyAspectKey(aspect) === selection.key
        ) ?? -1)
      : -1
  const wheelSelection: ChartSelection =
    selection?.kind === 'planet'
      ? selection
      : aspectIndex >= 0
        ? { kind: 'aspect', index: aspectIndex }
        : null
  const selectedPlanet =
    selection?.kind === 'planet'
      ? sky?.planets.find((planet) => planet.name === selection.planet)
      : undefined
  const selectedAspect =
    aspectIndex >= 0 ? sky?.aspects[aspectIndex] : undefined
  const selectedRule = ASPECT_RULES.find(
    (rule) => rule.type === selectedAspect?.type
  )
  const aspectA = sky?.planets.find(
    (planet) => planet.name === selectedAspect?.a
  )
  const aspectB = sky?.planets.find(
    (planet) => planet.name === selectedAspect?.b
  )
  const separation =
    aspectA && aspectB ? angularSeparation(aspectA.lon, aspectB.lon) : undefined

  return (
    <Card testID="current-sky-compass">
      <View style={styles.heading}>
        <CelestialMark motif="orbits" />
        <AppText variant="heading" accessibilityRole="header">
          Sky Now
        </AppText>
      </View>
      <AppText variant="bodySmall" style={styles.description}>
        The planets in the zodiac right now.
      </AppText>
      {sky ? (
        <>
          <AppText
            variant="caption"
            style={styles.timestamp}
            testID="current-sky-timestamp"
          >
            {`Updated ${sky.evaluatedAt.toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
              timeZoneName: 'short',
            })}`}
          </AppText>
          <View
            onLayout={(event) =>
              setMeasuredWidth(event.nativeEvent.layout.width)
            }
          >
            <InteractiveChartWheel
              size={wheelSize}
              planets={sky.planets}
              aspects={sky.aspects}
              houses={null}
              focusedPlanet={
                selection?.kind === 'planet' ? selection.planet : null
              }
              selection={wheelSelection}
              motionEnabled={active}
              onSelectPlanet={(planet) =>
                setSelection({ kind: 'planet', planet })
              }
              onSelectAspect={(index) =>
                setSelection(
                  index != null && sky.aspects[index]
                    ? { kind: 'aspect', key: skyAspectKey(sky.aspects[index]) }
                    : null
                )
              }
              onSelectHouse={() => {}}
            />
          </View>
          <View style={styles.readout} testID="current-sky-selection">
            {selectedPlanet ? (
              <AppText variant="body" style={styles.selectedText}>
                {`${PLANET_GLYPH[selectedPlanet.name]} ${selectedPlanet.name} · ${formatSkyPosition(selectedPlanet.lon)}`}
              </AppText>
            ) : selectedAspect && selectedRule && separation != null ? (
              <>
                <AppText variant="body" style={styles.selectedText}>
                  {`${selectedAspect.a} · ${selectedAspect.b}`}
                </AppText>
                <AppText variant="bodySmall" style={styles.selectedText}>
                  {`${selectedRule.label} · within ${selectedRule.orb}° orb`}
                </AppText>
                <AppText variant="bodySmall" style={styles.selectedText}>
                  {`${separation.toFixed(2)}° zodiac separation`}
                </AppText>
                <AppText variant="caption" style={styles.hint}>
                  {`${selectedAspect.orb > 0 && selectedAspect.orb < 0.005 ? '<0.01' : selectedAspect.orb.toFixed(2)}° from exact ${selectedRule.angle}°`}
                </AppText>
              </>
            ) : (
              <AppText variant="bodySmall" style={styles.selectedText}>
                Tap a planet or aspect to explore.
              </AppText>
            )}
          </View>
          <AppText variant="caption" style={styles.hint}>
            Tropical zodiac · Earth-centered view. Pinch to zoom.
          </AppText>
          <Pressable
            testID="current-sky-rules-toggle"
            accessibilityRole="button"
            accessibilityState={{ expanded: showRules }}
            onPress={() => setShowRules((current) => !current)}
            style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
          >
            <AppText variant="bodySmall" style={styles.toggleText}>
              {showRules
                ? 'Hide calculation rules'
                : 'How aspects are calculated'}
            </AppText>
          </Pressable>
          {showRules ? (
            <View style={styles.rules} testID="current-sky-rules">
              <AppText variant="bodySmall" style={styles.description}>
                Aspects compare two bodies’ positions around the zodiac. An orb
                is the allowed distance from an exact angle. Naksha uses these
                limits for every pair:
              </AppText>
              {ASPECT_RULES.map((rule) => (
                <AppText
                  key={rule.type}
                  variant="bodySmall"
                  style={styles.description}
                >
                  {`${rule.label}: ${rule.angle}° · up to ${rule.orb}° orb`}
                </AppText>
              ))}
              <AppText variant="bodySmall" style={styles.description}>
                A pair qualifies when its distance from the exact angle is at or
                below the limit, using unrounded positions. These are
                astrological conventions; other charts may use different orbs.
              </AppText>
              <AppText variant="caption" style={styles.description}>
                Positions use Astronomy Engine’s tropical zodiac calculations
                from Earth’s center, with a stated accuracy target of about 1
                arcminute (1/60°). Displayed decimals do not imply greater
                accuracy. This is zodiac longitude separation, not the full
                angle between two objects in the sky.
              </AppText>
              <AppText variant="caption" style={styles.description}>
                {`Calculated at ${sky.evaluatedAt.toISOString()} (UTC), using your device’s clock. Updates every minute while active.`}
              </AppText>
            </View>
          ) : null}
          <Pressable
            testID="current-sky-positions-toggle"
            accessibilityRole="button"
            accessibilityState={{ expanded: showPositions }}
            onPress={() => setShowPositions((current) => !current)}
            style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
          >
            <AppText variant="subheading" style={styles.toggleText}>
              {showPositions
                ? 'Hide planet positions'
                : 'Show all planet positions'}
            </AppText>
          </Pressable>
          {showPositions
            ? sky.planets.map((planet) => (
                <Pressable
                  key={planet.name}
                  testID={`current-sky-planet-${planet.name}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${planet.name}, ${formatSkyPosition(planet.lon)}`}
                  accessibilityState={{
                    selected: selectedPlanet?.name === planet.name,
                  }}
                  onPress={() =>
                    setSelection({
                      kind: 'planet',
                      planet: planet.name as PlanetAccent,
                    })
                  }
                  style={({ pressed }) => [
                    styles.position,
                    selectedPlanet?.name === planet.name &&
                      styles.positionSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText variant="body">{`${PLANET_GLYPH[planet.name]} ${planet.name}`}</AppText>
                  <AppText variant="numeric" style={styles.description}>
                    {formatSkyPosition(planet.lon)}
                  </AppText>
                </Pressable>
              ))
            : null}
          {error ? (
            <AppText variant="bodySmall" style={styles.description}>
              Couldn’t refresh the sky. Showing the last update.
            </AppText>
          ) : null}
          <Button
            title="Refresh sky"
            variant="tertiary"
            size="sm"
            onPress={refresh}
            disabled={!active}
          />
        </>
      ) : error ? (
        <>
          <AppText variant="bodySmall" style={styles.description}>
            Couldn’t calculate the current sky.
          </AppText>
          <Button
            title="Try again"
            variant="tertiary"
            onPress={refresh}
            disabled={!active}
          />
        </>
      ) : (
        <LoadingState label="Reading the current sky" size="small" />
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  description: { color: theme.text.secondary },
  timestamp: {
    color: theme.text.tertiary,
    marginTop: theme.space.xs,
    marginBottom: theme.space.sm,
  },
  readout: {
    minHeight: 52,
    justifyContent: 'center',
    paddingVertical: theme.space.sm,
  },
  selectedText: { textAlign: 'center' },
  hint: { color: theme.text.tertiary, textAlign: 'center' },
  toggle: {
    minHeight: theme.touchTarget.min,
    justifyContent: 'center',
    marginTop: theme.space.sm,
  },
  toggleText: { color: theme.accent.base, textAlign: 'center' },
  rules: { gap: theme.space.sm, paddingVertical: theme.space.sm },
  pressed: { opacity: 0.7 },
  position: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.space.sm,
    paddingVertical: theme.space.md,
    minHeight: theme.touchTarget.min,
  },
  positionSelected: { backgroundColor: theme.cardSurface.selected },
})
