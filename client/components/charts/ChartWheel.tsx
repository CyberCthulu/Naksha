import React from 'react'
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg'
import { Aspect, HouseCusp, PlanetPos } from '../../lib/astro'
import { theme } from '../ui/theme'

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
}

export default function ChartWheel({ size, planets, aspects, houses }: Props) {
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
    >
      <Circle
        cx={cx}
        cy={cy}
        r={rOuter}
        stroke={theme.colors.border}
        strokeWidth={1}
        fill="none"
      />
      <Circle
        cx={cx}
        cy={cy}
        r={rInner}
        stroke="rgba(255,255,255,0.25)"
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
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={1}
            />
            <SvgText
              x={lx}
              y={ly}
              fontSize={10}
              textAnchor="middle"
              dy={3}
              fill={theme.colors.text}
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
              stroke="rgba(255,255,255,0.55)"
              strokeWidth={1}
            />
            <SvgText
              x={lx}
              y={ly}
              fontSize={9}
              textAnchor="middle"
              dy={3}
              fill={theme.colors.text}
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
            stroke="rgba(255,255,255,0.45)"
            strokeWidth={aspectStroke[a.type]}
            opacity={0.85}
            strokeDasharray={
              a.type === 'sextile' ? '4 4' : a.type === 'trine' ? '8 6' : undefined
            }
          />
        )
      })}

      {planets.map((p) => {
        const { x, y } = toXY(p.lon, rPlanets)
        const glyph = GLYPH[p.name] ?? p.name[0]

        return (
          <G key={p.name}>
            <Circle
              cx={x}
              cy={y}
              r={9}
              fill="rgba(0,0,0,0.55)"
              stroke={theme.colors.border}
              strokeWidth={1}
            />
            <SvgText
              x={x}
              y={y}
              fontSize={9}
              fill={theme.colors.text}
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