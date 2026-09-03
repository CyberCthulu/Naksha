//components/charts/ChartWheel.tsx
import React from 'react'
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg'
import { Aspect, HouseCusp, PlanetPos } from '../../lib/astro'
import { theme } from '../ui/theme'

type PlanetAccentName = keyof typeof theme.planet

/**
 * Structural line weights, brightest to faintest.
 *
 * The border tokens are 10-18% alpha hairlines intended for card edges on a
 * solid surface. At 1px over a gradient they all but vanish, so the wheel
 * paints its structure with a solid slate and an explicit opacity per role.
 * This keeps one deliberate order of visual weight: focused planet, planet
 * discs, sign glyphs, house numbers, rim, house lines, sign ticks, aspects.
 */
const WHEEL = {
  rim: 0.55,
  innerRim: 0.34,
  signTick: 0.3,
  houseLine: 0.42,
  aspect: 0.4,
  planetRing: 0.5,
} as const

const ZODIAC_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi']

const GLYPH: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
}

type Props = {
  size: number
  planets: PlanetPos[]
  aspects: Aspect[]
  houses: HouseCusp[] | null
  /** Visual emphasis only. Never affects geometry. */
  focusedPlanet?: PlanetAccentName | null
}

export default function ChartWheel({
  size,
  planets,
  aspects,
  houses,
  focusedPlanet = null,
}: Props) {
  const pad = 16
  const cx = size / 2
  const cy = size / 2
  const rOuter = size / 2 - 8
  const rInner = rOuter - 26
  const rPlanets = (rOuter + rInner) / 2
  const rAspect = rInner - 6

  const rHouseOuter = rInner - 2
  const rHouseInner = rInner - 22
  const rHouseLabel = rHouseInner - 10

  const toXY = (lonDeg: number, radius: number) => {
    const ang = (lonDeg * Math.PI) / 180
    const x = cx + Math.cos(-ang + Math.PI / 2) * radius
    const y = cy + Math.sin(-ang + Math.PI / 2) * radius
    return { x, y }
  }

  const aspectStroke: Record<Aspect['type'], number> = {
    conj: 2.0,
    opp: 1.8,
    trine: 1.6,
    square: 1.6,
    sextile: 1.2,
  }

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`${-pad} ${-pad} ${size + pad * 2} ${size + pad * 2}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Circle
        cx={cx}
        cy={cy}
        r={rOuter}
        stroke={theme.text.tertiary}
        strokeOpacity={WHEEL.rim}
        strokeWidth={1}
        fill="none"
      />
      <Circle
        cx={cx}
        cy={cy}
        r={rInner}
        stroke={theme.text.tertiary}
        strokeOpacity={WHEEL.innerRim}
        strokeWidth={1}
        fill="none"
      />

      {Array.from({ length: 12 }).map((_, i) => {
        const ang = i * 30
        const { x: x1, y: y1 } = toXY(ang, rInner)
        const { x: x2, y: y2 } = toXY(ang, rOuter)
        const { x: lx, y: ly } = toXY(ang, rOuter + 12)

        return (
          <G key={`sign-${i}`}>
            <Line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={theme.text.tertiary}
              strokeOpacity={WHEEL.signTick}
              strokeWidth={1}
            />
            <SvgText
              x={lx}
              y={ly}
              fontSize={10}
              textAnchor="middle"
              dy={3}
              fill={theme.accent.base}
            >
              {ZODIAC_ABBR[i]}
            </SvgText>
          </G>
        )
      })}

      {houses?.map((h) => {
        const { x: x1, y: y1 } = toXY(h.lon, rHouseInner)
        const { x: x2, y: y2 } = toXY(h.lon, rHouseOuter)
        const midLon = h.lon + 15
        const { x: lx, y: ly } = toXY(midLon, rHouseLabel)

        return (
          <G key={`house-${h.house}`}>
            <Line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={theme.text.tertiary}
              strokeOpacity={WHEEL.houseLine}
              strokeWidth={1}
            />
            <SvgText
              x={lx}
              y={ly}
              fontSize={9}
              textAnchor="middle"
              dy={3}
              fill={theme.text.secondary}
            >
              {h.house}
            </SvgText>
          </G>
        )
      })}

      {aspects.map((a, idx) => {
        const A = planets.find((p) => p.name === a.a)
        const B = planets.find((p) => p.name === a.b)
        if (!A || !B) return null

        const { x: x1, y: y1 } = toXY(A.lon, rAspect)
        const { x: x2, y: y2 } = toXY(B.lon, rAspect)

        return (
          <Line
            key={`${a.a}-${a.b}-${idx}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={theme.text.tertiary}
            strokeWidth={aspectStroke[a.type]}
            opacity={WHEEL.aspect}
            strokeDasharray={
              a.type === 'sextile' ? '4 4' : a.type === 'trine' ? '8 6' : undefined
            }
          />
        )
      })}

      {planets.map((p) => {
        const { x, y } = toXY(p.lon, rPlanets)
        const glyph = GLYPH[p.name] ?? p.name[0]
        const isFocused = focusedPlanet === p.name
        const accent = isFocused
          ? theme.planet[p.name as PlanetAccentName]
          : theme.accent.base

        return (
          <G key={p.name}>
            {/* Focused halo. Purely decorative; the marker position is
                unchanged and the geometry above is untouched. */}
            {isFocused ? (
              <Circle cx={x} cy={y} r={15} fill={accent} opacity={0.14} />
            ) : null}
            <Circle
              cx={x}
              cy={y}
              r={9}
              fill={theme.background.raised}
              stroke={isFocused ? accent : theme.text.tertiary}
              strokeOpacity={isFocused ? 1 : WHEEL.planetRing}
              strokeWidth={isFocused ? 1.5 : 1}
            />
            <SvgText
              x={x}
              y={y}
              fontSize={9}
              fill={isFocused ? accent : theme.text.primary}
              textAnchor="middle"
              dy={3}
            >
              {glyph}
            </SvgText>
          </G>
        )
      })}
    </Svg>
  )
}