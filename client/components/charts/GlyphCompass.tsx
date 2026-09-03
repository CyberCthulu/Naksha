// components/charts/GlyphCompass.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  AccessibilityInfo,
  BackHandler,
  findNodeHandle,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AppText } from '../ui/AppText'
import { Icon } from '../ui/Icon'
import { theme } from '../ui/theme'
import { GlyphCompassContent } from './ChartCompass'

/**
 * Height the chart scroll must reserve so its last row can clear the trigger.
 * Exported so ChartScreenContent cannot drift out of step with it.
 */
export const GLYPH_COMPASS_TRIGGER_CLEARANCE =
  theme.touchTarget.min + theme.space.xxxl

type Props = {
  /** Hidden while another chart overlay owns the screen. */
  hidden?: boolean
}

/**
 * Route-level legend for the chart wheel.
 *
 * Deliberately not a Modal. A legend is only useful while the thing it
 * explains is still being read, so the chart behind stays scrollable and
 * interactive: the full-screen wrapper is box-none and lets every touch
 * outside the panel through, there is no scrim, and the panel is not marked
 * accessibility-modal. The chart is not disabled, moved, or re-mounted when
 * the panel opens.
 *
 * Because touches pass through, tap-outside does not dismiss — that gesture
 * belongs to the chart. Dismissal is the close control or Android back.
 */
export function GlyphCompass({ hidden = false }: Props) {
  const [open, setOpen] = useState(false)
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const triggerRef = useRef<View>(null)

  const close = useCallback(() => {
    setOpen(false)

    // Return assistive focus to the control that opened the panel, where the
    // platform supports it. Best effort: RN offers no guarantee here.
    requestAnimationFrame(() => {
      const node = triggerRef.current && findNodeHandle(triggerRef.current)
      if (node) AccessibilityInfo.setAccessibilityFocus(node)
    })
  }, [])

  // Android back closes the legend before it leaves the Chart route.
  useEffect(() => {
    if (!open) return

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        close()
        return true
      }
    )

    return () => subscription.remove()
  }, [open, close])

  const showTrigger = !hidden && !open

  return (
    <View
      testID="glyph-compass-layer"
      // Everything outside the trigger and panel belongs to the chart.
      pointerEvents="box-none"
      style={StyleSheet.absoluteFill}
    >
      {showTrigger ? (
        <Pressable
          ref={triggerRef}
          testID="glyph-compass-trigger"
          accessibilityRole="button"
          accessibilityLabel="Glyph Compass"
          accessibilityHint="Opens the chart symbol legend"
          accessibilityState={{ expanded: false }}
          onPress={() => setOpen(true)}
          style={({ pressed }) => [
            styles.trigger,
            { bottom: insets.bottom + theme.space.lg },
            pressed && styles.pressed,
          ]}
        >
          <Icon name="expand" size="sm" color={theme.accent.base} />
          <AppText variant="caption" style={styles.triggerLabel}>
            Compass
          </AppText>
        </Pressable>
      ) : null}

      {open ? (
        <View
          testID="glyph-compass-panel"
          accessibilityLabel="Glyph Compass"
          // Normal handling inside the panel; the wrapper above stays box-none.
          pointerEvents="auto"
          style={[
            styles.panel,
            {
              maxHeight: Math.round(height * 0.55),
              bottom: insets.bottom,
              paddingBottom: theme.space.lg,
            },
          ]}
        >
          <View style={styles.panelHeader}>
            <AppText variant="heading" style={styles.panelTitle}>
              Glyph Compass
            </AppText>

            <Pressable
              testID="glyph-compass-close"
              accessibilityRole="button"
              accessibilityLabel="Close Glyph Compass"
              onPress={close}
              style={({ pressed }) => [
                styles.close,
                pressed && styles.pressed,
              ]}
            >
              <Icon name="close" size="lg" />
            </Pressable>
          </View>

          <ScrollView
            testID="glyph-compass-scroll"
            contentContainerStyle={styles.panelContent}
            showsVerticalScrollIndicator={false}
          >
            <GlyphCompassContent />
          </ScrollView>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  /*
   * Compact on purpose.
   *
   * The wide "Glyph Compass" pill sat over the hero copy and the "Read full
   * interpretation" action. This keeps the full 48dp touch target -- the
   * minHeight and the horizontal padding still add up to it -- while taking
   * far less width, and the chart reserves matching bottom clearance so no
   * final content can be trapped underneath.
   */
  trigger: {
    position: 'absolute',
    right: theme.space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: theme.space.hair,
    minWidth: theme.touchTarget.min,
    minHeight: theme.touchTarget.min,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.border.accent,
    backgroundColor: theme.surface.raised,
  },
  triggerLabel: {
    color: theme.accent.base,
  },
  pressed: {
    opacity: 0.7,
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: theme.surface.raised,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderTopWidth: 1,
    borderColor: theme.border.strong,
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.sm,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitle: {
    color: theme.text.primary,
    flexShrink: 1,
  },
  close: {
    minWidth: theme.touchTarget.min,
    minHeight: theme.touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelContent: {
    paddingBottom: theme.space.lg,
  },
})
