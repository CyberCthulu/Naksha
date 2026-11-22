import React from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg'

import { theme } from './theme'

export type CelestialMotif = 'sun' | 'cycle' | 'orbits' | 'houses' | 'aspects'

/**
 * Small editorial ornaments for guidance and chart headings. These are fixed
 * illustrations, not current Moon phases, placements, or chart measurements.
 * Functional icons and the chart's meaningful glyphs remain separate.
 */
export function CelestialMark({ motif }: { motif: CelestialMotif }) {
  return (
    <View
      style={styles.mark}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={32} height={32} viewBox="0 0 32 32" accessible={false}>
        <G
          fill="none"
          stroke={theme.accent.base}
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {motif === 'sun' ? (
            <>
              <Circle cx={16} cy={16} r={6.2} />
              <Circle cx={16} cy={16} r={2} strokeOpacity={0.55} />
              <Path d="M16 2.5v4M16 25.5v4M2.5 16h4M25.5 16h4" />
              <Path
                d="m6.4 6.4 2.9 2.9m13.4 13.4 2.9 2.9m-19.2 0 2.9-2.9M22.7 9.3l2.9-2.9"
                strokeOpacity={0.65}
              />
            </>
          ) : null}

          {motif === 'cycle' ? (
            <>
              <Path d="M18.8 7.3a9.3 9.3 0 1 0 5.9 16.6A10 10 0 0 1 18.8 7.3Z" />
              <Path
                d="M6.4 7.4a13 13 0 0 1 20.8 2.1M27.7 20.5a13 13 0 0 1-4.3 5.9"
                strokeOpacity={0.45}
              />
              <Path d="m24 11 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" />
              <Circle
                cx={3.8}
                cy={10.8}
                r={0.9}
                fill={theme.text.primary}
                stroke="none"
              />
              <Circle
                cx={19.7}
                cy={28.5}
                r={0.9}
                fill={theme.accent.base}
                stroke="none"
              />
            </>
          ) : null}

          {motif === 'orbits' ? (
            <>
              <Circle cx={16} cy={16} r={4.6} />
              <Ellipse
                cx={16}
                cy={16}
                rx={14}
                ry={7}
                rotation={-35}
                origin="16, 16"
                strokeOpacity={0.65}
              />
              <Path
                d="M12.1 3.6A13 13 0 0 1 28.4 20M19.9 28.4A13 13 0 0 1 3.6 12"
                strokeOpacity={0.35}
              />
              <Circle
                cx={25.8}
                cy={7.1}
                r={2}
                fill={theme.accent.base}
                stroke="none"
              />
            </>
          ) : null}

          {motif === 'houses' ? (
            <>
              <Circle cx={16} cy={16} r={12} />
              <Circle cx={16} cy={16} r={5} strokeOpacity={0.5} />
              <Path
                d="M16 4v7M16 21v7M4 16h7M21 16h7m-22.4-6 6.1 3.5m8.6 5 6.1 3.5M10 5.6l3.5 6.1m5 8.6 3.5 6.1m-16.4-4.4 6.1-3.5m8.6-5 6.1-3.5M10 26.4l3.5-6.1m5-8.6L22 5.6"
                strokeOpacity={0.55}
              />
              <Circle
                cx={16}
                cy={16}
                r={1.3}
                fill={theme.text.primary}
                stroke="none"
              />
            </>
          ) : null}

          {motif === 'aspects' ? (
            <>
              <Circle cx={16} cy={16} r={12.5} strokeOpacity={0.35} />
              <Path d="m8 24 6-19 13 14Z" strokeOpacity={0.8} />
              <Path d="m8 24 9-9 10 4" strokeOpacity={0.4} />
              <Circle cx={14} cy={5} r={2} fill={theme.accent.base} stroke="none" />
              <Circle cx={8} cy={24} r={2} fill={theme.accent.base} stroke="none" />
              <Circle cx={27} cy={19} r={2} fill={theme.text.primary} stroke="none" />
            </>
          ) : null}
        </G>
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  mark: {
    width: 32,
    height: 32,
    flexShrink: 0,
  },
})
