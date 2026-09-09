// components/charts/ChartMark.tsx
import React from 'react'
import Svg, { Circle, G, Line } from 'react-native-svg'

import { theme } from '../ui/theme'

/**
 * The emblem for a saved natal chart.
 *
 * This replaced a real miniature `ChartWheel`, which the reference design and
 * the first implementation both called for. On a device it did not work: a
 * 64dp wheel draws twelve house divisions, twelve sign ticks, ten planet
 * glyphs and every aspect line into roughly four thousand pixels, and the
 * detail is not merely small -- it is destroyed. The row read as noise.
 *
 * So the mark identifies the *kind* of chart rather than the chart. That is
 * also the more useful distinction: a natal chart is one wheel, but synastry
 * and composite charts are not, and could never be drawn as one. Those become
 * sibling marks when they exist -- two interlocking rings, a split core --
 * which is only possible because nothing here is data-driven.
 *
 * Drawn *for* this size rather than scaled down to it: a handful of strokes
 * with real space between them. The geometry is a fixed 64-unit viewBox scaled
 * to `size`, so proportions and optical weight hold at any density.
 *
 * Decorative. The row's own accessible label carries the meaning, so callers
 * hide this from assistive technology.
 */

/** The design size. Geometry below is in these units. */
const CANVAS = 64
const CENTER = CANVAS / 2
const OUTER_RADIUS = 30
const INNER_RADIUS = 20
/** Ticks stop short of the inner ring so the two never collide optically. */
const TICK_OUTER = 29
const TICK_INNER = 23
const CORE_RADIUS = 2.75

/** Twelve divisions, drawn from twelve o'clock like the wheel itself. */
const TICKS = Array.from({ length: 12 }, (_, index) => {
  const radians = ((index * 30 - 90) * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  return {
    key: index,
    x1: CENTER + cos * TICK_INNER,
    y1: CENTER + sin * TICK_INNER,
    x2: CENTER + cos * TICK_OUTER,
    y2: CENTER + sin * TICK_OUTER,
  }
})

type Props = {
  /** Rendered width and height in dp. Defaults to the design size. */
  size?: number
}

export function ChartMark({ size = CANVAS }: Props) {
  return (
    <Svg
      testID="chart-mark"
      width={size}
      height={size}
      viewBox={`0 0 ${CANVAS} ${CANVAS}`}
    >
      <G>
        {/* A window onto the sky, so the mark seats itself on the card. */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={OUTER_RADIUS}
          fill={theme.background.base}
        />

        <Circle
          cx={CENTER}
          cy={CENTER}
          r={OUTER_RADIUS}
          fill="none"
          stroke={theme.accent.base}
          strokeWidth={1.25}
          opacity={0.9}
        />

        {TICKS.map((tick) => (
          <Line
            key={tick.key}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={theme.accent.base}
            strokeWidth={1}
            opacity={0.55}
          />
        ))}

        <Circle
          cx={CENTER}
          cy={CENTER}
          r={INNER_RADIUS}
          fill="none"
          stroke={theme.accent.base}
          strokeWidth={1}
          opacity={0.4}
        />

        <Circle
          cx={CENTER}
          cy={CENTER}
          r={CORE_RADIUS}
          fill={theme.accent.base}
          opacity={0.85}
        />
      </G>
    </Svg>
  )
}

export default ChartMark
